import React, { useState, useEffect } from 'react';
import {
  X, BookOpen, Factory, Fuel, Droplet, Wind,
  HelpCircle, CheckCircle2, ChevronRight, Award, Zap
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

export default function PlantSpecsModal({ isOpen, onClose, apiBase }) {
  const [activeSubTab, setActiveSubTab] = useState('specs');
  const [specs, setSpecs] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSpecs = async () => {
      try {
        const res = await fetch(`${apiBase}/api/plant-specs`);
        if (res.ok) setSpecs(await res.json());
      } catch (e) {}
    };
    fetchSpecs();
  }, [isOpen, apiBase]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-layer" onClick={onClose}>
      <div
        className="plant-specs-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="psm-header">
          <div className="psm-title-lockup">
            <div className="psm-badge-icon">
              <Factory size={22} className="text-amber-500" />
            </div>
            <div>
              <div className="psm-tag">NTPC TALCHER SUPER THERMAL POWER STATION (TSTPS)</div>
              <h2>NTPC Kaniha Plant Factsheet &amp; Viva Defense Guide</h2>
            </div>
          </div>
          <button
            className="psm-close-btn"
            onClick={() => { playClickSound(); onClose(); }}
            title="Close modal (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="psm-subtabs">
          <button
            className={`psm-tab-btn ${activeSubTab === 'specs' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveSubTab('specs'); }}
          >
            <Award size={15} />
            <span>Plant Engineering Specs</span>
          </button>
          <button
            className={`psm-tab-btn ${activeSubTab === 'chp' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveSubTab('chp'); }}
          >
            <Fuel size={15} />
            <span>Coal &amp; Rail Logistics (CHP)</span>
          </button>
          <button
            className={`psm-tab-btn ${activeSubTab === 'water' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveSubTab('water'); }}
          >
            <Droplet size={15} />
            <span>Water, Steam &amp; Chimneys</span>
          </button>
          <button
            className={`psm-tab-btn ${activeSubTab === 'viva' ? 'active' : ''}`}
            onClick={() => { playClickSound(); setActiveSubTab('viva'); }}
          >
            <HelpCircle size={15} />
            <span>Viva &amp; Presentation Q&amp;A</span>
          </button>
        </div>

        {/* Tab 1: Engineering Specs */}
        {activeSubTab === 'specs' && (
          <div className="psm-content-body">
            <div className="psm-grid-row">
              <div className="psm-spec-card">
                <span className="psc-label">STATION IDENTITY</span>
                <h4>NTPC Talcher Kaniha</h4>
                <p>Second largest thermal power station of NTPC Ltd. Commissioned between 1995 and 2005.</p>
                <div className="psc-mini-meta">
                  <span>Location:</span> <strong>Kaniha, Angul, Odisha</strong>
                </div>
              </div>

              <div className="psm-spec-card highlight">
                <span className="psc-label">INSTALLED GENERATION</span>
                <h4>3,000 MW (3,000,000 kW)</h4>
                <p>Configured as <strong>6 X 500 MW subcritical coal-fired units</strong> with tandem compound turbines.</p>
                <div className="psc-mini-meta">
                  <span>Daily Fuel:</span> <strong>~42,000 tonnes/day</strong>
                </div>
              </div>

              <div className="psm-spec-card">
                <span className="psc-label">STAGE I CAPACITY</span>
                <h4>1,000 MW (Units 1 &amp; 2)</h4>
                <p>Commercial: Unit 1 (Feb 1995), Unit 2 (Mar 1996). Powers 8 Eastern &amp; NE states via 400 kV AC grid.</p>
                <div className="psc-mini-meta">
                  <span>Beneficiaries:</span> <strong>Odisha, Bihar, WB, Jharkhand, DVC, Sikkim, Assam, Tripura</strong>
                </div>
              </div>

              <div className="psm-spec-card">
                <span className="psc-label">STAGE II CAPACITY</span>
                <h4>2,000 MW (Units 3, 4, 5 &amp; 6)</h4>
                <p>Commercial: 2003–2005. Dedicated 1,450 km Talcher–Kolar ±500 kV HVDC link to southern states.</p>
                <div className="psc-mini-meta">
                  <span>Beneficiaries:</span> <strong>Andhra Pradesh, Karnataka, Tamil Nadu, Kerala, Puducherry</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: CHP & Rail Logistics */}
        {activeSubTab === 'chp' && (
          <div className="psm-content-body">
            <div className="psm-feature-box">
              <Fuel size={20} className="text-amber-500" />
              <div>
                <h4>Coal Sourcing &amp; Rail Unloading System</h4>
                <p>
                  Coal is sourced from <strong>Mahanadi Coalfields Limited (MCL)</strong> — predominantly <strong>Lingaraj and Kaniha Open Cast Mines</strong> in the Talcher Coalfields.
                </p>
              </div>
            </div>

            <div className="psm-chp-facts-grid">
              <div className="pcf-item">
                <span className="pcf-label">MGR Private Railway</span>
                <strong>Dedicated Merry-Go-Round System</strong>
                <small>NTPC's private closed-loop rail track with specialized electric locomotives.</small>
              </div>

              <div className="pcf-item">
                <span className="pcf-label">BOBR Rakes</span>
                <strong>58-Wagon Bottom-Discharge Trains</strong>
                <small>Air-actuated hopper doors open automatically over the track hopper bays.</small>
              </div>

              <div className="pcf-item">
                <span className="pcf-label">Track Hopper</span>
                <strong>210-Meter Length (33 Pits)</strong>
                <small>Unloads an entire 3,500-tonne coal rake in only 25 to 35 minutes.</small>
              </div>

              <div className="pcf-item">
                <span className="pcf-label">Overland Conveyor (OLC)</span>
                <strong>Pit-head to Plant Conveyor</strong>
                <small>Direct bulk conveyor delivering crushed coal into the plant stockyard.</small>
              </div>

              <div className="pcf-item">
                <span className="pcf-label">Crusher House Output</span>
                <strong>Ring Granulators &lt; 20 mm</strong>
                <small>Reduces raw coal from 250mm lumps to under 20mm for boiler bowl pulverizers.</small>
              </div>

              <div className="pcf-item">
                <span className="pcf-label">Stockyard Capacity</span>
                <strong>200,000 Tonnes Buffer</strong>
                <small>Provides 15–20 days of fuel security against mining or monsoon disruptions.</small>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Water, Steam & Chimneys */}
        {activeSubTab === 'water' && (
          <div className="psm-content-body">
            <div className="psm-grid-row">
              <div className="psm-spec-card">
                <span className="psc-label">WATER SOURCE</span>
                <h4>Samal Barrage (Brahmani River)</h4>
                <p>
                  Makeup and condenser water is pumped from the <strong>Samal Barrage on the Brahmani River</strong>, roughly 35 km away, via cross-country twin pipelines into an 11-million m³ reservoir.
                </p>
              </div>

              <div className="psm-spec-card">
                <span className="psc-label">TWIN CHIMNEYS</span>
                <h4>275 Meters High (902 Feet)</h4>
                <p>
                  Reinforced multi-flue concrete stacks engineered to disperse warm flue gas high above atmospheric inversion layers to ensure clean ground-level ambient air quality.
                </p>
              </div>

              <div className="psm-spec-card">
                <span className="psc-label">POLLUTION CONTROL</span>
                <h4>99.85% Fly Ash Capture</h4>
                <p>
                  Advanced Electrostatic Precipitators (ESPs) capture particulate matter before it reaches the chimneys. Fly ash is used in cement, brick manufacturing, and road embankments.
                </p>
              </div>

              <div className="psm-spec-card">
                <span className="psc-label">COOLING TOWERS</span>
                <h4>6 Natural Draught Towers (NDCT)</h4>
                <p>
                  Six ~140-meter-tall hyperbola cooling towers that cool condenser circulating water using natural chimney-effect airflow without electric fans.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Viva & Presentation Q&A */}
        {activeSubTab === 'viva' && (
          <div className="psm-content-body">
            <div className="viva-qa-list">
              {(specs?.viva_quick_guide || [
                { question: "Where does coal come from?", answer: "MCL Lingaraj & Kaniha mines in Talcher coalfield via dedicated MGR trains." },
                { question: "How fast does the track hopper unload coal?", answer: "The 210-meter track hopper unloads 58 bottom-discharge BOBR wagons in 25-35 minutes." },
                { question: "Where does the cooling water come from?", answer: "Samal Barrage on the Brahmani River via twin 35 km pipelines." },
                { question: "How is power transmitted to southern states?", answer: "Via the 1,450 km Talcher-Kolar ±500 kV HVDC bi-pole transmission line." },
                { question: "What is the stack height?", answer: "Twin 275-meter (902 ft) multi-flue chimneys to disperse emissions above atmospheric inversion layers." },
                { question: "How much electricity does each generator produce?", answer: "Each unit has a rated capacity of 500 MW (500,000 kW), giving 3,000 MW (3,000,000 kW) across all 6 units." }
              ]).map((qa, idx) => (
                <div key={idx} className="viva-qa-card">
                  <div className="viva-q-row">
                    <span className="q-badge">Q{idx + 1}</span>
                    <strong>{qa.question}</strong>
                  </div>
                  <div className="viva-a-row">
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                    <span>{qa.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="psm-footer">
          <div className="psm-footer-left">
            <span className="pulse-green-dot" />
            <span>NTPC Kaniha Technical Factsheet · Live Prototype Reference</span>
          </div>
          <button
            className="psm-done-btn"
            onClick={() => { playClickSound(); onClose(); }}
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
}
