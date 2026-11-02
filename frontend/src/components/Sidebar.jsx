import React from 'react';
import {
  LayoutDashboard, PlayCircle, GitFork, Gauge, Activity,
  Boxes, Sliders, Bell, FileText, Shield, Info, Sparkles, Factory, Zap
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const NAV_ITEMS = [
  { id: 'Overview', label: 'Main Overview', icon: LayoutDashboard, tag: 'LIVE' },
  { id: 'Generators', label: 'Electricity (6x500 MW)', icon: Zap, tag: '3,000 MW' },
  { id: 'ThermalPlant', label: 'Whole Plant Working', icon: Factory, tag: '9 STEPS' },
  { id: 'Conveyor', label: 'Conveyor Belt Motion', icon: PlayCircle, tag: 'ANIMATION' },
  { id: 'ProcessFlow', label: 'Coal Route (7 Stages)', icon: GitFork, tag: 'PIPELINE' },
  { id: 'Equipment', label: 'Equipment Health', icon: Gauge, tag: 'SENSORS' },
  { id: 'Analytics', label: 'Charts & Trends', icon: Activity, tag: 'DATA' },
  { id: 'Stockyard', label: 'Coal Storage & Silos', icon: Boxes, tag: 'YARD' },
  { id: 'ControlRoom', label: 'Control Room Desk', icon: Sliders, tag: 'CONTROLS' },
  { id: 'Alerts', label: 'Safety Alerts', icon: Bell, tag: 'LOG' },
  { id: 'Reports', label: 'Shift Summary', icon: FileText, tag: 'CSV' },
];

export default function Sidebar({ activeTab, onSelectTab, alertCount, isTripped }) {
  return (
    <aside className="scada-sidebar">
      {/* Upper Navigation Header */}
      <div className="sidebar-section-title">NAVIGATION MENU</div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAlertTab = item.id === 'Alerts';

          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''} ${item.id === 'Generators' ? 'nav-gen-highlight' : ''}`}
              onClick={() => {
                playClickSound();
                onSelectTab(item.id);
              }}
            >
              <div className="nav-item-icon">
                <Icon size={18} />
              </div>
              <span className="nav-item-label">{item.label}</span>

              {isAlertTab && alertCount > 0 && (
                <span className="nav-alert-tag">{alertCount}</span>
              )}

              {!isAlertTab && item.tag && (
                <span className={`nav-mini-tag ${item.id === 'Generators' ? 'tag-generator' : item.id === 'ThermalPlant' ? 'tag-thermal' : ''}`}>
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Interlock Safety Status Widget */}
      <div className="sidebar-safety-box">
        <div className="safety-box-header">
          <Shield size={14} className={isTripped ? 'text-red-500' : 'text-emerald-600'} />
          <span>PLANT SAFETY</span>
        </div>
        <div className="safety-status-row">
          <span className={`safety-light ${isTripped ? 'light-trip' : 'light-ok'}`} />
          <strong className="safety-label">
            {isTripped ? 'EMERGENCY STOP' : 'ALL SYSTEMS SAFE'}
          </strong>
        </div>
        <div className="safety-subtext">
          {isTripped ? 'Belts paused. Click reset to start.' : 'Pull-cords and sensors normal.'}
        </div>
      </div>

      {/* Internship Reference Card */}
      <div className="sidebar-academic-card">
        <div className="academic-badge">NTPC KANIHA PROJECT</div>
        <p className="academic-notes">
          6 X 500 MW Super Thermal Power Station (Total 3,000 MW Capacity).
        </p>
        <div className="academic-footer">
          <span>Demo Data</span>
          <span className="disclaimer-dot" />
          <span>No Plant Link</span>
        </div>
      </div>
    </aside>
  );
}
