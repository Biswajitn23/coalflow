from __future__ import annotations

import csv
import io
import math
import os
import random
import sqlite3
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, make_response, request, send_from_directory
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("COALFLOW_DB", BASE_DIR / "coalflow.db"))
FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

app = Flask(
    __name__,
    static_folder=str(FRONTEND_DIST / "assets") if (FRONTEND_DIST / "assets").exists() else None,
    static_url_path="/assets"
)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_LOCK = threading.Lock()
STATE_LOCK = threading.Lock()
SIM_LOCK = threading.Lock()
SIM_THREAD_STARTED = False

DISCLAIMER = "Simulated educational prototype based on NTPC Kaniha (TSTPS) 6x500 MW power station. Not connected to real DCS/SCADA network."

# Plant control state
CONTROL_STATE: dict[str, Any] = {
    "status": "RUNNING",  # "RUNNING" | "PAUSED" | "STOPPED" | "EMERGENCY_STOP"
    "speed_pct": 75.0,
    "feed_rate_pct": 78.0,
    "operating_mode": "AUTO",
    "dust_suppression": True,
    "active_section": "CV-01",
    "emergency_reason": "",
    "trip_interlock_healthy": True,
}

# NTPC Kaniha (TSTPS) Generator Units: 6 x 500 MW = 3,000 MW Total Installed Capacity
NTPC_KANIHA_GENERATORS = [
    {
        "unit_id": "UNIT-01",
        "name": "Unit - I Generator",
        "stage": "Stage I",
        "commissioned": "February 1995",
        "rated_capacity_mw": 500,
        "rated_capacity_kw": 500000,
        "current_load_mw": 492.5,
        "current_load_kw": 492500,
        "load_percentage": 98.5,
        "status": "Full Commercial Load",
        "tone": "good",
        "voltage_kv": 21.0,
        "frequency_hz": 50.02,
        "steam_pressure_kg_cm2": 170.2,
        "steam_temp_c": 540.0,
        "coal_burn_rate_tph": 242.0,
        "boiler_bunker": "BNK-A (Unit 1)",
    },
    {
        "unit_id": "UNIT-02",
        "name": "Unit - II Generator",
        "stage": "Stage I",
        "commissioned": "March 1996",
        "rated_capacity_mw": 500,
        "rated_capacity_kw": 500000,
        "current_load_mw": 488.0,
        "current_load_kw": 488000,
        "load_percentage": 97.6,
        "status": "Full Commercial Load",
        "tone": "good",
        "voltage_kv": 21.0,
        "frequency_hz": 50.01,
        "steam_pressure_kg_cm2": 169.8,
        "steam_temp_c": 539.5,
        "coal_burn_rate_tph": 239.5,
        "boiler_bunker": "BNK-B (Unit 2)",
    },
    {
        "unit_id": "UNIT-03",
        "name": "Unit - III Generator",
        "stage": "Stage II",
        "commissioned": "January 2003",
        "rated_capacity_mw": 500,
        "rated_capacity_kw": 500000,
        "current_load_mw": 495.2,
        "current_load_kw": 495200,
        "load_percentage": 99.0,
        "status": "Full Commercial Load",
        "tone": "good",
        "voltage_kv": 21.0,
        "frequency_hz": 50.02,
        "steam_pressure_kg_cm2": 170.5,
        "steam_temp_c": 540.2,
        "coal_burn_rate_tph": 244.0,
        "boiler_bunker": "BNK-C (Unit 3)",
    },
    {
        "unit_id": "UNIT-04",
        "name": "Unit - IV Generator",
        "stage": "Stage II",
        "commissioned": "October 2003",
        "rated_capacity_mw": 500,
        "rated_capacity_kw": 500000,
        "current_load_mw": 485.6,
        "current_load_kw": 485600,
        "load_percentage": 97.1,
        "status": "Full Commercial Load",
        "tone": "good",
        "voltage_kv": 21.0,
        "frequency_hz": 50.00,
        "steam_pressure_kg_cm2": 168.9,
        "steam_temp_c": 538.8,
        "coal_burn_rate_tph": 238.2,
        "boiler_bunker": "BNK-D (Unit 4)",
    },
    {
        "unit_id": "UNIT-05",
        "name": "Unit - V Generator",
        "stage": "Stage II",
        "commissioned": "May 2004",
        "rated_capacity_mw": 500,
        "rated_capacity_kw": 500000,
        "current_load_mw": 490.4,
        "current_load_kw": 490400,
        "load_percentage": 98.1,
        "status": "Full Commercial Load",
        "tone": "good",
        "voltage_kv": 21.0,
        "frequency_hz": 50.03,
        "steam_pressure_kg_cm2": 170.1,
        "steam_temp_c": 540.0,
        "coal_burn_rate_tph": 241.0,
        "boiler_bunker": "BNK-E (Unit 5)",
    },
    {
        "unit_id": "UNIT-06",
        "name": "Unit - VI Generator",
        "stage": "Stage II",
        "commissioned": "February 2005",
        "rated_capacity_mw": 500,
        "rated_capacity_kw": 500000,
        "current_load_mw": 478.3,
        "current_load_kw": 478300,
        "load_percentage": 95.7,
        "status": "Commercial Load",
        "tone": "good",
        "voltage_kv": 21.0,
        "frequency_hz": 50.01,
        "steam_pressure_kg_cm2": 167.5,
        "steam_temp_c": 537.5,
        "coal_burn_rate_tph": 235.0,
        "boiler_bunker": "BNK-F (Unit 6)",
    },
]

