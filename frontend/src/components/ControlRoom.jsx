import React, { useState } from 'react';
import {
  Sliders, Play, Pause, Square, AlertOctagon, RotateCcw,
  Zap, Droplets, Shield, Bell, CheckCircle2, AlertTriangle,
  Flame, Lock, Unlock, Cpu, ToggleLeft, ToggleRight
} from 'lucide-react';
import { playClickSound, playStartSound, playEmergencyStopSound } from '../utils/audio';

export default function ControlRoom({
  controlState,
  onUpdateControls,
  onTriggerEmergencyStop,
  onResetEmergency,
  latestReading,
  onTriggerDemoAlert,
}) {
  const [selectedMode, setSelectedMode] = useState(controlState?.operating_mode || 'AUTO');
  const [dustSpray, setDustSpray] = useState(controlState?.dust_suppression ?? true);
  const [feedRate, setFeedRate] = useState(controlState?.feed_rate_pct ?? 78);
  const [interlockKey, setInterlockKey] = useState(false);

  const isRunning = controlState?.status === 'RUNNING';
  const isEmergency = controlState?.status === 'EMERGENCY_STOP';

  const handleModeSwitch = (mode) => {
    playClickSound();
    setSelectedMode(mode);
    onUpdateControls({ operating_mode: mode });
  };

  const handleToggleDust = () => {
    playClickSound();
    const next = !dustSpray;
    setDustSpray(next);
    onUpdateControls({ dust_suppression: next });
  };

  const handleFeedRateChange = (e) => {
    const val = Number(e.target.value);
    setFeedRate(val);
    onUpdateControls({ feed_rate_pct: val });
  };

  return (
    <div className="control-room-root">
      {/* SCADA Workstation Title Header */}
      <div className="cr-header">
        <div>
          <div className="cr-badge">
            <Cpu size={14} className="text-cyan-400" />
            <span>CENTRAL SCADA OPERATOR CONSOLE</span>
          </div>
          <h2>Control Room Operations Desk</h2>
          <p className="cr-desc">
            Industrial control room terminal inspired by NTPC fuel handling DCS consoles. Execute sequence commands, adjust feed gates, and supervise safety interlocks.
          </p>
        </div>

        <div className="cr-mode-selector">
          <span className="mode-label">OPERATING MODE:</span>
          <div className="mode-btn-group">
            {['AUTO', 'MANUAL', 'MAINTENANCE'].map((m) => (
              <button
                key={m}
                className={`mode-btn ${selectedMode === m ? 'active' : ''}`}
                onClick={() => handleModeSwitch(m)}
                disabled={isEmergency}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="cr-console-grid">
        {/* Panel 1: Master Plant Sequence Control */}
        <div className="cr-card sequence-panel">
          <div className="cr-card-header">
            <div className="header-icon">
              <Zap size={18} className="text-amber-400" />
            </div>
            <div>
              <h3>Master Plant Sequence Controls</h3>
              <span>Coordinated sequential start/stop of conveyor line</span>
            </div>
          </div>

          <div className="sequence-actions-list">
            <button
              className={`seq-btn seq-start ${isRunning ? 'active' : ''}`}
              onClick={() => {
                playStartSound();
                onUpdateControls({ status: 'RUNNING' });
              }}
              disabled={isEmergency}
            >
              <Play size={18} fill="currentColor" />
              <div>
                <strong>CASCADE START SEQUENCE</strong>
                <span>Starts CV-05 → CV-04 → MS-01 → CR-01 → CV-02 → CV-01</span>
              </div>
            </button>

            <button
              className="seq-btn seq-pause"
              onClick={() => {
                playClickSound();
                onUpdateControls({ status: 'PAUSED' });
              }}
              disabled={isEmergency || controlState?.status === 'STOPPED'}
            >
              <Pause size={18} fill="currentColor" />
              <div>
                <strong>PROCESS PAUSE (HOLD)</strong>
                <span>Holds conveyor line without clearing cascade sequence</span>
              </div>
            </button>

            <button
              className="seq-btn seq-stop"
              onClick={() => {
                playClickSound();
                onUpdateControls({ status: 'STOPPED' });
              }}
              disabled={isEmergency}
            >
              <Square size={18} fill="currentColor" />
              <div>
                <strong>CONTROLLED RUNOUT STOP</strong>
                <span>Feeder halts first; belt empties before drive shutdown</span>
              </div>
            </button>
          </div>

          {/* Emergency Trip Panel Section */}
          <div className="estop-desk-block">
            <div className="estop-desk-header">
              <AlertOctagon size={16} className="text-red-400" />
              <span>SAFETY INTERLOCK HARDWIRED TRIP</span>
            </div>

            <button
              className="giant-estop-btn"
              onClick={() => {
                playEmergencyStopSound();
                onTriggerEmergencyStop('Control Room Operator Console Emergency Push');
              }}
            >
              <span className="btn-collar" />
              <span className="btn-head">EMERGENCY TRIP</span>
            </button>

            {isEmergency ? (
              <button
                className="cr-reset-trip-btn"
                onClick={() => {
                  playClickSound();
                  onResetEmergency();
                }}
              >
                <RotateCcw size={14} /> CLEAR &amp; RESET SAFETY INTERLOCKS
              </button>
            ) : (
              <div className="estop-hint">
                Trips all 6 conveyor drives and pulverizer feeders within 200ms.
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Feeder Gate & Auxiliaries */}
        <div className="cr-card auxiliaries-panel">
          <div className="cr-card-header">
            <div className="header-icon">
              <Sliders size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3>Track Hopper Feeder &amp; Auxiliaries</h3>
              <span>Vibratory apron feeder gate and environmental systems</span>
            </div>
          </div>

          {/* Feeder Gate Slider */}
          <div className="aux-control-box">
            <div className="aux-label-row">
              <span>Track Hopper Apron Feeder Gate</span>
              <strong>{feedRate}% ({Math.round((feedRate / 100) * 650)} t/h)</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={feedRate}
              onChange={handleFeedRateChange}
              className="aux-slider"
              disabled={isEmergency}
            />
            <div className="slider-limits">
              <span>0% Closed</span>
              <span>Nominal (78%)</span>
              <span>100% Full Gate</span>
            </div>
          </div>

          {/* Dust Suppression Water Sprinklers */}
          <div className="aux-toggle-row">
            <div className="toggle-info">
              <Droplets size={18} className={dustSpray ? 'text-cyan-400 animate-bounce' : 'text-slate-500'} />
              <div>
                <strong>Water Mist Dust Suppression</strong>
                <span>Atomized high-pressure mist at transfer towers</span>
              </div>
            </div>
            <button
              className={`toggle-switch-btn ${dustSpray ? 'on' : 'off'}`}
              onClick={handleToggleDust}
            >
              {dustSpray ? <ToggleRight size={26} className="text-cyan-400" /> : <ToggleLeft size={26} className="text-slate-500" />}
              <span>{dustSpray ? 'ACTIVE' : 'OFF'}</span>
            </button>
          </div>

          {/* Fire Deluge Status */}
          <div className="aux-toggle-row">
            <div className="toggle-info">
              <Flame size={18} className="text-amber-400" />
              <div>
                <strong>Optical Flame &amp; CO Detection</strong>
                <span>Infrared thermal scanner in conveyor tunnel</span>
              </div>
            </div>
            <span className="health-tag-good">HEALTHY / NORMAL</span>
          </div>

          {/* Demo Alert Injector Button (For presentation demonstration!) */}
          <div className="presentation-demo-tool">
            <span className="tool-title">EXAMINER PRESENTATION TOOL</span>
            <p>Inject a live simulated warning alert into the SCADA annunciator to demonstrate fault detection handling:</p>
            <button
              className="demo-alert-trigger-btn"
              onClick={() => {
                playClickSound();
                onTriggerDemoAlert();
              }}
            >
              <Bell size={14} /> TRIGGER SIMULATED TEST ALARM
            </button>
          </div>
        </div>
      </div>

      {/* Panel 3: SCADA PLC Ladder & Event Transition Log */}
      <div className="cr-card event-ladder-panel">
        <div className="cr-card-header">
          <div className="header-icon">
            <Cpu size={18} className="text-purple-400" />
          </div>
          <div>
            <h3>SCADA Controller Ladder &amp; Interlock Telemetry</h3>
            <span>Real-time PLC state machine status &amp; digital inputs</span>
          </div>
        </div>

        <div className="ladder-grid">
          {[
            { tag: 'DI-101', name: 'Pull-Cord Loop CV-01', state: 'CLOSED (HEALTHY)', ok: true },
            { tag: 'DI-102', name: 'Belt Sway Limit Switch CV-02', state: 'NORMAL (NO SWAY)', ok: true },
            { tag: 'DI-103', name: 'Zero Speed Switch (ZSS) CV-01', state: isRunning ? 'PULSES OK' : 'STOPPED', ok: isRunning },
            { tag: 'DI-104', name: 'Chute Blockage Sensor CH-01', state: 'CLEAR', ok: true },
            { tag: 'DI-105', name: 'Crusher Bearing Temp RTD', state: latestReading?.motor_temp > 82 ? 'HIGH (ALERT)' : 'NORMAL', ok: latestReading?.motor_temp <= 82 },
            { tag: 'DI-106', name: 'Tripper Car Travel Interlock', state: 'LOCKED POS #5', ok: true },
          ].map((item) => (
            <div key={item.tag} className="ladder-item">
              <span className="ladder-tag">{item.tag}</span>
              <strong className="ladder-name">{item.name}</strong>
              <div className="ladder-state">
                <span className={`ladder-dot ${item.ok ? 'dot-ok' : 'dot-warn'}`} />
                <span>{item.state}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
