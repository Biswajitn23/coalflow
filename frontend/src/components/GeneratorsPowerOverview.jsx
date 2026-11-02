import React, { useState, useEffect } from 'react';
import {
  Zap, Activity, Flame, Wind, Gauge, CheckCircle2,
  Calendar, Layers, Sparkles, ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const STAGE_1_BENEFICIARIES = [
  { name: 'Odisha (Orissa)', code: 'OD', desc: 'Home state allocation', tag: 'Host State' },
  { name: 'Bihar', code: 'BR', desc: 'North & South Bihar Power', tag: 'Discom' },
  { name: 'West Bengal (WB)', code: 'WB', desc: 'WBSEDCL State Grid', tag: 'Discom' },
  { name: 'Jharkhand', code: 'JH', desc: 'JUVNL State Discom', tag: 'Discom' },
  { name: 'Damodar Valley Corp (DVC)', code: 'DVC', desc: 'Industrial Valley System', tag: 'Power Utility' },
  { name: 'Sikkim', code: 'SK', desc: 'Hill state power quota', tag: 'Discom' },
  { name: 'Assam', code: 'AS', desc: 'APDCL Power Discom', tag: 'North-East' },
  { name: 'Tripura', code: 'TR', desc: 'TSECL State Discom', tag: 'North-East' },
];

export const STAGE_2_BENEFICIARIES = [
  { name: 'Andhra Pradesh (AP)', code: 'AP', desc: 'Southern Grid HVDC Recipient', tag: 'HVDC Grid' },
  { name: 'Karnataka', code: 'KA', desc: 'Kolar HVDC Terminal Recipient', tag: 'HVDC Grid' },
  { name: 'Tamil Nadu (TN)', code: 'TN', desc: 'TANGEDCO Southern Grid Share', tag: 'HVDC Grid' },
  { name: 'Kerala', code: 'KL', desc: 'KSEB Southern Grid Allocation', tag: 'HVDC Grid' },
  { name: 'Puducherry (Pondicherry)', code: 'PY', desc: 'Union Territory Power Allocation', tag: 'HVDC Grid' },
];

export default function GeneratorsPowerOverview({ apiBase, dashboardGenerators }) {
  const [data, setData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('UNIT-01');

  useEffect(() => {
    const fetchGens = async () => {
      try {
        const res = await fetch(`${apiBase}/api/generators`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (e) {}
    };
    fetchGens();
    const timer = setInterval(fetchGens, 4000);
    return () => clearInterval(timer);
  }, [apiBase]);

  const generators = data?.generators || dashboardGenerators || [
    { unit_id: 'UNIT-01', name: 'Unit - I Generator', stage: 'Stage I', commissioned: 'February 1995', rated_capacity_mw: 500, rated_capacity_kw: 500000, current_load_mw: 492.5, current_load_kw: 492500, load_percentage: 98.5, status: 'Full Commercial Load', voltage_kv: 21.0, frequency_hz: 50.02, steam_pressure_kg_cm2: 170.2, steam_temp_c: 540.0, coal_burn_rate_tph: 242.0 },
    { unit_id: 'UNIT-02', name: 'Unit - II Generator', stage: 'Stage I', commissioned: 'March 1996', rated_capacity_mw: 500, rated_capacity_kw: 500000, current_load_mw: 488.0, current_load_kw: 488000, load_percentage: 97.6, status: 'Full Commercial Load', voltage_kv: 21.0, frequency_hz: 50.01, steam_pressure_kg_cm2: 169.8, steam_temp_c: 539.5, coal_burn_rate_tph: 239.5 },
    { unit_id: 'UNIT-03', name: 'Unit - III Generator', stage: 'Stage II', commissioned: 'January 2003', rated_capacity_mw: 500, rated_capacity_kw: 500000, current_load_mw: 495.2, current_load_kw: 495200, load_percentage: 99.0, status: 'Full Commercial Load', voltage_kv: 21.0, frequency_hz: 50.02, steam_pressure_kg_cm2: 170.5, steam_temp_c: 540.2, coal_burn_rate_tph: 244.0 },
    { unit_id: 'UNIT-04', name: 'Unit - IV Generator', stage: 'Stage II', commissioned: 'October 2003', rated_capacity_mw: 500, rated_capacity_kw: 500000, current_load_mw: 485.6, current_load_kw: 485600, load_percentage: 97.1, status: 'Full Commercial Load', voltage_kv: 21.0, frequency_hz: 50.00, steam_pressure_kg_cm2: 168.9, steam_temp_c: 538.8, coal_burn_rate_tph: 238.2 },
    { unit_id: 'UNIT-05', name: 'Unit - V Generator', stage: 'Stage II', commissioned: 'May 2004', rated_capacity_mw: 500, rated_capacity_kw: 500000, current_load_mw: 490.4, current_load_kw: 490400, load_percentage: 98.1, status: 'Full Commercial Load', voltage_kv: 21.0, frequency_hz: 50.03, steam_pressure_kg_cm2: 170.1, steam_temp_c: 540.0, coal_burn_rate_tph: 241.0 },
    { unit_id: 'UNIT-06', name: 'Unit - VI Generator', stage: 'Stage II', commissioned: 'February 2005', rated_capacity_mw: 500, rated_capacity_kw: 500000, current_load_mw: 478.3, current_load_kw: 478300, load_percentage: 95.7, status: 'Commercial Load', voltage_kv: 21.0, frequency_hz: 50.01, steam_pressure_kg_cm2: 167.5, steam_temp_c: 537.5, coal_burn_rate_tph: 235.0 },
  ];

  const totalMw = data?.total_generated_mw || generators.reduce((acc, g) => acc + g.current_load_mw, 0);
  const totalKw = data?.total_generated_kw || Math.round(totalMw * 1000);
  const totalCapacityMw = 3000;
  const totalCapacityKw = 3000000;
  const plantLoadFactor = ((totalMw / totalCapacityMw) * 100).toFixed(1);

  const selectedGen = generators.find(g => g.unit_id === selectedUnit) || generators[0];

  const stage1Units = generators.slice(0, 2);
  const stage2Units = generators.slice(2, 6);

  return (
    <div className="generators-root">
      {/* Header */}
      <div className="gen-page-header">
        <div>
          <div className="gen-badge">
            <Zap size={14} className="text-amber-500" />
            <span>NTPC KANIHA · 6 X 500 MW GENERATION FLEET</span>
          </div>
          <h2>Electricity Generated by Each Generator Unit</h2>
          <p className="gen-desc">
            Exact live electricity generation breakdown in both <strong>KiloWatts (kW)</strong> and <strong>MegaWatts (MW)</strong> for all 6 units across Stage I and Stage II.
          </p>
        </div>

        {/* Big Total Generation Counter */}
        <div className="total-generation-display">
          <div className="tg-item highlight">
            <span className="tg-label">TOTAL ELECTRICITY PRODUCED RIGHT NOW</span>
            <div className="tg-num-row">
              <strong className="tg-mega">{totalMw.toLocaleString(undefined, { maximumFractionDigits: 1 })} MW</strong>
              <span className="tg-kilo">({totalKw.toLocaleString()} kW)</span>
            </div>
            <div className="tg-sub">
              Total Station Rating: <strong>3,000 MW (3,000,000 kW)</strong> · Plant Load: <strong>{plantLoadFactor}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Student Conversion Explainer Card */}
      <div className="kw-mw-explainer-card">
        <div className="explainer-icon">
          <Sparkles size={20} className="text-amber-500" />
        </div>
        <div className="explainer-body">
          <strong>Understanding kW and MW Units for Your Presentation:</strong>
          <p>
            • <strong>1 MegaWatt (MW) = 1,000 KiloWatts (kW)</strong> = 1,000,000 Watts.<br />
            • Each NTPC Kaniha generator unit produces <strong>500 MW</strong>, which equals <strong>500,000 kW</strong> of electricity.<br />
            • All 6 generators working together produce <strong>3,000 MW = 3,000,000 kW</strong> of clean power for the national grid!
          </p>
        </div>
      </div>

      {/* Stage I Section (Units 1 & 2) */}
      <div className="stage-block">
        <div className="stage-header-row">
          <div className="stage-title">
            <span className="stage-tag stage-1">STAGE I</span>
            <div>
              <h3>Stage I Units: 2 X 500 MW = 1,000 MW (1,000,000 kW)</h3>
              <span className="stage-sub-subtitle">Commercial: Unit I (Feb 1995) &amp; Unit II (Mar 1996)</span>
            </div>
          </div>
          <span className="stage-meta">Eastern &amp; North-Eastern Regional Grid</span>
        </div>

        {/* Beneficiary States Strip for Stage I */}
        <div className="beneficiaries-strip">
          <div className="bene-strip-header">
            <div className="bsh-left">
              <span className="bene-label">STAGE I BENEFICIARY STATES &amp; ALLOCATION:</span>
              <span className="bene-count">8 Power Entities</span>
            </div>
            <span className="bene-note">Electricity from Unit I &amp; II is transmitted to these Eastern/NE states</span>
          </div>
          <div className="bene-tags-grid">
            {STAGE_1_BENEFICIARIES.map((b) => (
              <div key={b.code} className="bene-tag-pill stage-1-pill">
                <span className="bene-pill-code">{b.code}</span>
                <div className="bene-pill-info">
                  <strong>{b.name}</strong>
                  <small>{b.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="generators-cards-grid">
          {stage1Units.map((gen) => (
            <GeneratorCard
              key={gen.unit_id}
              gen={gen}
              isSelected={selectedUnit === gen.unit_id}
              onSelect={() => { playClickSound(); setSelectedUnit(gen.unit_id); }}
            />
          ))}
        </div>
      </div>

      {/* Stage II Section (Units 3, 4, 5, 6) */}
      <div className="stage-block">
        <div className="stage-header-row">
          <div className="stage-title">
            <span className="stage-tag stage-2">STAGE II</span>
            <div>
              <h3>Stage II Units: 4 X 500 MW = 2,000 MW (2,000,000 kW)</h3>
              <span className="stage-sub-subtitle">Commercial: Unit III (Jan 2003), Unit IV (Oct 2003), Unit V (May 2004), Unit VI (Feb 2005)</span>
            </div>
          </div>
          <span className="stage-meta">Talcher-Kolar ±500 kV HVDC Transmission Link (1,450 km)</span>
        </div>

        {/* Beneficiary States Strip for Stage II */}
        <div className="beneficiaries-strip stage-2-strip">
          <div className="bene-strip-header">
            <div className="bsh-left">
              <span className="bene-label">STAGE II BENEFICIARY STATES &amp; ALLOCATION:</span>
              <span className="bene-count">5 Southern States &amp; UT</span>
            </div>
            <span className="bene-note">Transmitted via ±500 kV Talcher-Kolar HVDC Bi-pole Line</span>
          </div>
          <div className="bene-tags-grid">
            {STAGE_2_BENEFICIARIES.map((b) => (
              <div key={b.code} className="bene-tag-pill stage-2-pill">
                <span className="bene-pill-code">{b.code}</span>
                <div className="bene-pill-info">
                  <strong>{b.name}</strong>
                  <small>{b.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="generators-cards-grid four-cols">
          {stage2Units.map((gen) => (
            <GeneratorCard
              key={gen.unit_id}
              gen={gen}
              isSelected={selectedUnit === gen.unit_id}
              onSelect={() => { playClickSound(); setSelectedUnit(gen.unit_id); }}
            />
          ))}
        </div>
      </div>

      {/* Selected Unit Deep-Dive Inspection Panel */}
      {selectedGen && (
        <div className="selected-unit-panel">
          <div className="panel-topline">
            <div className="panel-title-group">
              <span className="unit-badge">{selectedGen.unit_id}</span>
              <div>
                <h3>{selectedGen.name} — Live Performance Telemetry</h3>
                <span>Commissioned: <strong>{selectedGen.commissioned}</strong> · {selectedGen.stage}</span>
              </div>
            </div>
            <div className="panel-quick-stat">
              <span className="pqs-label">Live Output:</span>
              <strong className="pqs-val text-sky-600">{selectedGen.current_load_mw} MW ({selectedGen.current_load_kw?.toLocaleString()} kW)</strong>
            </div>
          </div>

          <div className="unit-specs-metrics-grid">
            <div className="usm-card">
              <div className="usm-top"><Zap size={16} className="text-amber-500" /><span>POWER GENERATED</span></div>
              <strong>{selectedGen.current_load_mw} MW</strong>
              <small>{selectedGen.current_load_kw?.toLocaleString()} kW</small>
            </div>

            <div className="usm-card">
              <div className="usm-top"><Flame size={16} className="text-red-500" /><span>COAL CONSUMED</span></div>
              <strong>{selectedGen.coal_burn_rate_tph} t/h</strong>
              <small>Delivered from Coal Handling Plant</small>
            </div>

            <div className="usm-card">
              <div className="usm-top"><Wind size={16} className="text-cyan-500" /><span>STEAM CONDITIONS</span></div>
              <strong>{selectedGen.steam_pressure_kg_cm2} kg/cm²</strong>
              <small>Temperature: {selectedGen.steam_temp_c}°C</small>
            </div>

            <div className="usm-card">
              <div className="usm-top"><Activity size={16} className="text-emerald-500" /><span>GRID FREQUENCY</span></div>
              <strong>{selectedGen.frequency_hz} Hz</strong>
              <small>Terminal Voltage: {selectedGen.voltage_kv} kV</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual Generator Unit Card
function GeneratorCard({ gen, isSelected, onSelect }) {
  const pct = gen.load_percentage || 98.0;

  return (
    <article
      className={`gen-unit-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      title="Click to view detailed unit steam and electrical telemetry"
    >
      <div className="card-topline">
        <span className="unit-tag">{gen.unit_id}</span>
        <span className="commissioned-date">
          <Calendar size={11} /> {gen.commissioned}
        </span>
      </div>

      <strong className="unit-title">{gen.name}</strong>

      {/* Output Display in both MW and kW */}
      <div className="output-numbers-box">
        <div className="mw-line">
          <strong className="mw-val">{gen.current_load_mw}</strong>
          <span className="mw-unit">MW</span>
        </div>
        <div className="kw-line">
          <span className="kw-label">Kilowatts:</span>
          <strong className="kw-val">{gen.current_load_kw?.toLocaleString()} kW</strong>
        </div>
      </div>

      {/* Capacity Load Bar */}
      <div className="load-bar-wrap">
        <div className="load-bar-label">
          <span>Rated: 500 MW (500,000 kW)</span>
          <strong>{pct}% Load</strong>
        </div>
        <div className="load-track">
          <div className="load-fill" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
      </div>

      {/* Coal Consumption & Status */}
      <div className="card-footer-stats">
        <div>
          <span>Coal Burned:</span>
          <strong>{gen.coal_burn_rate_tph} tonnes/hr</strong>
        </div>
        <div>
          <span>Voltage:</span>
          <strong>{gen.voltage_kv} kV</strong>
        </div>
      </div>
    </article>
  );
}
