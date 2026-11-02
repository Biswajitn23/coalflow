import React, { useState } from 'react';
import {
  Bell, AlertTriangle, AlertOctagon, Info, Check, CheckCheck,
  Filter, ShieldAlert, Clock, RefreshCw, Zap
} from 'lucide-react';
import { playClickSound, playWarningSound } from '../utils/audio';

export default function AlertManagement({
  alerts,
  onAcknowledge,
  onResolve,
  onTriggerDemoAlert,
  onRefresh,
}) {
  const [filter, setFilter] = useState('ALL');
  const [actingId, setActingId] = useState(null);

  const filtered = (alerts || []).filter((a) => {
    if (filter === 'CRITICAL') return a.severity === 'critical';
    if (filter === 'WARNING') return a.severity === 'warning';
    if (filter === 'INFO') return a.severity === 'info';
    if (filter === 'UNACK') return !a.acknowledged;
    return true;
  });

  const handleAck = async (id) => {
    playClickSound();
    setActingId(id);
    await onAcknowledge(id);
    setActingId(null);
  };

  const handleRes = async (id) => {
    playClickSound();
    setActingId(id);
    await onResolve(id);
    setActingId(null);
  };

  const criticalCount = (alerts || []).filter((a) => a.severity === 'critical' && !a.resolved).length;
  const warningCount = (alerts || []).filter((a) => a.severity === 'warning' && !a.resolved).length;
  const unackCount = (alerts || []).filter((a) => !a.acknowledged).length;

  return (
    <div className="alerts-root">
      {/* Header */}
      <div className="alerts-header">
        <div>
          <div className="alerts-badge">
            <Bell size={14} className="text-amber-400" />
            <span>ALARM ANNUNCIATOR &amp; EVENT JOURNAL</span>
          </div>
          <h2>SCADA Alert &amp; Incident Management</h2>
          <p className="alerts-desc">
            Audited industrial alarm annunciator. Review sensor excursions, acknowledge operator awareness, and log fault resolutions.
          </p>
        </div>

        {/* Counter Summary Pills */}
        <div className="alerts-summary-row">
          <div className={`summary-pill ${criticalCount > 0 ? 'pill-critical animate-pulse' : ''}`}>
            <span>Critical</span>
            <strong>{criticalCount}</strong>
          </div>
          <div className={`summary-pill ${warningCount > 0 ? 'pill-warning' : ''}`}>
            <span>Warning</span>
            <strong>{warningCount}</strong>
          </div>
          <div className="summary-pill">
            <span>Unacknowledged</span>
            <strong>{unackCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="alerts-toolbar">
        <div className="filter-tabs">
          {[
            { id: 'ALL', label: `All Events (${alerts?.length || 0})` },
            { id: 'UNACK', label: `Unacknowledged (${unackCount})` },
            { id: 'CRITICAL', label: `Critical (${criticalCount})` },
            { id: 'WARNING', label: `Warning (${warningCount})` },
            { id: 'INFO', label: 'Info' },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-tab-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => { playClickSound(); setFilter(f.id); }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Action Button: Trigger Test Alarm */}
        <button
          className="trigger-test-alarm-btn"
          onClick={() => {
            playWarningSound();
            onTriggerDemoAlert();
          }}
          title="Inject simulated alarm for demonstration"
        >
          <Zap size={14} />
          <span>Simulate Test Alarm</span>
        </button>
      </div>

      {/* Alerts Table / Feed */}
      <div className="alerts-feed-card">
        {filtered.length > 0 ? (
          <div className="alerts-list">
            {filtered.map((alert) => {
              const isCrit = alert.severity === 'critical';
              const isWarn = alert.severity === 'warning';
              const isAck = !!alert.acknowledged;
              const isRes = !!alert.resolved;

              return (
                <div
                  key={alert.id}
                  className={`alert-entry ${isCrit ? 'entry-critical' : isWarn ? 'entry-warning' : 'entry-info'} ${!isAck ? 'unack-glow' : ''}`}
                >
                  {/* Severity Icon */}
                  <div className="entry-icon">
                    {isCrit ? (
                      <AlertOctagon size={20} className="text-red-400" />
                    ) : isWarn ? (
                      <AlertTriangle size={20} className="text-amber-400" />
                    ) : (
                      <Info size={20} className="text-cyan-400" />
                    )}
                  </div>

                  {/* Main Details */}
                  <div className="entry-body">
                    <div className="entry-top">
                      <span className={`entry-severity-tag ${alert.severity}`}>
                        {alert.severity?.toUpperCase()}
                      </span>
                      <strong className="entry-equipment">{alert.equipment}</strong>
                      <span className="entry-param">Tag: {alert.parameter}</span>
                      <time className="entry-time">
                        <Clock size={12} />
                        {new Date(alert.created_at).toLocaleString('en-IN')}
                      </time>
                    </div>

                    <p className="entry-message">{alert.message}</p>

                    <div className="entry-status-row">
                      <span className={`entry-tag ${isAck ? 'tag-ack' : 'tag-pending'}`}>
                        {isAck ? '✓ Acknowledged' : '⚠ Pending Operator Ack'}
                      </span>
                      {isRes && (
                        <span className="entry-tag tag-resolved">
                          ✓ Resolved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Operator Actions */}
                  <div className="entry-actions">
                    {!isAck && (
                      <button
                        className="ack-action-btn"
                        onClick={() => handleAck(alert.id)}
                        disabled={actingId === alert.id}
                      >
                        <Check size={14} />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {!isRes && (
                      <button
                        className="resolve-action-btn"
                        onClick={() => handleRes(alert.id)}
                        disabled={actingId === alert.id}
                      >
                        <CheckCheck size={14} />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="alerts-empty-state">
            <CheckCheck size={42} className="text-emerald-500" />
            <h4>No Active Alerts in this Category</h4>
            <p>All plant parameters are within normal SCADA operating thresholds.</p>
          </div>
        )}
      </div>
    </div>
  );
}
