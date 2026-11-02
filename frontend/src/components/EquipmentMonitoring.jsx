import React, { useState } from 'react';
import {
  Activity, Thermometer, Gauge, Zap, Clock, ShieldCheck,
  AlertTriangle, CheckCircle2, ChevronRight, Sliders, Disc, ExternalLink
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function EquipmentMonitoring({
  equipmentList,
  latestReading,
  onSelectEquipment,
}) {
  const [filterType, setFilterType] = useState('ALL');

  const filtered = (equipmentList || []).filter((eq) => {
    if (filterType === 'RUNNING') return eq.tone === 'good';
    if (filterType === 'WARNING') return eq.tone === 'warning' || eq.tone === 'critical';
    return true;
  });

  return (
    <div className="equipment-monitor-root">
      {/* Page Header */}
      <div className="equip-page-header">
        <div>
          <div className="equip-badge">
            <Gauge size={14} className="text-cyan-400" />
            <span>CRITICAL ASSET TELEMETRY</span>
          </div>
          <h2>Equipment Condition &amp; Health Monitoring</h2>
          <p className="equip-desc">
            Real-time motor temperatures, bearing vibrations, running hours, and operational status for all key plant equipment.
          </p>
        </div>

        {/* Filters */}
        <div className="equip-filter-pills">
          {['ALL', 'RUNNING', 'WARNING'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filterType === f ? 'active' : ''}`}
              onClick={() => { playClickSound(); setFilterType(f); }}
            >
              {f === 'ALL' ? `All Assets (${equipmentList?.length ?? 7})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Detailed Cards Grid */}
      <div className="equip-cards-grid">
        {filtered.map((item) => {
          const isWarning = item.tone === 'warning';
          const isCritical = item.tone === 'critical';

          const temp = item.live_temp ?? (item.temp_nom || 66.0);
          const vib = item.live_vib ?? (item.vib_nom || 2.4);
          const current = item.live_current ?? (item.current_nom || 135.0);

          return (
            <article
              key={item.id}
              className={`equip-card ${isCritical ? 'card-critical' : isWarning ? 'card-warning' : 'card-normal'}`}
              onClick={() => {
                playClickSound();
                onSelectEquipment(item);
              }}
              title="Click for deep engineering diagnostic view"
            >
              {/* Card Topline */}
              <div className="equip-card-top">
                <div className="equip-ident">
                  <span className="equip-code">{item.id}</span>
                  <div className="equip-titles">
                    <strong>{item.name}</strong>
                    <span className="equip-area">{item.area}</span>
                  </div>
                </div>

                <div className={`equip-status-badge ${item.tone}`}>
                  <span className="status-dot" />
                  <span>{item.status}</span>
                </div>
              </div>

              {/* Specification Rating */}
              <div className="equip-rating-line">
                <span>Rating:</span>
                <strong>{item.rating || '650 t/h / 132 kW'}</strong>
              </div>

              {/* Three Mini Circular SVG Gauges */}
              <div className="gauges-cluster">
                {/* 1. Temperature Gauge */}
                <div className="mini-gauge-box">
                  <CircularGauge
                    value={temp}
                    min={20}
                    max={100}
                    unit="°C"
                    label="Motor Temp"
                    warnAt={82}
                    color="#f59e0b"
                  />
                </div>

                {/* 2. Vibration Gauge */}
                <div className="mini-gauge-box">
                  <CircularGauge
                    value={vib}
                    min={0}
                    max={10}
                    unit="mm/s"
                    label="Vibration"
                    warnAt={5.5}
                    color="#06b6d4"
                  />
                </div>

                {/* 3. Motor Current Gauge */}
                <div className="mini-gauge-box">
                  <CircularGauge
                    value={current}
                    min={0}
                    max={300}
                    unit="A"
                    label="Current"
                    warnAt={180}
                    color="#10b981"
                  />
                </div>
              </div>

              {/* Operational Progress / Health Bar */}
              <div className="health-bar-container">
                <div className="health-label-row">
                  <span>Equipment Health Index</span>
                  <strong>{isCritical ? '42%' : isWarning ? '78%' : '98.5%'}</strong>
                </div>
                <div className="health-track">
                  <div
                    className={`health-fill ${isCritical ? 'fill-critical' : isWarning ? 'fill-warning' : 'fill-good'}`}
                    style={{ width: isCritical ? '42%' : isWarning ? '78%' : '98.5%' }}
                  />
                </div>
              </div>

              {/* Running Hours & Footer */}
              <div className="equip-card-foot">
                <div className="foot-running-hours">
                  <Clock size={13} className="text-slate-400" />
                  <span>Run Hours: <strong>{item.running_hours ?? 1420}h</strong></span>
                </div>

                <div className="foot-inspect-btn">
                  <span>Inspect</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// Circular SVG SCADA Gauge
function CircularGauge({ value, min, max, unit, label, warnAt, color }) {
  const radius = 28;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const strokeDashoffset = circumference - pct * circumference * 0.75; // 270 deg gauge

  const isWarn = value >= warnAt;
  const activeColor = isWarn ? '#ef4444' : color;

  return (
    <div className="circular-gauge">
      <svg width={76} height={76} viewBox="0 0 76 76" className="gauge-svg">
        {/* Background Track Arc (270 degrees) */}
        <circle
          cx={38}
          cy={38}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={stroke}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(135 38 38)"
        />

        {/* Foreground Value Arc */}
        <circle
          cx={38}
          cy={38}
          r={radius}
          fill="none"
          stroke={activeColor}
          strokeWidth={stroke}
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(135 38 38)"
          className="gauge-value-arc"
        />

        {/* Center Digital Value */}
        <text x="38" y="37" textAnchor="middle" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace">
          {Number(value).toFixed(unit === 'mm/s' ? 1 : 0)}
        </text>
        <text x="38" y="47" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="monospace">
          {unit}
        </text>
      </svg>
      <span className="gauge-caption">{label}</span>
    </div>
  );
}
