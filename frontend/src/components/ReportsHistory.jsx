import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Calendar, Clock, BarChart3,
  CheckCircle2, AlertTriangle, ShieldCheck, Printer, RefreshCw
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function ReportsHistory({ apiBase, latestReading }) {
  const [reportData, setReportData] = useState(null);
  const [selectedShift, setSelectedShift] = useState('Shift-A');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiBase}/api/reports`);
        if (res.ok) setReportData(await res.json());
      } catch (e) {}
      finally { setLoading(false); }
    };
    fetchReport();
  }, [apiBase]);

  const summary = reportData?.summary || {
    total_coal_handled_tonnes: 3840.0,
    bunker_supplied_tonnes: 3120.0,
    stockpile_transferred_tonnes: 720.0,
    plant_availability_pct: 98.4,
    average_flow_tph: latestReading?.coal_flow ?? 420.0,
    average_speed_ms: latestReading?.belt_speed ?? 2.65,
    average_motor_temp_c: latestReading?.motor_temp ?? 68.2,
    total_power_consumed_kwh: 3140.0,
    specific_power_kwh_per_tonne: 0.82,
  };

  const equipHours = reportData?.equipment_hours || [
    { id: 'CV-01', name: 'Receiving Conveyor', hours: 1432.5, trips: 0, status: 'Healthy' },
    { id: 'CV-02', name: 'Transfer Conveyor', hours: 1390.2, trips: 0, status: 'Healthy' },
    { id: 'CR-01', name: 'Ring Granulator Crusher', hours: 984.0, trips: 1, status: 'Due Inspection in 16 hrs' },
    { id: 'VS-01', name: 'Vibrating Screen', hours: 1150.8, trips: 0, status: 'Healthy' },
    { id: 'MS-01', name: 'Magnetic Separator', hours: 1820.0, trips: 0, status: 'Healthy' },
    { id: 'CV-04', name: 'Yard Conveyor', hours: 1210.4, trips: 0, status: 'Healthy' },
    { id: 'CV-05', name: 'Tripper Conveyor', hours: 1640.1, trips: 0, status: 'Healthy' },
  ];

  return (
    <div className="reports-root">
      {/* Page Header */}
      <div className="reports-header">
        <div>
          <div className="reports-badge">
            <FileText size={14} className="text-cyan-400" />
            <span>OPERATIONAL SHIFT LOGS &amp; AUDIT</span>
          </div>
          <h2>Coal Handling Plant Daily Operational Summary</h2>
          <p className="reports-desc">
            Shift-wise accounting of fuel handled, specific energy consumption (kWh/t), equipment availability, and historical event log.
          </p>
        </div>

        {/* Export & Actions */}
        <div className="reports-actions">
          <a
            href={`${apiBase}/api/export.csv`}
            className="export-csv-btn"
            download
            onClick={playClickSound}
          >
            <Download size={15} />
            <span>Download Sensor Readings (CSV)</span>
          </a>
        </div>
      </div>

      {/* Shift Filter Tabs */}
      <div className="shifts-toolbar">
        <span className="shift-label">SELECT SHIFT:</span>
        <div className="shift-btn-group">
          {[
            { id: 'Shift-A', label: 'Shift-A (06:00 - 14:00)' },
            { id: 'Shift-B', label: 'Shift-B (14:00 - 22:00)' },
            { id: 'Shift-C', label: 'Shift-C (22:00 - 06:00)' },
          ].map((s) => (
            <button
              key={s.id}
              className={`shift-btn ${selectedShift === s.id ? 'active' : ''}`}
              onClick={() => { playClickSound(); setSelectedShift(s.id); }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Summary Cards */}
      <div className="reports-kpi-grid">
        <div className="report-kpi-card">
          <span className="rk-label">TOTAL COAL HANDLED</span>
          <strong className="rk-value">{summary.total_coal_handled_tonnes.toLocaleString()} t</strong>
          <span className="rk-sub">Throughput across 8 hrs</span>
        </div>

        <div className="report-kpi-card">
          <span className="rk-label">BOILER BUNKERS FED</span>
          <strong className="rk-value">{summary.bunker_supplied_tonnes.toLocaleString()} t</strong>
          <span className="rk-sub">Delivered to Unit Silos</span>
        </div>

        <div className="report-kpi-card">
          <span className="rk-label">PLANT AVAILABILITY</span>
          <strong className="rk-value text-emerald-400">{summary.plant_availability_pct}%</strong>
          <span className="rk-sub">MTBF: 420 hrs</span>
        </div>

        <div className="report-kpi-card">
          <span className="rk-label">SPECIFIC POWER</span>
          <strong className="rk-value text-amber-400">{summary.specific_power_kwh_per_tonne} kWh/t</strong>
          <span className="rk-sub">Energy efficiency index</span>
        </div>

        <div className="report-kpi-card">
          <span className="rk-label">AVG CONVEYOR SPEED</span>
          <strong className="rk-value">{summary.average_speed_ms} m/s</strong>
          <span className="rk-sub">Nominal: 2.65 m/s</span>
        </div>

        <div className="report-kpi-card">
          <span className="rk-label">AVG MOTOR TEMP</span>
          <strong className="rk-value">{summary.average_motor_temp_c} °C</strong>
          <span className="rk-sub">Threshold: 82°C</span>
        </div>
      </div>

      {/* Equipment Running Hours Table */}
      <div className="reports-table-card">
        <div className="table-header-row">
          <div className="table-title">
            <BarChart3 size={16} className="text-cyan-400" />
            <h3>Equipment Operating Hours &amp; Maintenance Status</h3>
          </div>
          <span className="maintenance-pill">Preventive Maintenance Schedule OK</span>
        </div>

        <div className="report-table-scroll">
          <table className="scada-table">
            <thead>
              <tr>
                <th>TAG ID</th>
                <th>EQUIPMENT NAME</th>
                <th>CUMULATIVE RUN HOURS</th>
                <th>TRIPS LOGGED</th>
                <th>NEXT SERVICE WINDOW</th>
                <th>HEALTH STATUS</th>
              </tr>
            </thead>
            <tbody>
              {equipHours.map((row) => (
                <tr key={row.id}>
                  <td><span className="equip-tag-pill">{row.id}</span></td>
                  <td><strong>{row.name}</strong></td>
                  <td className="mono-cell">{row.hours} hrs</td>
                  <td className="mono-cell">{row.trips}</td>
                  <td className="text-slate-400">{row.status}</td>
                  <td>
                    <span className="status-pill good">
                      <span /> Normal
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Academic Disclaimer & Methodology Notes */}
      <div className="academic-report-disclaimer">
        <ShieldCheck size={18} className="text-emerald-400" />
        <div>
          <strong>Educational Prototype Notice · NTPC Kaniha Internship</strong>
          <p>
            All operational statistics, power consumption figures, and running hours are synthetically generated for academic study. Not reflective of NTPC Kaniha commercial dispatch data.
          </p>
        </div>
      </div>
    </div>
  );
}
