import React, { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertTriangle, ArrowRight, Bell, Boxes,
  CheckCircle2, ChevronRight, Clock, Download, Factory, Gauge,
  Layers, PlayCircle, RefreshCw, Settings2, ShieldCheck, Sliders,
  Waves, Zap, AlertOctagon, RotateCcw, Sparkles
} from 'lucide-react';

import './styles.css';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import MetricCard from './components/MetricCard';
import ConveyorSimulation from './components/ConveyorSimulation';
import ProcessFlowDiagram from './components/ProcessFlowDiagram';
import ThermalPlantOverview from './components/ThermalPlantOverview';
import GeneratorsPowerOverview from './components/GeneratorsPowerOverview';
import EquipmentMonitoring from './components/EquipmentMonitoring';
import LiveAnalytics from './components/LiveAnalytics';
import StockyardBunker from './components/StockyardBunker';
import ControlRoom from './components/ControlRoom';
import AlertManagement from './components/AlertManagement';
import ReportsHistory from './components/ReportsHistory';
import EquipmentModal from './components/EquipmentModal';
import PlantSpecsModal from './components/PlantSpecsModal';

const API_BASE = import.meta.env.VITE_API_BASE ?? (
  typeof window !== 'undefined' && window.location.port === '5173'
    ? 'http://127.0.0.1:5000'
    : ''
);

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [controls, setControls] = useState({
    status: 'RUNNING',
    speed_pct: 75,
    feed_rate_pct: 78,
    operating_mode: 'AUTO',
    dust_suppression: true,
    trip_interlock_healthy: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [modalEquipment, setModalEquipment] = useState(null);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  const loadDashboard = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/dashboard`);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const data = await response.json();
      setDashboard(data);
      if (data.controls) {
        setControls(data.controls);
      }
      setError('');
    } catch (err) {
      setError('Backend API connecting... Simulated fallback active.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard(true);
    const timer = setInterval(() => loadDashboard(false), 3500);
    return () => clearInterval(timer);
  }, [loadDashboard]);

  const handleUpdateControls = async (patch) => {
    setControls((prev) => ({ ...prev, ...patch }));
    try {
      const res = await fetch(`${API_BASE}/api/controls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.controls) setControls(json.controls);
      }
    } catch (e) {}
  };

  const handleTriggerEmergencyStop = async (reason) => {
    setControls((prev) => ({
      ...prev,
      status: 'EMERGENCY_STOP',
      emergency_reason: reason,
      trip_interlock_healthy: false,
    }));
    try {
      const res = await fetch(`${API_BASE}/api/controls/emergency-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.controls) setControls(json.controls);
        loadDashboard(false);
      }
    } catch (e) {}
  };

  const handleResetEmergency = async () => {
    setControls((prev) => ({
      ...prev,
      status: 'STOPPED',
      emergency_reason: '',
      trip_interlock_healthy: true,
    }));
    try {
      const res = await fetch(`${API_BASE}/api/controls/reset-emergency`, {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.controls) setControls(json.controls);
        loadDashboard(false);
      }
    } catch (e) {}
  };

  const handleAcknowledgeAlert = async (id) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/acknowledge`, { method: 'POST' });
      loadDashboard(false);
    } catch (e) {}
  };

  const handleResolveAlert = async (id) => {
    try {
      await fetch(`${API_BASE}/api/alerts/${id}/resolve`, { method: 'POST' });
      loadDashboard(false);
    } catch (e) {}
  };

  const handleTriggerDemoAlert = async () => {
    try {
      await fetch(`${API_BASE}/api/alerts/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: 'warning',
          equipment: 'CV-02 Transfer Belt',
          message: 'Belt sway limit sensor triggered. Inspection advised.',
          parameter: 'belt_sway',
          value: 1.0,
        }),
      });
      loadDashboard(false);
    } catch (e) {}
  };

  const isTripped = controls?.status === 'EMERGENCY_STOP';
  const latest = dashboard?.history?.[dashboard.history.length - 1] || {
    coal_flow: 420.0,
    belt_speed: 2.65,
    motor_temp: 68.4,
    stock_level: 72.8,
    bunker_level: 75.7,
  };

  const totalMw = dashboard?.total_power?.total_mw || 2930.0;
  const totalKw = dashboard?.total_power?.total_kw || 2930000;

  return (
    <div className={`scada-app-shell ${isTripped ? 'system-tripped' : ''}`}>
      {/* Top Navigation Bar */}
      <TopNav
        dashboard={dashboard}
        onRefresh={() => loadDashboard(true)}
        controlState={controls}
        onResetEmergency={handleResetEmergency}
        onOpenAlerts={() => setActiveTab('Alerts')}
        onOpenSpecs={() => setIsSpecsOpen(true)}
        apiBase={API_BASE}
      />

      <div className="scada-body-layout">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          alertCount={dashboard?.summary?.active_alerts ?? 0}
          isTripped={isTripped}
        />

        {/* Main Workspace Content */}
        <main className="scada-main-viewport">
          {/* TAB 1: MAIN OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="overview-page-flow">
              {/* Emergency Banner if Active */}
              {isTripped && (
                <div className="scada-trip-banner">
                  <AlertOctagon size={24} className="text-red-600 animate-pulse" />
                  <div>
                    <strong>EMERGENCY STOP PRESSED: ALL CONVEYORS HALTED</strong>
                    <span>{controls?.emergency_reason || 'Safety interlock triggered. All conveyor motors have been safely stopped.'}</span>
                  </div>
                  <button className="trip-banner-reset-btn" onClick={handleResetEmergency}>
                    <RotateCcw size={14} /> Click to Reset Safety
                  </button>
                </div>
              )}

              {/* NTPC KANIHA POWER GENERATION SPOTLIGHT BANNER */}
              <div className="power-spotlight-banner">
                <div className="psb-left">
                  <div className="psb-tag">
                    <Zap size={14} className="text-amber-500" />
                    <span>NTPC KANIHA ELECTRICITY GENERATION (6 X 500 MW)</span>
                  </div>
                  <h3>Total Electricity Generated: <span className="text-sky-600">{totalMw.toLocaleString()} MW</span> ({totalKw.toLocaleString()} kW)</h3>
                  <p>
                    All 6 thermal power generator units (Unit I to Unit VI) are synchronised to the national grid, producing power from the coal conveyed right now.
                  </p>
                </div>

                <div className="psb-right">
                  <div className="quick-load-stat">
                    <span>Station Load Factor</span>
                    <strong>{((totalMw / 3000) * 100).toFixed(1)}%</strong>
                    <small>Rated: 3,000,000 kW</small>
                  </div>
                  <button
                    className="view-generators-btn"
                    onClick={() => setActiveTab('Generators')}
                  >
                    <span>View All 6 Generators (kW &amp; MW)</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>

              {/* KPI Cards Row (Section 2) */}
              <section className="kpi-cards-section">
                <div className="section-title-line">
                  <div>
                    <span className="scada-section-tag">LIVE READINGS</span>
                    <h2>Current Plant Operating Snapshot</h2>
                  </div>
                  <div className="auto-refresh-tag">
                    <span className="pulse-green-dot" /> Auto-updates every 3.5s
                  </div>
                </div>

                <div className="kpi-grid-row">
                  {dashboard?.metrics?.map((m) => (
                    <MetricCard key={m.key} metric={m} />
                  ))}
                  {!dashboard?.metrics && (
                    <>
                      <MetricCard metric={{ key: 'coal_flow', label: 'Coal Moving Now', value: 420.5, unit: 'tonnes/hr', target: 'Normal: 360–520 t/h', tone: 'normal', delta: '+3.4%' }} />
                      <MetricCard metric={{ key: 'belt_speed', label: 'Belt Speed', value: 2.65, unit: 'm/s', target: 'Target: 2.65 m/s', tone: 'normal', delta: '75% set' }} />
                      <MetricCard metric={{ key: 'power_generated', label: 'Electricity Generated', value: '2,930 MW', unit: '(2,930,000 kW)', target: 'Rated: 3,000 MW', tone: 'normal', delta: '97.7% Load' }} />
                      <MetricCard metric={{ key: 'stock_quantity', label: 'Coal in Storage Yard', value: 142400, unit: 'tonnes', percentage: 72.8, target: 'Capacity: 200,000 t', tone: 'normal', delta: '18 Days Fuel' }} />
                      <MetricCard metric={{ key: 'bunker_level', label: 'Boiler Silos Filling', value: 75.7, unit: '%', target: 'Normal: 60–85%', tone: 'normal', delta: '6 Silos OK' }} />
                      <MetricCard metric={{ key: 'active_equipment', label: 'Machines Running', value: '7/7', unit: 'units', target: '7 Tracked Assets', tone: 'normal', delta: '100% Online' }} />
                    </>
                  )}
                </div>
              </section>

              {/* Animated Conveyor Belt System Section */}
              <section className="overview-conveyor-block">
                <div className="conveyor-section-header">
                  <div className="header-left">
                    <span className="scada-section-tag">FEATURE SIMULATION</span>
                    <h2>Live Conveyor Belt Motion &amp; Speed Controls</h2>
                  </div>
                  <button
                    className="view-full-sim-btn"
                    onClick={() => setActiveTab('Conveyor')}
                  >
                    <span>Full Screen Simulation Desk</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <ConveyorSimulation
                  controlState={controls}
                  onUpdateControls={handleUpdateControls}
                  onTriggerEmergencyStop={handleTriggerEmergencyStop}
                  onResetEmergency={handleResetEmergency}
                  liveFlow={latest.coal_flow}
                  liveSpeed={latest.belt_speed}
                />
              </section>

              {/* Process Flow Journey (Section 4) */}
              <section className="overview-pfd-block">
                <ProcessFlowDiagram
                  controlState={controls}
                  latestReading={latest}
                  onSelectEquipment={(eq) => setModalEquipment(eq)}
                />
              </section>
            </div>
          )}

          {/* TAB 2: EXACT ELECTRICITY GENERATED BY GENERATORS (6 X 500 MW) */}
          {activeTab === 'Generators' && (
            <div className="dedicated-tab-page">
              <GeneratorsPowerOverview
                apiBase={API_BASE}
                dashboardGenerators={dashboard?.generators}
              />
            </div>
          )}

          {/* TAB 3: WHOLE THERMAL PLANT WORKING (9 STEPS) */}
          {activeTab === 'ThermalPlant' && (
            <div className="dedicated-tab-page">
              <ThermalPlantOverview />
            </div>
          )}

          {/* TAB 4: DEDICATED CONVEYOR SIMULATION PAGE */}
          {activeTab === 'Conveyor' && (
            <div className="dedicated-tab-page">
              <ConveyorSimulation
                controlState={controls}
                onUpdateControls={handleUpdateControls}
                onTriggerEmergencyStop={handleTriggerEmergencyStop}
                onResetEmergency={handleResetEmergency}
                liveFlow={latest.coal_flow}
                liveSpeed={latest.belt_speed}
              />
            </div>
          )}

          {/* TAB 5: PROCESS FLOW DIAGRAM (PFD) */}
          {activeTab === 'ProcessFlow' && (
            <div className="dedicated-tab-page">
              <ProcessFlowDiagram
                controlState={controls}
                latestReading={latest}
                onSelectEquipment={(eq) => setModalEquipment(eq)}
              />
            </div>
          )}

          {/* TAB 6: EQUIPMENT MONITORING */}
          {activeTab === 'Equipment' && (
            <div className="dedicated-tab-page">
              <EquipmentMonitoring
                equipmentList={dashboard?.equipment}
                latestReading={latest}
                onSelectEquipment={(eq) => setModalEquipment(eq)}
              />
            </div>
          )}

          {/* TAB 7: LIVE ANALYTICS */}
          {activeTab === 'Analytics' && (
            <div className="dedicated-tab-page">
              <LiveAnalytics
                apiBase={API_BASE}
                latestHistory={dashboard?.history}
              />
            </div>
          )}

          {/* TAB 8: STOCKYARD & BUNKERS */}
          {activeTab === 'Stockyard' && (
            <div className="dedicated-tab-page">
              <StockyardBunker
                apiBase={API_BASE}
                latestReading={latest}
                stockyardPiles={dashboard?.stockyard_piles}
                bunkers={dashboard?.bunkers}
              />
            </div>
          )}

          {/* TAB 9: CONTROL ROOM */}
          {activeTab === 'ControlRoom' && (
            <div className="dedicated-tab-page">
              <ControlRoom
                controlState={controls}
                onUpdateControls={handleUpdateControls}
                onTriggerEmergencyStop={handleTriggerEmergencyStop}
                onResetEmergency={handleResetEmergency}
                latestReading={latest}
                onTriggerDemoAlert={handleTriggerDemoAlert}
              />
            </div>
          )}

          {/* TAB 10: ALERTS & NOTIFICATIONS */}
          {activeTab === 'Alerts' && (
            <div className="dedicated-tab-page">
              <AlertManagement
                alerts={dashboard?.alerts}
                onAcknowledge={handleAcknowledgeAlert}
                onResolve={handleResolveAlert}
                onTriggerDemoAlert={handleTriggerDemoAlert}
                onRefresh={() => loadDashboard(false)}
              />
            </div>
          )}

          {/* TAB 11: REPORTS & HISTORY */}
          {activeTab === 'Reports' && (
            <div className="dedicated-tab-page">
              <ReportsHistory
                apiBase={API_BASE}
                latestReading={latest}
              />
            </div>
          )}
        </main>
      </div>

      {/* Equipment Detailed Diagnostic Modal */}
      {modalEquipment && (
        <EquipmentModal
          equipment={modalEquipment}
          onClose={() => setModalEquipment(null)}
          latestReading={latest}
        />
      )}

      {/* NTPC Kaniha Factsheet & Viva Defense Guide Modal */}
      <PlantSpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
        apiBase={API_BASE}
      />

      {/* Clean Footer */}
      <footer className="scada-footer">
        <div className="footer-left">
          <Factory size={15} className="text-amber-600" />
          <span><strong>CoalFlow Project</strong> · NTPC Kaniha 6 X 500 MW (3,000 MW Total Installed Capacity)</span>
        </div>
        <div className="footer-right">
          <span>Simulation Active · Stage I (1995-1996) &amp; Stage II (2003-2005)</span>
        </div>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
