import React, { useState } from 'react';
import {
  Truck, Activity, Settings2, Filter, Magnet, Layers3,
  Factory, ChevronRight, Zap, Info, ExternalLink,
  CheckCircle2, AlertTriangle, Train
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const PFD_STAGES = [
  {
    step: '1',
    id: 'TH-01',
    name: 'Train Unloading',
    equipment: 'Track Hopper & Wagon Unloader',
    subtext: 'Coal trains arrive from Talcher mines',
    status: 'Running',
    tone: 'good',
    feedRate: '620 t/h',
    parameterLabel: 'Unloading Speed',
    parameterVal: '620 tonnes/hr',
    temp: '32°C Normal',
    vibration: '1.2 mm/s Low',
    drivePower: 'Hydraulic Doors',
    spec: 'Unloads 4 railway wagons at a time into underground hoppers',
    description: 'Coal arrives by goods train. Doors under the train open and coal falls down into deep underground steel bins called track hoppers.',
  },
  {
    step: '2',
    id: 'CV-01',
    name: 'Conveyor Belts',
    equipment: 'Conveyors CV-01 & CV-02',
    subtext: 'Carries coal across the power plant',
    status: 'Running',
    tone: 'good',
    feedRate: '2.65 m/s',
    parameterLabel: 'Belt Speed',
    parameterVal: '2.65 m/s (~10 km/h)',
    temp: '68°C Healthy',
    vibration: '2.3 mm/s Normal',
    drivePower: '132 kW Electric Motor',
    spec: '1.4 meter wide heavy-duty rubber belt with steel reinforcement',
    description: 'Wide continuous rubber belts roll over steel rollers to transport coal from the train station over to the crushing house.',
  },
  {
    step: '3',
    id: 'CR-01',
    name: 'Coal Crusher',
    equipment: 'Ring Granulator Crusher',
    subtext: 'Breaks big coal lumps into small pebbles',
    status: 'Running',
    tone: 'good',
    feedRate: '735 RPM',
    parameterLabel: 'Rotor Speed',
    parameterVal: '735 RPM (Spinning)',
    temp: '74°C Operating',
    vibration: '3.4 mm/s Normal',
    drivePower: '315 kW Heavy Motor',
    spec: 'Rings smash coal rocks against steel plates to make <20mm pebbles',
    description: 'Huge spinning hammers smash large football-sized coal rocks into small 20mm pebbles so they can easily burn in the boiler.',
  },
  {
    step: '4',
    id: 'VS-01',
    name: 'Vibrating Sieve',
    equipment: 'Double-Deck Vibrating Screen',
    subtext: 'Separates small pebbles from oversize rocks',
    status: 'Running',
    tone: 'good',
    feedRate: '960 RPM',
    parameterLabel: 'Shaking Speed',
    parameterVal: '960 shakes/min',
    temp: '58°C Cool',
    vibration: '4.1 mm/s Spring-tuned',
    drivePower: '45 kW Shaker Motor',
    spec: 'Shakes coal across two steel sieves with 25mm and 15mm holes',
    description: 'Like a kitchen sieve, this shaking machine lets small pebbles pass through directly while sending any large rocks back to the crusher.',
  },
  {
    step: '5',
    id: 'MS-01',
    name: 'Iron Magnet',
    equipment: 'Overband Magnetic Separator',
    subtext: 'Removes nails and scrap metal',
    status: 'Running',
    tone: 'good',
    feedRate: '1.8 Tesla',
    parameterLabel: 'Magnet Strength',
    parameterVal: '1.8 Tesla High Field',
    temp: '54°C Normal',
    vibration: '1.1 mm/s Low',
    drivePower: 'Electric Magnet Coil',
    spec: 'Pulls out scrap iron, bolts, and wire automatically',
    description: 'A powerful electromagnet suspended above the belt pulls out scrap iron, railway spikes, and bolts to protect the boilers from being damaged.',
  },
  {
    step: '6',
    id: 'SY-01',
    name: 'Coal Storage Yard',
    equipment: 'Outdoor Stockpiles & Stacker',
    subtext: 'Holds 18 days of reserve fuel for the plant',
    status: 'Running',
    tone: 'good',
    feedRate: '142,400 t',
    parameterLabel: 'Total Stored',
    parameterVal: '142,400 tonnes coal',
    temp: '34°C Ambient',
    vibration: '1.8 mm/s Normal',
    drivePower: 'Traveling Boom Machine',
    spec: 'Holds 200,000 tonnes of coal reserve in 3 organized piles',
    description: 'A massive outdoor coal yard stores enough fuel for 18 continuous days of power generation in case trains are delayed by rain or maintenance.',
  },
  {
    step: '7',
    id: 'BNK-01',
    name: 'Boiler Silos (Bunkers)',
    equipment: 'Incline Tripper Conveyor CV-05',
    subtext: 'Feeding 6 boiler units to make electricity',
    status: 'Running',
    tone: 'good',
    feedRate: '75.7%',
    parameterLabel: 'Silo Fill Level',
    parameterVal: '75.7% (6 Silos Filled)',
    temp: '38°C Silo Top',
    vibration: '2.5 mm/s Normal',
    drivePower: '160 kW Incline Drive',
    spec: '6 huge funnel silos holding 650 tonnes each above the boilers',
    description: 'A moving conveyor car called a tripper travels along the top floor, dropping crushed coal into 6 tall silos right above the power boilers.',
  },
];

export default function ProcessFlowDiagram({
  controlState,
  latestReading,
  onSelectEquipment,
}) {
  const isRunning = controlState?.status === 'RUNNING';
  const isEmergency = controlState?.status === 'EMERGENCY_STOP';
  const [hoveredStage, setHoveredStage] = useState(null);

  return (
    <div className="pfd-root-card">
      {/* PFD Header */}
      <div className="pfd-header">
        <div>
          <div className="pfd-badge">
            <Zap size={14} className="text-amber-600" />
            <span>STEP-BY-STEP COAL JOURNEY</span>
          </div>
          <h2 className="pfd-title">How Coal Moves Through the Plant (7 Stages)</h2>
          <p className="pfd-desc">
            Follow the material flow from railway train arrival to the boiler silos. Click any stage to see what it does!
          </p>
        </div>

        <div className="pfd-flow-status">
          <div className="flow-legend">
            <span className={`pulse-flow-indicator ${isRunning ? 'flow-active' : ''}`} />
            <span>{isRunning ? 'COAL MOVING ACROSS STAGES' : isEmergency ? 'STOPPED (EMERGENCY)' : 'STANDBY'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Horizontal Flow Map */}
      <div className="pfd-flow-container">
        {PFD_STAGES.map((stage, idx) => {
          const isSelected = hoveredStage?.id === stage.id;
          const statusTone = isEmergency ? 'critical' : isRunning ? stage.tone : 'idle';

          return (
            <React.Fragment key={stage.id}>
              {/* Stage Card */}
              <div
                className={`pfd-stage-node ${statusTone} ${isSelected ? 'stage-hover' : ''}`}
                onClick={() => {
                  playClickSound();
                  onSelectEquipment(stage);
                }}
                onMouseEnter={() => setHoveredStage(stage)}
                title="Click to view details and sensor readings"
              >
                {/* Node Step Index & ID */}
                <div className="node-top-bar">
                  <span className="node-step">STAGE {stage.step}</span>
                  <span className={`node-status-dot ${statusTone}`} />
                </div>

                {/* SVG Visual Graphic for Equipment Stage */}
                <div className="node-graphic-container">
                  {idx === 0 && <TrackHopperGraphic isRunning={isRunning} />}
                  {idx === 1 && <ConveyorGraphic isRunning={isRunning} />}
                  {idx === 2 && <CrusherGraphic isRunning={isRunning} />}
                  {idx === 3 && <ScreenGraphic isRunning={isRunning} />}
                  {idx === 4 && <MagnetGraphic isRunning={isRunning} />}
                  {idx === 5 && <StockpileGraphic isRunning={isRunning} />}
                  {idx === 6 && <BunkerGraphic isRunning={isRunning} />}
                </div>

                {/* Node Name & Spec in Simple Words */}
                <div className="node-details">
                  <span className="node-code">{stage.id}</span>
                  <strong className="node-title">{stage.name}</strong>
                  <span className="node-sub">{stage.subtext}</span>
                </div>

                {/* Live Reading Pill */}
                <div className="node-reading-pill">
                  <span className="reading-label">{stage.parameterLabel}</span>
                  <strong className="reading-val">{stage.parameterVal}</strong>
                </div>

                {/* Click CTA */}
                <div className="node-click-hint">
                  <span>Click to view details</span>
                  <ChevronRight size={12} />
                </div>
              </div>

              {/* Connecting Pipeline with animated flow pulses */}
              {idx < PFD_STAGES.length - 1 && (
                <div className="pfd-connector">
                  <div className={`connector-pipe ${isRunning ? 'flow-active' : ''}`} />
                  <ChevronRight size={14} className="connector-chevron" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stage Detail Peek Banner */}
      {hoveredStage && (
        <div className="pfd-peek-card">
          <div className="peek-left">
            <span className="peek-tag">STAGE {hoveredStage.step}: {hoveredStage.name.toUpperCase()}</span>
            <h4>{hoveredStage.equipment}</h4>
            <p>{hoveredStage.description}</p>
          </div>
          <div className="peek-stats">
            <div className="peek-stat-item">
              <span>Operating Temp</span>
              <strong>{hoveredStage.temp}</strong>
            </div>
            <div className="peek-stat-item">
              <span>Vibration Level</span>
              <strong>{hoveredStage.vibration}</strong>
            </div>
            <div className="peek-stat-item">
              <span>Motor Rating</span>
              <strong>{hoveredStage.drivePower}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Clean Light SVG Graphics
function TrackHopperGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      <polygon points="15,12 85,12 65,46 35,46" fill="#e2e8f0" stroke="#0284c7" strokeWidth="2" />
      <rect x="25" y="4" width="50" height="12" fill="#64748b" stroke="#334155" strokeWidth="1.5" rx="2" />
      <circle cx="35" cy="18" r="3" fill="#334155" />
      <circle cx="65" cy="18" r="3" fill="#334155" />
      {isRunning && (
        <>
          <circle cx="45" cy="30" r="2.5" fill="#1e293b" />
          <circle cx="55" cy="35" r="3" fill="#0f172a" />
          <circle cx="48" cy="42" r="2" fill="#1e293b" />
        </>
      )}
      <rect x="30" y="48" width="40" height="6" fill="#334155" rx="1" />
    </svg>
  );
}

function ConveyorGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      <line x1="10" y1="36" x2="90" y2="36" stroke="#94a3b8" strokeWidth="2" />
      <line x1="15" y1="46" x2="85" y2="46" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="20" y1="36" x2="35" y2="46" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="35" y1="46" x2="50" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="50" y1="36" x2="65" y2="46" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="65" y1="46" x2="80" y2="36" stroke="#cbd5e1" strokeWidth="1.5" />
      <circle cx="15" cy="36" r="8" fill="#e2e8f0" stroke="#0284c7" strokeWidth="2" />
      <circle cx="85" cy="36" r="8" fill="#e2e8f0" stroke="#059669" strokeWidth="2" />
      <line
        x1="15" y1="28" x2="85" y2="28"
        stroke="#1e293b" strokeWidth="3"
        strokeDasharray={isRunning ? '5 3' : 'none'}
      />
    </svg>
  );
}

function CrusherGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      <rect x="25" y="10" width="50" height="42" fill="#fef3c7" stroke="#d97706" strokeWidth="2" rx="4" />
      <circle cx="50" cy="31" r="5" fill="#d97706" />
      <g className={isRunning ? 'spin-fast' : ''} style={{ transformOrigin: '50px 31px' }}>
        <line x1="50" y1="16" x2="50" y2="46" stroke="#b45309" strokeWidth="2.5" />
        <line x1="35" y1="31" x2="65" y2="31" stroke="#b45309" strokeWidth="2.5" />
        <rect x="47" y="14" width="6" height="5" fill="#dc2626" />
        <rect x="47" y="43" width="6" height="5" fill="#dc2626" />
        <rect x="33" y="28" width="5" height="6" fill="#dc2626" />
        <rect x="62" y="28" width="5" height="6" fill="#dc2626" />
      </g>
    </svg>
  );
}

function ScreenGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      <polygon points="20,16 85,26 80,44 15,34" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2" />
      <line x1="25" y1="24" x2="80" y2="33" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="22" y1="30" x2="77" y2="39" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M 25,35 L 23,48 L 27,52" fill="none" stroke="#64748b" strokeWidth="2" />
      <path d="M 75,43 L 73,53 L 77,57" fill="none" stroke="#64748b" strokeWidth="2" />
    </svg>
  );
}

function MagnetGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      <rect x="25" y="10" width="50" height="22" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" rx="3" />
      <text x="50" y="25" fill="#0369a1" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">MAGNET</text>
      <line x1="10" y1="46" x2="90" y2="46" stroke="#475569" strokeWidth="3" />
      {isRunning && (
        <g stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" className="animate-pulse">
          <line x1="35" y1="33" x2="35" y2="44" />
          <line x1="50" y1="33" x2="50" y2="44" />
          <line x1="65" y1="33" x2="65" y2="44" />
        </g>
      )}
    </svg>
  );
}

function StockpileGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      <polygon points="10,50 35,22 65,22 90,50" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
      <polygon points="20,50 40,30 60,30 80,50" fill="#334155" />
      <line x1="20" y1="12" x2="60" y2="24" stroke="#64748b" strokeWidth="3" />
      <circle cx="20" cy="12" r="5" fill="#0284c7" />
      <circle cx="60" cy="24" r="3" fill="#d97706" />
    </svg>
  );
}

function BunkerGraphic({ isRunning }) {
  return (
    <svg viewBox="0 0 100 60" className="pfd-svg">
      {[22, 50, 78].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 11} y="10" width="22" height="24" fill="#e2e8f0" stroke="#0284c7" strokeWidth="1.5" />
          <polygon points={`${cx - 11},34 ${cx + 11},34 ${cx + 4},46 ${cx - 4},46`} fill="#e2e8f0" stroke="#0284c7" strokeWidth="1.5" />
          <rect x={cx - 9} y="20" width="18" height="13" fill="#1e293b" />
        </g>
      ))}
      <line x1="8" y1="8" x2="92" y2="8" stroke="#64748b" strokeWidth="2" />
    </svg>
  );
}
