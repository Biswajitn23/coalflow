import React from 'react';
import {
  Waves, Activity, Boxes, Factory, Gauge, AlertTriangle
} from 'lucide-react';

const iconMap = {
  coal_flow: Waves,
  belt_speed: Activity,
  stock_quantity: Boxes,
  bunker_level: Factory,
  active_equipment: Gauge,
  alerts_count: AlertTriangle,
};

const simpleLabels = {
  coal_flow: 'Coal Moving Now',
  belt_speed: 'Conveyor Belt Speed',
  stock_quantity: 'Coal in Storage Yard',
  bunker_level: 'Boiler Silos Filling Level',
  active_equipment: 'Machines Running',
  alerts_count: 'Safety Warnings',
};

export default function MetricCard({ metric }) {
  const Icon = iconMap[metric.key] || Gauge;
  const isCritical = metric.tone === 'critical';
  const isWarning = metric.tone === 'warning';

  const friendlyLabel = simpleLabels[metric.key] || metric.label;

  return (
    <article className={`scada-kpi-card ${isCritical ? 'kpi-critical' : isWarning ? 'kpi-warning' : 'kpi-normal'}`}>
      {/* Top Header */}
      <div className="kpi-top">
        <div className="kpi-icon-wrapper">
          <Icon size={18} />
        </div>
        <div className="kpi-status-indicator">
          <span className={`kpi-glow-dot ${isCritical ? 'dot-critical' : isWarning ? 'dot-warning' : 'dot-normal'}`} />
          <span className="kpi-status-label">
            {isCritical ? 'ATTENTION' : isWarning ? 'WARNING' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Metric Label */}
      <div className="kpi-label">{friendlyLabel}</div>

      {/* Main Value Display */}
      <div className="kpi-value-row">
        <strong className="kpi-num">
          {typeof metric.value === 'number'
            ? metric.value.toLocaleString(undefined, {
                maximumFractionDigits: metric.key === 'belt_speed' ? 2 : metric.key === 'coal_flow' ? 1 : 0,
              })
            : metric.value}
        </strong>
        <span className="kpi-unit">{metric.unit}</span>
      </div>

      {/* Progress Bar if percentage exists */}
      {metric.percentage !== undefined && (
        <div className="kpi-progress-bar">
          <div
            className="kpi-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, metric.percentage))}%` }}
          />
        </div>
      )}

      {/* Footer Info in Simple Words */}
      <div className="kpi-foot">
        <span className="kpi-target">{metric.target}</span>
        <span className="kpi-delta">{metric.delta}</span>
      </div>
    </article>
  );
}