EQUIPMENT_DATA = [
    {"id": "CV-01", "name": "Conveyor 1 (Train Unloading)", "area": "Rail Yard", "rating": "650 t/h / 120 kW", "status": "Running", "tone": "good", "temp_nom": 66.0, "vib_nom": 2.1, "running_hours": 1432.5},
    {"id": "CV-02", "name": "Conveyor 2 (Transfer Route)", "area": "Transfer Route", "rating": "650 t/h / 110 kW", "status": "Running", "tone": "good", "temp_nom": 68.4, "vib_nom": 2.4, "running_hours": 1390.2},
    {"id": "CR-01", "name": "Crusher 1 (Ring Granulator)", "area": "Crusher House", "rating": "800 t/h / 315 kW", "status": "Running", "tone": "good", "temp_nom": 74.1, "vib_nom": 3.4, "running_hours": 984.0},
    {"id": "VS-01", "name": "Vibrating Sieve 1", "area": "Screening Deck", "rating": "700 t/h / 45 kW", "status": "Running", "tone": "good", "temp_nom": 58.2, "vib_nom": 4.1, "running_hours": 1150.8},
    {"id": "MS-01", "name": "Iron Magnet 1", "area": "Tramp Iron Extractor", "rating": "1.8 Tesla Coil", "status": "Running", "tone": "good", "temp_nom": 54.0, "vib_nom": 1.1, "running_hours": 1820.0},
    {"id": "CV-04", "name": "Conveyor 4 (Storage Yard)", "area": "Storage Yard", "rating": "650 t/h / 150 kW", "status": "Running", "tone": "good", "temp_nom": 69.5, "vib_nom": 2.2, "running_hours": 1210.4},
    {"id": "CV-05", "name": "Conveyor 5 (Boiler Silos)", "area": "Boiler Feed", "rating": "650 t/h / 160 kW", "status": "Running", "tone": "good", "temp_nom": 71.0, "vib_nom": 2.6, "running_hours": 1640.1},
]

STOCKYARD_PILES = [
    {"id": "PILE-01", "name": "Grade G-10 Domestic Coal", "quantity_t": 58400, "capacity_t": 80000, "moisture_pct": 8.4, "gcv_kcal": 3650},
    {"id": "PILE-02", "name": "Grade G-11 Washed Coal", "quantity_t": 49200, "capacity_t": 70000, "moisture_pct": 7.8, "gcv_kcal": 3950},
    {"id": "PILE-03", "name": "Grade G-13 Blended Stock", "quantity_t": 34800, "capacity_t": 50000, "moisture_pct": 9.2, "gcv_kcal": 3350},
]


