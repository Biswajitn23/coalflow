import React, { useState, useEffect } from 'react';
import {
  Boxes, Factory, Layers, Flame, Gauge, ArrowDown,
  RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function StockyardBunker({ apiBase, latestReading, stockyardPiles, bunkers }) {
  const [stockInfo, setStockInfo] = useState(null);
  const [bunkerInfo, setBunkerInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`${apiBase}/api/stockyard`),
          fetch(`${apiBase}/api/bunkers`),
        ]);
        if (res1.ok) setStockInfo(await res1.json());
        if (res2.ok) setBunkerInfo(await res2.json());
      } catch (e) {}
    };
    fetchData();
    const timer = setInterval(fetchData, 8000);
    return () => clearInterval(timer);
  }, [apiBase]);

  const piles = stockInfo?.piles || stockyardPiles || [];
  const bunkerList = bunkerInfo?.bunkers || bunkers || [];
  const totalQty = stockInfo?.total_quantity_t || 142400;
  const totalCap = stockInfo?.total_capacity_t || 200000;
  const fillPct = Math.round((totalQty / totalCap) * 100);
  const daysBurn = stockInfo?.days_stock || 18.2;

  return (
    <div className="stockyard-bunker-root">
      {/* Top Banner */}
      <div className="sy-header">
        <div>
          <div className="sy-badge">
            <Boxes size={14} className="text-amber-400" />
            <span>FUEL STORAGE &amp; SUPPLY INVENTORY</span>
          </div>
          <h2>Coal Stockyard &amp; Boiler Bunker Silo Visualization</h2>
          <p className="sy-subtitle">
            Stockpile volumetric levels, bucket-wheel stacker/reclaimer telemetry, and boiler bunker silo replenishment status.
          </p>
        </div>

        <div className="sy-total-stats">
          <div className="stat-pill">
            <span>Total Stockyard Inventory</span>
            <strong>{totalQty.toLocaleString()} tonnes</strong>
            <small>Capacity: {totalCap.toLocaleString()} t ({fillPct}%)</small>
          </div>
          <div className="stat-pill highlight">
            <span>Plant Autonomy Buffer</span>
            <strong className="text-emerald-400">~{daysBurn} Days</strong>
            <small>At full load (NTPC Kaniha 3000 MW)</small>
          </div>
        </div>
      </div>

      {/* Main Stockyard Graphic Visualization */}
      <div className="stockyard-visual-panel">
        <div className="panel-title-row">
          <div className="title-left">
            <Layers size={16} className="text-amber-400" />
            <h3>Stockyard Yard Layout &amp; Stacker/Reclaimer SR-01</h3>
          </div>
          <span className="live-status-pill">
            <span className="pulse-green-dot" /> BUCKET-WHEEL RECLAIMING ACTIVE
          </span>
        </div>

        {/* 3D Stockyard Canvas/Graphic */}
        <div className="stockyard-canvas-wrapper">
          <svg viewBox="0 0 920 230" className="stockyard-svg">
            {/* Ground Plane */}
            <rect x="20" y="160" width="880" height="60" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
            <line x1="20" y1="160" x2="900" y2="160" stroke="#334155" strokeWidth="2" />

            {/* Rail track for travelling stacker/reclaimer */}
            <line x1="40" y1="172" x2="880" y2="172" stroke="#64748b" strokeWidth="3" />
            <line x1="40" y1="178" x2="880" y2="178" stroke="#64748b" strokeWidth="3" />
            {Array.from({ length: 42 }).map((_, i) => (
              <line key={i} x1={40 + i * 20} y1="169" x2={40 + i * 20} y2="181" stroke="#475569" strokeWidth="2" />
            ))}

            {/* Stockpile 1: Grade G-10 */}
            <g transform="translate(60, 40)">
              {/* Outer boundary */}
              <polygon points="10,120 70,30 190,30 250,120" fill="#1e293b" stroke="#eab308" strokeWidth="2" />
              {/* Inner Coal texture */}
              <polygon points="25,120 80,45 180,45 235,120" fill="#111827" />
              <polygon points="50,120 95,65 165,65 210,120" fill="#0a0e17" />
              <text x="130" y="80" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                PILE-01: G-10
              </text>
              <text x="130" y="98" fill="#fbbf24" fontSize="11" textAnchor="middle" fontFamily="monospace">
                58,400 t (73%)
              </text>
            </g>

            {/* Stockpile 2: Grade G-11 */}
            <g transform="translate(340, 40)">
              <polygon points="10,120 65,40 185,40 240,120" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              <polygon points="25,120 75,55 175,55 225,120" fill="#111827" />
              <text x="125" y="80" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                PILE-02: G-11
              </text>
              <text x="125" y="98" fill="#38bdf8" fontSize="11" textAnchor="middle" fontFamily="monospace">
                49,200 t (70%)
              </text>
            </g>

            {/* Stockpile 3: Grade G-13 */}
            <g transform="translate(610, 40)">
              <polygon points="10,120 55,50 175,50 220,120" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
              <polygon points="25,120 65,65 165,65 205,120" fill="#111827" />
              <text x="115" y="80" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                PILE-03: G-13
              </text>
              <text x="115" y="98" fill="#10b981" fontSize="11" textAnchor="middle" fontFamily="monospace">
                34,800 t (69%)
              </text>
            </g>

            {/* Stacker / Reclaimer Machine (SR-01) traversing above Pile-02 */}
            <g transform="translate(420, 25)">
              {/* Traveling Gantry Portal */}
              <rect x="0" y="110" width="40" height="30" fill="#334155" stroke="#94a3b8" strokeWidth="2" />
              {/* Central Pivot Tower */}
              <rect x="12" y="55" width="16" height="55" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
              {/* Slewing Operator Cabin */}
              <rect x="2" y="60" width="14" height="18" fill="#0284c7" rx="2" />
              {/* Slewing Reclaiming Boom */}
              <line x1="20" y1="65" x2="110" y2="85" stroke="#38bdf8" strokeWidth="5" />
              <line x1="20" y1="58" x2="110" y2="85" stroke="#0284c7" strokeWidth="2" />
              {/* Bucket Wheel at Boom Tip */}
              <circle cx="110" cy="85" r="14" fill="#0f172a" stroke="#eab308" strokeWidth="2.5" className="spin-slow" />
              {/* Buckets */}
              {[0, 60, 120, 180, 240, 300].map((deg, idx) => (
                <rect
                  key={idx}
                  x="108" y="73" width="4" height="6" fill="#eab308"
                  transform={`rotate(${deg} 110 85)`}
                />
              ))}
              {/* Counterweight Boom (Rear) */}
              <line x1="15" y1="65" x2="-40" y2="50" stroke="#64748b" strokeWidth="4" />
              <rect x="-55" y="42" width="18" height="18" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="20" y="45" fill="#38bdf8" fontSize="9" fontWeight="bold" fontFamily="monospace">SR-01</text>
            </g>
          </svg>
        </div>

        {/* Stockpile Cards Breakdown */}
        <div className="piles-cards-row">
          {piles.map((pile) => {
            const pct = Math.round((pile.quantity_t / pile.capacity_t) * 100);
            return (
              <div key={pile.id} className="pile-metric-card">
                <div className="pile-card-top">
                  <span className="pile-id">{pile.id}</span>
                  <span className="pile-pct">{pct}%</span>
                </div>
                <strong className="pile-name">{pile.name}</strong>

                {/* Progress Bar */}
                <div className="pile-progress-track">
                  <div className="pile-progress-fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="pile-details-grid">
                  <div>
                    <span>Quantity</span>
                    <strong>{pile.quantity_t.toLocaleString()} t</strong>
                  </div>
                  <div>
                    <span>Capacity</span>
                    <strong>{pile.capacity_t.toLocaleString()} t</strong>
                  </div>
                  <div>
                    <span>Moisture</span>
                    <strong>{pile.moisture_pct}%</strong>
                  </div>
                  <div>
                    <span>Gross Calorific</span>
                    <strong>{pile.gcv_kcal} kcal/kg</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Boiler Bunkers Visual Section */}
      <div className="bunkers-visual-panel">
        <div className="panel-title-row">
          <div className="title-left">
            <Factory size={16} className="text-cyan-400" />
            <h3>Boiler Fuel Bunkers (Units 1 to 6) Cross-Section</h3>
          </div>
          <span className="tripper-pos-badge">
            TRIPPER CAR AT: <strong>BUNKER #5 (ACTIVE FILL)</strong>
          </span>
        </div>

        {/* 6 Bunker Silos in Row */}
        <div className="bunkers-grid">
          {bunkerList.map((bnk, idx) => {
            const level = bnk.level_pct;
            const isLow = level < 65;
            const isHigh = level > 85;

            return (
              <div key={bnk.id} className={`bunker-card ${isLow ? 'bunker-low' : isHigh ? 'bunker-high' : 'bunker-normal'}`}>
                {/* Silo Cross Section */}
                <div className="silo-graphic">
                  {/* Top Feed Chute indicator */}
                  <div className={`tripper-feeder-spout ${bnk.id === 'BNK-E' ? 'feeding-active' : ''}`}>
                    <ArrowDown size={14} />
                  </div>

                  {/* Silo Body */}
                  <div className="silo-body-tank">
                    {/* Fill Level */}
                    <div
                      className="silo-coal-fill"
                      style={{ height: `${level}%` }}
                    >
                      <div className="coal-surface-ripples" />
                    </div>

                    {/* Sensor Level Ticks */}
                    <div className="silo-sensor-tick high-probe" title="High Level Alarm Probe">H</div>
                    <div className="silo-sensor-tick low-probe" title="Low Level Alarm Probe">L</div>
                  </div>

                  {/* Conical Hopper Bottom & Pulverizer Feeder Chute */}
                  <div className="silo-hopper-bottom" />
                  <div className="feeder-chute" />
                </div>

                {/* Bunker Data */}
                <div className="bunker-info">
                  <span className="bunker-code">{bnk.id}</span>
                  <strong className="bunker-unit">{bnk.unit}</strong>
                  <div className="bunker-level-display">
                    <span className="bunker-level-num">{level.toFixed(1)}%</span>
                  </div>
                  <span className={`bunker-status-tag ${isLow ? 'tag-warning' : 'tag-good'}`}>
                    {bnk.status}
                  </span>
                  <div className="bunker-temp-row">
                    <span>Temp: {bnk.temp_c}°C</span>
                    <span>Feed: {bnk.feed_rate_tph} t/h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
