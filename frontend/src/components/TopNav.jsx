import React, { useEffect, useState } from 'react';
import {
  Factory, Clock, ShieldCheck, Bell, Volume2, VolumeX,
  Maximize2, Minimize2, AlertOctagon, RotateCcw, RefreshCw, Download, BookOpen
} from 'lucide-react';
import { toggleSound, isSoundEnabled, playClickSound } from '../utils/audio';

export default function TopNav({
  dashboard,
  onRefresh,
  controlState,
  onResetEmergency,
  onOpenAlerts,
  onOpenSpecs,
  apiBase,
}) {
  const [timeStr, setTimeStr] = useState('');
  const [soundOn, setSoundOn] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const next = toggleSound();
    setSoundOn(next);
    if (next) playClickSound();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const isEmergency = controlState?.status === 'EMERGENCY_STOP';
  const activeAlerts = dashboard?.summary?.active_alerts ?? 0;

  return (
    <header className="scada-topbar">
      {/* Brand & Facility Info */}
      <div className="topbar-left">
        <div className="scada-logo-box">
          <Factory size={22} className="text-amber-600" />
        </div>
        <div className="topbar-facility">
          <div className="facility-title">
            <span className="brand-glow">CoalFlow</span>
            <span className="scada-label">Plant Monitor</span>
          </div>
          <span className="facility-subtitle">NTPC Kaniha · Thermal Power Station Internship Prototype</span>
        </div>
      </div>

      {/* Center Operational Clock */}
      <div className="topbar-center">
        <div className="clock-pill">
          <Clock size={14} className="text-sky-600" />
          <span className="clock-ist">{timeStr || '00:00:00 IST'}</span>
        </div>

        <div className="demo-status-pill" title="Educational student prototype with simulated readings">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>SIMULATED DEMO DATA · EDUCATIONAL PROTOTYPE</span>
        </div>
      </div>

      {/* Right Controls & Status Indicators */}
      <div className="topbar-right">
        {isEmergency ? (
          <div className="e-stop-active-pill">
            <AlertOctagon size={14} />
            <span>EMERGENCY STOP TRIPPED</span>
            <button
              className="quick-reset-btn"
              onClick={() => { playClickSound(); onResetEmergency(); }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        ) : (
          <div className="system-healthy-pill">
            <span className="pulse-green-dot" />
            <span>SYSTEM HEALTHY</span>
          </div>
        )}

        {/* Alert Bell Badge */}
        <button
          className="topbar-tool-btn alert-badge-btn"
          onClick={onOpenAlerts}
          title="Open Alerts & Warnings"
        >
          <Bell size={17} />
          {activeAlerts > 0 && (
            <span className="alert-count-bubble">
              {activeAlerts}
            </span>
          )}
        </button>

        {/* Audio Effects Toggle */}
        <button
          className={`topbar-tool-btn ${soundOn ? 'sound-on' : ''}`}
          onClick={handleToggleSound}
          title={soundOn ? 'Mute sound effects' : 'Turn on sound effects'}
        >
          {soundOn ? <Volume2 size={17} className="text-emerald-600" /> : <VolumeX size={17} />}
        </button>

        {/* Fullscreen Toggle */}
        <button
          className="topbar-tool-btn"
          onClick={handleToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>

        {/* Manual Refresh Button */}
        <button
          className="topbar-tool-btn"
          onClick={onRefresh}
          title="Refresh readings"
        >
          <RefreshCw size={17} />
        </button>

        {/* Plant Specs & Viva Guide Modal Button */}
        <button
          className="topbar-specs-btn"
          onClick={() => { playClickSound(); onOpenSpecs?.(); }}
          title="NTPC Kaniha Plant Specifications & Viva Defense Guide"
        >
          <BookOpen size={14} className="text-amber-600" />
          <span>Plant Specs &amp; Viva</span>
        </button>

        {/* CSV Export */}
        <a
          href={`${apiBase}/api/export.csv`}
          className="topbar-export-btn"
          title="Download simulated sensor readings as CSV"
        >
          <Download size={14} />
          <span>Download CSV</span>
        </a>
      </div>
    </header>
  );
}