def connect_db() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    return connection


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with DB_LOCK, connect_db() as connection:
        connection.execute(
            """CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recorded_at TEXT NOT NULL,
                coal_flow REAL NOT NULL,
                belt_speed REAL NOT NULL,
                motor_temp REAL NOT NULL,
                motor_current REAL NOT NULL DEFAULT 140.0,
                crusher_vib REAL NOT NULL DEFAULT 3.2,
                stock_level REAL NOT NULL,
                bunker_level REAL NOT NULL DEFAULT 75.7,
                feed_rate REAL NOT NULL DEFAULT 78.0,
                power_kw REAL NOT NULL DEFAULT 480.0
            )"""
        )
        connection.execute(
            """CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                severity TEXT NOT NULL,
                equipment TEXT NOT NULL,
                message TEXT NOT NULL,
                parameter TEXT NOT NULL,
                value REAL NOT NULL,
                acknowledged INTEGER NOT NULL DEFAULT 0,
                resolved INTEGER NOT NULL DEFAULT 0
            )"""
        )

        count = connection.execute("SELECT COUNT(*) FROM readings").fetchone()[0]
        if count < 30:
            base = datetime.now(timezone.utc) - timedelta(hours=3)
            for i in range(40):
                stamp = (base + timedelta(minutes=i * 5)).isoformat(timespec="seconds")
                flow = 420.0 + math.sin(i * 0.25) * 20.0 + random.uniform(-6, 6)
                speed = 2.65 + math.cos(i * 0.25) * 0.1 + random.uniform(-0.02, 0.02)
                temp = 68.0 + (flow / 500.0) * 8.0 + random.uniform(-1, 1)
                connection.execute(
                    """INSERT INTO readings(recorded_at, coal_flow, belt_speed, motor_temp, stock_level, bunker_level)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (stamp, round(flow, 1), round(speed, 2), round(temp, 1), 72.8, 75.7),
                )
        connection.commit()


def compute_live_sample() -> dict[str, float]:
    with STATE_LOCK:
        status = CONTROL_STATE["status"]
        speed_pct = CONTROL_STATE["speed_pct"]
        feed_rate_pct = CONTROL_STATE["feed_rate_pct"]

    if status in ("STOPPED", "EMERGENCY_STOP"):
        return {
            "coal_flow": 0.0,
            "belt_speed": 0.0,
            "motor_temp": 46.0,
            "motor_current": 12.0,
            "crusher_vib": 0.2,
            "stock_level": 72.8,
            "bunker_level": 75.7,
            "feed_rate": 0.0,
            "power_kw": 18.0,
        }

    if status == "PAUSED":
        return {
            "coal_flow": 0.0,
            "belt_speed": 0.0,
            "motor_temp": 56.5,
            "motor_current": 35.0,
            "crusher_vib": 0.5,
            "stock_level": 72.8,
            "bunker_level": 75.7,
            "feed_rate": round(feed_rate_pct, 1),
            "power_kw": 40.0,
        }

    ratio = max(0.0, min(100.0, speed_pct)) / 100.0
    feed_ratio = max(0.0, min(100.0, feed_rate_pct)) / 100.0

    base_speed = ratio * 3.45
    belt_speed = base_speed + random.gauss(0, 0.02) if base_speed > 0 else 0.0

    base_flow = (belt_speed / 2.65) * (feed_ratio * 460.0)
    coal_flow = max(0.0, base_flow + random.gauss(0, 5.0))

    motor_temp = 52.0 + (coal_flow / 500.0) * 22.0 + random.gauss(0, 0.6)
    motor_current = 65.0 + (coal_flow / 500.0) * 85.0 + random.gauss(0, 1.2)
    crusher_vib = 2.2 + (coal_flow / 500.0) * 1.8 + random.gauss(0, 0.1)
    stock_level = 72.8 + math.sin(time.time() / 300.0) * 1.5
    bunker_level = 75.7 + math.cos(time.time() / 240.0) * 2.0
    power_kw = 120.0 + (coal_flow / 500.0) * 380.0

    return {
        "coal_flow": round(max(0.0, coal_flow), 1),
        "belt_speed": round(max(0.0, belt_speed), 2),
        "motor_temp": round(max(0.0, motor_temp), 1),
        "motor_current": round(max(0.0, motor_current), 1),
        "crusher_vib": round(max(0.0, crusher_vib), 2),
        "stock_level": round(min(100.0, max(0.0, stock_level)), 1),
        "bunker_level": round(min(100.0, max(0.0, bunker_level)), 1),
        "feed_rate": round(feed_rate_pct, 1),
        "power_kw": round(max(0.0, power_kw), 1),
    }


def insert_sample() -> None:
    values = compute_live_sample()
    timestamp = now_iso()
    with DB_LOCK, connect_db() as connection:
        connection.execute(
            """INSERT INTO readings(
                recorded_at, coal_flow, belt_speed, motor_temp,
                motor_current, crusher_vib, stock_level, bunker_level,
                feed_rate, power_kw
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                timestamp,
                values["coal_flow"],
                values["belt_speed"],
                values["motor_temp"],
                values["motor_current"],
                values["crusher_vib"],
                values["stock_level"],
                values["bunker_level"],
                values["feed_rate"],
                values["power_kw"],
            ),
        )
        connection.execute("DELETE FROM readings WHERE id NOT IN (SELECT id FROM readings ORDER BY id DESC LIMIT 500)")
        connection.commit()


