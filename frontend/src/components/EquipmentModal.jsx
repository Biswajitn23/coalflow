import React from 'react';
import {
  X, Gauge, Thermometer, Activity, Clock, Shield,
  CheckCircle2, AlertTriangle, FileText, Zap, Disc
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function EquipmentModal({ equipment, onClose, latestReading }) {
  if (!equipment) return null;

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const temp = equipment.live_temp ?? (equipment.temp_nom || 68.0);
  const vib = equipment.live_vib ?? (equipment.vib_nom || 2.4);
  const current = equipment.live_current ?? (equipment.current_nom || 135.0);

  return (
    <div className="scada-modal-backdrop" onClick={onClose}>
      <div className="scada-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-lockup">
            <span className="modal-tag">{equipment.id}</span>
            <div>
              <h3>{equipment.name}</h3>
              <span className="modal-area">{equipment.area || equipment.subtext || 'Coal Handling Plant'}</span>
            </div>
          </div>

          <div className="modal-header-actions">
            <span className={`modal-status-badge ${equipment.tone || 'good'}`}>
              <span className="dot" /> {equipment.status || 'Running'}
            </span>
            <button
              className="modal-close-btn"
              onClick={() => { playClickSound(); onClose(); }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Description */}
          {equipment.description && (
            <div className="modal-desc-box">
              <p>{equipment.description}</p>
            </div>
          )}

          {/* Live Telemetry Sensor Cards */}
          <div className="modal-sensor-grid">
            <div className="sensor-box">
              <div className="sensor-top">
                <Thermometer size={16} className="text-amber-400" />
                <span>BEARING / STATOR TEMP</span>
              </div>
              <strong className="sensor-value">{Number(temp).toFixed(1)} °C</strong>
              <span className="sensor-sub">High Trip Alarm: 85°C</span>
            </div>

            <div className="sensor-box">
              <div className="sensor-top">
                <Activity size={16} className="text-cyan-400" />
                <span>VIBRATION VELOCITY</span>
              </div>
              <strong className="sensor-value">{Number(vib).toFixed(2)} mm/s</strong>
              <span className="sensor-sub">ISO 10816 Limit: 5.5 mm/s</span>
            </div>

            <div className="sensor-box">
              <div className="sensor-top">
                <Zap size={16} className="text-emerald-400" />
                <span>MOTOR DRAW CURRENT</span>
              </div>
              <strong className="sensor-value">{Number(current).toFixed(1)} A</strong>
              <span className="sensor-sub">Full Load Amps: 180 A</span>
            </div>

            <div className="sensor-box">
              <div className="sensor-top">
                <Clock size={16} className="text-purple-400" />
                <span>RUNNING HOURS</span>
              </div>
              <strong className="sensor-value">{equipment.running_hours ?? 1420} hrs</strong>
              <span className="sensor-sub">Next Greasing: in 80 hrs</span>
            </div>
          </div>

          {/* Engineering Specifications */}
          <div className="modal-specs-section">
            <h4>TECHNICAL SPECIFICATIONS &amp; INTERLOCK STATUS</h4>
            <div className="specs-table-wrapper">
              <table className="specs-table">
                <tbody>
                  <tr>
                    <th>Equipment Type</th>
                    <td>{equipment.type || equipment.equipment || 'Belt Conveyor'}</td>
                    <th>Power Rating</th>
                    <td>{equipment.drivePower || equipment.rating || '132 kW 3-Phase induction'}</td>
                  </tr>
                  <tr>
                    <th>Design Capacity</th>
                    <td>{equipment.rating || '650 t/h nominal'}</td>
                    <th>Safety Pull Cords</th>
                    <td className="text-emerald-400">HEALTHY (Loop closed)</td>
                  </tr>
                  <tr>
                    <th>Zero Speed Switch</th>
                    <td className="text-emerald-400">NORMAL (Pulse verified)</td>
                    <th>Belt Sway Monitor</th>
                    <td className="text-emerald-400">CENTERED (&lt;50mm drift)</td>
                  </tr>
                  <tr>
                    <th>Chute Level Probes</th>
                    <td className="text-emerald-400">NO CLOGGING DETECTED</td>
                    <th>Control Circuit</th>
                    <td className="text-cyan-400">PLC Remote Supervisory Mode</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span className="modal-academic-note">
            NTPC Kaniha Prototype Study · Simulated Telemetry
          </span>
          <button
            className="modal-done-btn"
            onClick={() => { playClickSound(); onClose(); }}
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
