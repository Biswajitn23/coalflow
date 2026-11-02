import React, { useState } from 'react';
import {
  Train, Truck, Settings, Filter, Magnet, Layers,
  Flame, Wind, Zap, RefreshCw, Home, ArrowRight,
  CheckCircle, Info, Sparkles
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export const THERMAL_PLANT_STEPS = [
  {
    step: 1,
    title: '1. Coal Arrives by Train',
    shortName: 'Coal Receiving',
    icon: Train,
    color: '#0284c7',
    tag: 'FUEL INPUT',
    simpleExplanation: 'Railway trains bring thousands of tonnes of coal daily from mines. Bottom-doors open to drop coal into underground bins.',
    keyStats: 'Average 30,000 tonnes coal received every day',
    studentTip: 'NTPC Kaniha gets coal mainly from nearby Talcher coalfields via Merry-Go-Round (MGR) railway tracks.'
  },
  {
    step: 2,
    title: '2. Belt Conveyors Move Coal',
    shortName: 'Conveyor Belts',
    icon: RefreshCw,
    color: '#059669',
    tag: 'TRANSPORT',
    simpleExplanation: 'Long rubber belt conveyors carry coal across the plant at 2.6 meters per second (about 10 km/h).',
    keyStats: 'Over 12 kilometers of total conveyor belts',
    studentTip: 'Sensors check if the belt stays centered and pull-cords let workers stop the belt in any emergency.'
  },
  {
    step: 3,
    title: '3. Crushing & Removing Metal',
    shortName: 'Crush & Clean',
    icon: Settings,
    color: '#d97706',
    tag: 'PREPARATION',
    simpleExplanation: 'Big spinning crushers break large rocks down to 20mm pebbles. Big magnets pull out scrap iron nails and bolts so they don’t jam the machines.',
    keyStats: 'Reduces coal size from football-size to coin-size',
    studentTip: 'Tramp iron magnets protect the expensive pulverizer bowl mills from getting damaged.'
  },
  {
    step: 4,
    title: '4. Storage Yard & Bunkers',
    shortName: 'Storage & Silos',
    icon: Layers,
    color: '#7c3aed',
    tag: 'STORAGE BUFFER',
    simpleExplanation: 'Coal is stored in huge outdoor piles (enough for 18 days). Conveyors fill big funnel-shaped silos called bunkers right above the boiler.',
    keyStats: 'Stockyard stores up to 200,000 tonnes of coal reserve',
    studentTip: 'This ensures the power station never stops running even during heavy rain or train delays.'
  },
  {
    step: 5,
    title: '5. Mills Grind Coal into Powder',
    shortName: 'Pulverizer Mills',
    icon: Filter,
    color: '#ea580c',
    tag: 'PULVERIZING',
    simpleExplanation: 'Heavy steel balls or rollers crush the coal pebbles into superfine black powder (like face powder).',
    keyStats: 'Powdered coal burns instantly in mid-air',
    studentTip: 'Fine powder burns much hotter and cleaner than solid coal lumps, producing almost complete combustion.'
  },
  {
    step: 6,
    title: '6. Boiler Burns Coal to Make Steam',
    shortName: 'Boiler Furnace',
    icon: Flame,
    color: '#dc2626',
    tag: 'HEAT ENERGY',
    simpleExplanation: 'The powder is blown into a 60-meter high boiler furnace. Burning at 1,400°C, it boils pure water inside tubes into supercritical steam.',
    keyStats: 'Steam pressure: 170 atmospheres at 540°C',
    studentTip: 'Superheated steam carries enormous kinetic and thermal energy to spin the turbine.'
  },
  {
    step: 7,
    title: '7. Steam Turbine Spins at High Speed',
    shortName: 'Steam Turbine',
    icon: Wind,
    color: '#0891b2',
    tag: 'KINETIC ENERGY',
    simpleExplanation: 'High-pressure steam blasts against thousands of curved steel turbine blades, spinning the giant shaft at exactly 3,000 RPM (50 spins per second).',
    keyStats: 'Shaft spins at 3,000 RPM non-stop',
    studentTip: 'High-pressure, intermediate-pressure, and low-pressure turbine stages extract maximum mechanical energy from steam.'
  },
  {
    step: 8,
    title: '8. Generator Produces Electricity',
    shortName: 'Electric Generator',
    icon: Zap,
    color: '#2563eb',
    tag: 'ELECTRICAL POWER',
    simpleExplanation: 'The spinning turbine shaft rotates powerful electromagnets inside copper wire coils, generating massive electrical current.',
    keyStats: 'NTPC Kaniha Capacity: 3,000 MegaWatts (MW)',
    studentTip: 'Electricity is produced at 21,000 Volts and stepped up to 400,000 Volts (400 kV) for long-distance grid transmission.'
  },
  {
    step: 9,
    title: '9. Cooling Towers & Grid Transmission',
    shortName: 'Cooling & Homes',
    icon: Home,
    color: '#16a34a',
    tag: 'POWER TO HOMES',
    simpleExplanation: 'Huge concrete cooling towers cool the spent steam back into water to pump back into the boiler. High-voltage power lines send clean electricity to millions of homes.',
    keyStats: '100% water recycled back into closed loop',
    studentTip: 'White clouds seen rising from cooling towers are 100% harmless pure water vapor, not smoke!'
  }
];

export default function ThermalPlantOverview() {
  const [activeStep, setActiveStep] = useState(1);
  const current = THERMAL_PLANT_STEPS.find(s => s.step === activeStep) || THERMAL_PLANT_STEPS[0];

  return (
    <div className="thermal-plant-root">
      {/* Header */}
      <div className="thermal-plant-header">
        <div>
          <span className="thermal-badge">
            <Sparkles size={14} className="text-amber-500" />
            HOW ELECTRICITY IS MADE FROM COAL
          </span>
          <h2>Complete Thermal Power Plant Working Cycle</h2>
          <p className="thermal-desc">
            Simple step-by-step guide explaining how NTPC Kaniha converts raw coal into 3,000 MW of electricity for millions of homes.
          </p>
        </div>

        <div className="quick-summary-box">
          <div className="summary-step-tag">CURRENT SELECTED STAGE</div>
          <strong className="summary-step-title">{current.title}</strong>
        </div>
      </div>

      {/* Step by Step Horizontal Visual Tracker */}
      <div className="plant-timeline-strip">
        {THERMAL_PLANT_STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = s.step === activeStep;
          return (
            <button
              key={s.step}
              className={`timeline-step-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setActiveStep(s.step);
              }}
            >
              <div className="step-icon-wrap" style={{ background: isActive ? s.color : '#f1f5f9', color: isActive ? '#fff' : s.color }}>
                <Icon size={18} />
              </div>
              <span className="step-num">Step {s.step}</span>
              <strong className="step-name">{s.shortName}</strong>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Card for Selected Step */}
      <div className="step-detail-card" style={{ borderLeft: `5px solid ${current.color}` }}>
        <div className="step-card-header">
          <div className="step-card-title-lockup">
            <span className="step-tag-pill" style={{ background: `${current.color}18`, color: current.color }}>
              {current.tag}
            </span>
            <h3>{current.title}</h3>
          </div>
          <span className="step-counter">Step {current.step} of 9</span>
        </div>

        <p className="step-simple-text">{current.simpleExplanation}</p>

        <div className="step-info-grid">
          <div className="info-box key-facts">
            <span className="info-label">KEY OPERATING FACT</span>
            <strong>{current.keyStats}</strong>
          </div>

          <div className="info-box student-explanation">
            <span className="info-label">WHAT TO TELL YOUR EVALUATOR / TEACHER</span>
            <p>{current.studentTip}</p>
          </div>
        </div>

        {/* Next / Previous Step Buttons */}
        <div className="step-card-footer">
          <button
            className="step-nav-btn prev-btn"
            disabled={activeStep === 1}
            onClick={() => { playClickSound(); setActiveStep(prev => Math.max(1, prev - 1)); }}
          >
            ← Previous Step
          </button>

          <span className="click-hint">Tip: Click any step above to explore that part of the plant</span>

          <button
            className="step-nav-btn next-btn"
            disabled={activeStep === 9}
            onClick={() => { playClickSound(); setActiveStep(prev => Math.min(9, prev + 1)); }}
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  );
}