def simulation_loop() -> None:
    while True:
        time.sleep(3.5)
        try:
            insert_sample()
        except Exception as exc:
            app.logger.exception("Simulation sample failed: %s", exc)


def start_simulation() -> None:
    global SIM_THREAD_STARTED
    with SIM_LOCK:
        if not SIM_THREAD_STARTED:
            thread = threading.Thread(target=simulation_loop, daemon=True, name="coalflow-sim")
            thread.start()
            SIM_THREAD_STARTED = True


def get_rows(query: str, args: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with DB_LOCK, connect_db() as connection:
        rows = connection.execute(query, args).fetchall()
        return [dict(row) for row in rows]


def get_live_generators() -> list[dict[str, Any]]:
    """Calculates live power output in MW and kW for each of the 6 x 500 MW units."""
    result = []
    for gen in NTPC_KANIHA_GENERATORS:
        item = dict(gen)
        # Add realistic micro variations (+/- 2.5 MW)
        noise = random.uniform(-1.5, 1.5)
        mw = round(min(500.0, max(420.0, item["current_load_mw"] + noise)), 1)
        kw = int(mw * 1000)
        item["current_load_mw"] = mw
        item["current_load_kw"] = kw
        item["load_percentage"] = round((mw / item["rated_capacity_mw"]) * 100.0, 1)
        result.append(item)
    return result


# ============================================================================
# API ROUTES
# ============================================================================


@app.get("/api/health")
def health():
    return jsonify({
        "status": "healthy",
        "project": "CoalFlow",
        "facility": "NTPC Kaniha (TSTPS) 6x500 MW Prototype",
        "data_mode": "simulated",
        "timestamp": now_iso(),
    })


@app.get("/api/generators")
def generators_endpoint():
    """Returns exact electricity generated (in kW and MW) by each generator at NTPC Kaniha."""
    gens = get_live_generators()
    total_mw = sum(g["current_load_mw"] for g in gens)
    total_kw = int(total_mw * 1000)
    total_capacity_mw = sum(g["rated_capacity_mw"] for g in gens)  # 3000 MW
    total_capacity_kw = total_capacity_mw * 1000  # 3,000,000 kW

    return jsonify({
        "facility": "NTPC Kaniha (Talcher Super Thermal Power Station)",
        "unit_sizes": "6 X 500 MW",
        "total_installed_capacity_mw": total_capacity_mw,
        "total_installed_capacity_kw": total_capacity_kw,
        "total_generated_mw": round(total_mw, 1),
        "total_generated_kw": total_kw,
        "plant_load_factor_pct": round((total_mw / total_capacity_mw) * 100.0, 1),
        "grid_frequency_hz": 50.02,
        "generators": gens,
        "stages": [
            {
                "stage": "Stage I",
                "capacity_mw": 1000,
                "capacity_kw": 1000000,
                "grid_system": "Eastern & North-Eastern Regional Grid",
                "beneficiary_states": [
                    "Odisha (Orissa)",
                    "Bihar",
                    "Sikkim",
                    "Assam",
                    "Tripura",
                    "Damodar Valley Corporation (DVC)",
                    "West Bengal (WB)",
                    "Jharkhand"
                ],
                "units": [gens[0], gens[1]],
            },
            {
                "stage": "Stage II",
                "capacity_mw": 2000,
                "capacity_kw": 2000000,
                "grid_system": "Southern Regional Grid (via Talcher-Kolar ±500 kV HVDC Link)",
                "beneficiary_states": [
                    "Andhra Pradesh (AP)",
                    "Kerala",
                    "Karnataka",
                    "Tamil Nadu (TN)",
                    "Puducherry (Pondicherry)"
                ],
                "units": [gens[2], gens[3], gens[4], gens[5]],
            },
        ],
    })


@app.get("/api/plant-specs")
def plant_specs():
    """Returns authentic technical specifications and engineering factsheet for NTPC Kaniha."""
    return jsonify({
        "facility": {
            "name": "NTPC Talcher Super Thermal Power Station (TSTPS), Kaniha",
            "short_name": "NTPC Kaniha",
            "location": "Kaniha, Angul District, Odisha, India",
            "coordinates": "20.97° N, 85.08° E",
            "total_capacity_mw": 3000,
            "total_capacity_kw": 3000000,
            "unit_configuration": "6 X 500 MW Subcritical Coal-Fired Units",
            "commissioning_stages": {
                "stage_1": {
                    "capacity_mw": 1000,
                    "capacity_kw": 1000000,
                    "units": [
                        {"unit": "Unit I", "rating_mw": 500, "commissioned": "February 1995"},
                        {"unit": "Unit II", "rating_mw": 500, "commissioned": "March 1996"},
                    ],
                    "beneficiary_states": [
                        "Odisha (Orissa)", "Bihar", "West Bengal (WB)", "Jharkhand",
                        "Damodar Valley Corporation (DVC)", "Sikkim", "Assam", "Tripura"
                    ],
                    "transmission": "400 kV AC Eastern & North-Eastern Regional Grid",
                },
                "stage_2": {
                    "capacity_mw": 2000,
                    "capacity_kw": 2000000,
                    "units": [
                        {"unit": "Unit III", "rating_mw": 500, "commissioned": "January 2003"},
                        {"unit": "Unit IV", "rating_mw": 500, "commissioned": "October 2003"},
                        {"unit": "Unit V", "rating_mw": 500, "commissioned": "May 2004"},
                        {"unit": "Unit VI", "rating_mw": 500, "commissioned": "February 2005"},
                    ],
                    "beneficiary_states": [
                        "Andhra Pradesh (AP)", "Karnataka", "Tamil Nadu (TN)", "Kerala", "Puducherry (Pondicherry)"
                    ],
                    "transmission": "Talcher–Kolar ±500 kV HVDC Bi-pole Corridor (1,450 km, 2,500 MW)",
                },
            },
        },
        "coal_handling_plant_chp": {
            "coal_source": "Mahanadi Coalfields Limited (MCL) — Lingaraj & Kaniha Open Cast Mines (Talcher Coalfield)",
            "transport_mode": "Dedicated Merry-Go-Round (MGR) private railway loop & Overland Conveyor (OLC)",
            "rake_type": "58-wagon bottom-discharge BOBR (Box-Open-Bottom-Rapid) wagons",
            "track_hopper_length_m": 210,
            "unloading_time_per_rake_min": "25–35 minutes (automated bottom discharge)",
            "daily_coal_requirement_tonnes": "40,000 to 45,000 tonnes/day at 100% station load",
            "specific_coal_consumption": "0.68 – 0.72 kg per kWh generated",
            "stockyard_capacity_tonnes": 200000,
            "bunker_capacity_tonnes_per_unit": 650,
            "crusher_granulator_output_size": "< 20 mm for bowl mill pulverizers",
        },
        "water_and_steam": {
            "water_source": "Samal Barrage on the Brahmani River (approx 35 km away)",
            "water_transport": "Twin cross-country intake pipelines to on-site raw water reservoir",
            "reservoir_capacity_m3": "11 Million cubic meters",
            "boiler_steam_pressure": "170 kg/cm²",
            "boiler_steam_temperature_c": 540.0,
            "cooling_towers": "6 Natural Draught Cooling Towers (NDCT), ~140 meters high each",
        },
        "environmental_systems": {
            "chimney_height_m": 275,
            "chimney_count": "Twin 275m multi-flue reinforced concrete stacks (902 feet)",
            "particulate_control": "Electrostatic Precipitators (ESP) with 99.85% fly ash collection efficiency",
            "ash_disposal": "High Concentration Slurry Disposal (HCSD) to Ash Dykes + dry ash extraction for cement/road making",
            "dust_suppression": "Dry fog & water mist sprinkling at all conveyor transfer houses (TP-01 to TP-08)",
        },
        "viva_quick_guide": [
            {"question": "Where does coal come from?", "answer": "MCL Lingaraj & Kaniha mines in Talcher coalfield via dedicated MGR trains."},
            {"question": "How fast does the track hopper unload coal?", "answer": "The 210-meter track hopper unloads 58 bottom-discharge BOBR wagons in 25-35 minutes."},
            {"question": "Where does the cooling water come from?", "answer": "Samal Barrage on the Brahmani River via twin 35 km pipelines."},
            {"question": "How is power transmitted to southern states?", "answer": "Via the 1,450 km Talcher-Kolar ±500 kV HVDC bi-pole transmission line."},
            {"question": "What is the stack height?", "answer": "Twin 275-meter (902 ft) multi-flue chimneys to disperse emissions above atmospheric inversion layers."},
            {"question": "How much electricity does each generator produce?", "answer": "Each unit has a rated capacity of 500 MW (500,000 kW), giving 3,000 MW (3,000,000 kW) across all 6 units."},
        ],
    })


@app.get("/api/dashboard")
def dashboard():
    latest_rows = get_rows("SELECT * FROM readings ORDER BY id DESC LIMIT 1")
    if not latest_rows:
        insert_sample()
        latest_rows = get_rows("SELECT * FROM readings ORDER BY id DESC LIMIT 1")
    latest = latest_rows[0]

    with STATE_LOCK:
        ctrl = dict(CONTROL_STATE)

    history = get_rows("SELECT * FROM readings ORDER BY id DESC LIMIT 40")
    history.reverse()

    alerts = get_rows("SELECT * FROM alerts WHERE resolved = 0 ORDER BY acknowledged ASC, id DESC LIMIT 15")
    gens = get_live_generators()
    total_mw = sum(g["current_load_mw"] for g in gens)
    total_kw = int(total_mw * 1000)

    metrics = [
        {
            "key": "coal_flow",
            "label": "Coal Moving Now",
            "value": latest["coal_flow"],
            "unit": "tonnes/hr",
            "target": "Normal: 360–520 t/h",
            "tone": "normal",
            "delta": "+3.4%",
        },
        {
            "key": "belt_speed",
            "label": "Conveyor Belt Speed",
            "value": latest["belt_speed"],
            "unit": "m/s",
            "target": "Target: 2.65 m/s",
            "tone": "normal",
            "delta": f"{ctrl['speed_pct']:.0f}% set",
        },
        {
            "key": "power_generated",
            "label": "Electricity Produced Now",
            "value": f"{round(total_mw, 1)} MW",
            "unit": f"({total_kw:,} kW)",
            "target": "Rated: 3,000 MW (6x500 MW)",
            "tone": "normal",
            "delta": f"{round((total_mw/3000)*100, 1)}% Grid Load",
        },
        {
            "key": "stock_quantity",
            "label": "Coal in Storage Yard",
            "value": 142400,
            "unit": "tonnes",
            "percentage": latest["stock_level"],
            "target": "Capacity: 200,000 t",
            "tone": "normal",
            "delta": "~18.2 Days Fuel",
        },
        {
            "key": "bunker_level",
            "label": "Boiler Silos Filling",
            "value": latest["bunker_level"],
            "unit": "%",
            "target": "Normal: 60–85%",
            "tone": "normal",
            "delta": "6 Silos Online",
        },
        {
            "key": "active_equipment",
            "label": "Machines Running",
            "value": f"7/7",
            "unit": "units",
            "target": "7 Tracked Assets",
            "tone": "normal",
            "delta": "100% Online",
        },
    ]

    return jsonify({
        "generated_at": latest.get("recorded_at", now_iso()),
        "data_mode": "simulated",
        "facility": "NTPC Kaniha Prototype",
        "disclaimer": DISCLAIMER,
        "controls": ctrl,
        "metrics": metrics,
        "equipment": EQUIPMENT_DATA,
        "alerts": alerts,
        "history": history,
        "generators": gens,
        "total_power": {
            "total_mw": round(total_mw, 1),
            "total_kw": total_kw,
            "rated_mw": 3000,
            "rated_kw": 3000000,
            "units_count": 6,
            "unit_size": "500 MW each",
        },
        "stockyard_piles": STOCKYARD_PILES,
        "summary": {
            "equipment_count": len(EQUIPMENT_DATA),
            "running_count": len(EQUIPMENT_DATA),
            "active_alerts": len([a for a in alerts if not a["acknowledged"]]),
            "stock_level": latest["stock_level"],
            "bunker_level": latest["bunker_level"],
            "total_mw": round(total_mw, 1),
            "total_kw": total_kw,
        },
    })


@app.get("/api/controls")
def get_controls():
    with STATE_LOCK:
        return jsonify(dict(CONTROL_STATE))


@app.post("/api/controls")
def update_controls():
    payload = request.get_json(silent=True) or {}
    with STATE_LOCK:
        if "status" in payload:
            CONTROL_STATE["status"] = payload["status"]
            if payload["status"] == "RUNNING":
                CONTROL_STATE["emergency_reason"] = ""
                CONTROL_STATE["trip_interlock_healthy"] = True
        if "speed_pct" in payload:
            CONTROL_STATE["speed_pct"] = max(0.0, min(100.0, float(payload["speed_pct"])))
        if "feed_rate_pct" in payload:
            CONTROL_STATE["feed_rate_pct"] = max(0.0, min(100.0, float(payload["feed_rate_pct"])))
        updated = dict(CONTROL_STATE)

    insert_sample()
    return jsonify({"status": "updated", "controls": updated})


@app.post("/api/controls/emergency-stop")
def emergency_stop():
    payload = request.get_json(silent=True) or {}
    reason = payload.get("reason", "Operator Emergency Stop")
    with STATE_LOCK:
        CONTROL_STATE["status"] = "EMERGENCY_STOP"
        CONTROL_STATE["emergency_reason"] = reason
        CONTROL_STATE["trip_interlock_healthy"] = False
        updated = dict(CONTROL_STATE)

    insert_sample()
    return jsonify({"status": "tripped", "controls": updated})


@app.post("/api/controls/reset-emergency")
def reset_emergency():
    with STATE_LOCK:
        CONTROL_STATE["status"] = "STOPPED"
        CONTROL_STATE["emergency_reason"] = ""
        CONTROL_STATE["trip_interlock_healthy"] = True
        updated = dict(CONTROL_STATE)

    insert_sample()
    return jsonify({"status": "reset", "controls": updated})


@app.get("/api/analytics")
def analytics():
    time_range = request.args.get("range", "1h")
    limit = 30 if time_range == "1h" else (90 if time_range == "6h" else 200)
    rows = get_rows(f"SELECT * FROM readings ORDER BY id DESC LIMIT {limit}")
    rows.reverse()
    return jsonify({"range": time_range, "count": len(rows), "data": rows})


@app.get("/api/stockyard")
def stockyard():
    total_qty = sum(p["quantity_t"] for p in STOCKYARD_PILES)
    return jsonify({
        "total_quantity_t": total_qty,
        "total_capacity_t": 200000,
        "fill_percentage": round((total_qty / 200000.0) * 100.0, 1),
        "days_stock": round(total_qty / 7800.0, 1),
        "piles": STOCKYARD_PILES,
    })


@app.get("/api/bunkers")
def bunkers():
    return jsonify({
        "bunkers": [
            {"id": "BNK-A", "unit": "Unit 1 (500 MW)", "capacity_t": 650, "level_pct": 78.4, "status": "Feeding Boiler 1", "feed_rate_tph": 74.0, "temp_c": 38.5},
            {"id": "BNK-B", "unit": "Unit 2 (500 MW)", "capacity_t": 650, "level_pct": 82.1, "status": "Feeding Boiler 2", "feed_rate_tph": 76.5, "temp_c": 39.1},
            {"id": "BNK-C", "unit": "Unit 3 (500 MW)", "capacity_t": 650, "level_pct": 69.3, "status": "Feeding Boiler 3", "feed_rate_tph": 75.0, "temp_c": 37.0},
            {"id": "BNK-D", "unit": "Unit 4 (500 MW)", "capacity_t": 650, "level_pct": 74.8, "status": "Feeding Boiler 4", "feed_rate_tph": 75.0, "temp_c": 38.8},
            {"id": "BNK-E", "unit": "Unit 5 (500 MW)", "capacity_t": 650, "level_pct": 88.2, "status": "Feeding Boiler 5", "feed_rate_tph": 78.2, "temp_c": 40.2},
            {"id": "BNK-F", "unit": "Unit 6 (500 MW)", "capacity_t": 650, "level_pct": 63.5, "status": "Feeding Boiler 6", "feed_rate_tph": 72.0, "temp_c": 36.9},
        ],
        "average_fill_pct": 75.7,
    })


@app.get("/api/alerts")
def get_alerts():
    rows = get_rows("SELECT * FROM alerts ORDER BY resolved ASC, acknowledged ASC, id DESC LIMIT 100")
    return jsonify({"alerts": rows})


@app.post("/api/alerts/<int:alert_id>/acknowledge")
def ack_alert(alert_id: int):
    with DB_LOCK, connect_db() as connection:
        connection.execute("UPDATE alerts SET acknowledged = 1 WHERE id = ?", (alert_id,))
        connection.commit()
    return jsonify({"status": "acknowledged", "id": alert_id})


@app.post("/api/alerts/<int:alert_id>/resolve")
def resolve_alert(alert_id: int):
    with DB_LOCK, connect_db() as connection:
        connection.execute("UPDATE alerts SET resolved = 1, acknowledged = 1 WHERE id = ?", (alert_id,))
        connection.commit()
    return jsonify({"status": "resolved", "id": alert_id})


@app.post("/api/alerts/simulate")
def simulate_alert():
    timestamp = now_iso()
    with DB_LOCK, connect_db() as connection:
        cursor = connection.execute(
            "INSERT INTO alerts(created_at, severity, equipment, message, parameter, value, acknowledged, resolved) VALUES (?, 'warning', 'CV-02 Belt', 'Belt sway limit switch triggered. Inspection advised.', 'belt_sway', 1.0, 0, 0)",
            (timestamp,),
        )
        connection.commit()
        alert_id = cursor.lastrowid
    return jsonify({"status": "created", "alert_id": alert_id})


@app.get("/api/reports")
def get_reports():
    return jsonify({
        "facility": "NTPC Kaniha 6x500 MW (3,000 MW Total)",
        "report_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "shift": "Shift-A (06:00 - 14:00 hrs)",
        "summary": {
            "total_coal_handled_tonnes": 3840.0,
            "bunker_supplied_tonnes": 3120.0,
            "stockpile_transferred_tonnes": 720.0,
            "plant_availability_pct": 98.4,
            "average_flow_tph": 420.0,
            "average_speed_ms": 2.65,
            "average_motor_temp_c": 68.2,
            "total_power_consumed_kwh": 3140.0,
            "specific_power_kwh_per_tonne": 0.82,
        },
        "equipment_hours": [
            {"id": "CV-01", "name": "Receiving Conveyor", "hours": 1432.5, "trips": 0, "status": "Healthy"},
            {"id": "CV-02", "name": "Transfer Conveyor", "hours": 1390.2, "trips": 0, "status": "Healthy"},
            {"id": "CR-01", "name": "Ring Granulator Crusher", "hours": 984.0, "trips": 1, "status": "Healthy"},
            {"id": "VS-01", "name": "Vibrating Sieve", "hours": 1150.8, "trips": 0, "status": "Healthy"},
            {"id": "MS-01", "name": "Iron Magnet", "hours": 1820.0, "trips": 0, "status": "Healthy"},
            {"id": "CV-04", "name": "Storage Yard Conveyor", "hours": 1210.4, "trips": 0, "status": "Healthy"},
            {"id": "CV-05", "name": "Boiler Silo Tripper", "hours": 1640.1, "trips": 0, "status": "Healthy"},
        ],
    })


@app.get("/api/export.csv")
def export_csv():
    rows = get_rows("SELECT recorded_at, coal_flow, belt_speed, motor_temp, stock_level, bunker_level FROM readings ORDER BY id DESC LIMIT 500")
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["recorded_at", "coal_flow", "belt_speed", "motor_temp", "stock_level", "bunker_level"])
    writer.writeheader()
    writer.writerows(rows)
    response = make_response(output.getvalue())
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    response.headers["Content-Disposition"] = "attachment; filename=coalflow-readings.csv"
    return response


# ============================================================================
# PRODUCTION SPA FRONTEND SERVING (RENDER / CLOUD DEPLOYMENT)
# ============================================================================


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    if path.startswith("api/"):
        return jsonify({"error": "API route not found"}), 404

    # Direct static file in dist
    file_path = FRONTEND_DIST / path
    if path != "" and file_path.exists() and file_path.is_file():
        return send_from_directory(FRONTEND_DIST, path)

    # Assets subfolder
    asset_path = FRONTEND_DIST / "assets" / path
    if path != "" and asset_path.exists() and asset_path.is_file():
        return send_from_directory(FRONTEND_DIST / "assets", path)

    # SPA index.html fallback
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return send_from_directory(FRONTEND_DIST, "index.html")

    return jsonify({
        "project": "CoalFlow SCADA API",
        "facility": "NTPC Kaniha Prototype",
        "status": "API Server Online",
        "note": "Frontend build not detected in frontend/dist. Run 'npm run build' inside frontend.",
    })


init_db()
start_simulation()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False, threaded=True)

