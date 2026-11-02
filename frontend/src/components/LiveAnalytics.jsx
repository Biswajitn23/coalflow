import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  Activity, Clock, Calendar, Download, RefreshCw, Filter,
  Waves, Thermometer, Boxes, Factory, Gauge
} from 'lucide-react';
import { playClickSound } from '../utils/audio';

function formatChartTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function LiveAnalytics({ apiBase, latestHistory }) {
  const [timeRange, setTimeRange] = useState('1h');
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMetric, setActiveMetric] = useState('coal_flow');

  // Fetch range data from backend
  const fetchAnalytics = async (range) => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setAnalyticsData(json.data || []);
      }
    } catch (e) {
      // Fallback to latestHistory if offline
      setAnalyticsData(latestHistory || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(timeRange);
    const interval = setInterval(() => {
      fetchAnalytics(timeRange);
    }, 6000);
    return () => clearInterval(interval);
  }, [timeRange, apiBase]);

  // Formatted chart items
  const chartItems = useMemo(() => {
    const src = analyticsData.length > 0 ? analyticsData : (latestHistory || []);
    return src.map((item) => ({
      ...item,
      timeLabel: formatChartTime(item.recorded_at),
    }));
  }, [analyticsData, latestHistory]);

  const metricsConfig = {
    coal_flow: {
      label: 'Coal Flow Rate',
      unit: 't/h',
      color: '#f59e0b',
      warnThreshold: 520,
      domain: [250, 650],
      icon: Waves,
    },
    belt_speed: {
      label: 'Conveyor Speed',
      unit: 'm/s',
      color: '#10b981',
      warnThreshold: 3.2,
      domain: [0, 4.0],
      icon: Activity,
    },
    motor_temp: {
      label: 'Drive Motor Temperature',
      unit: '°C',
      color: '#ef4444',
      warnThreshold: 82,
      domain: [40, 100],
      icon: Thermometer,
    },
    stock_level: {
      label: 'Stockyard Level',
      unit: '%',
      color: '#38bdf8',
      warnThreshold: 90,
      domain: [40, 100],
      icon: Boxes,
    },
    bunker_level: {
      label: 'Boiler Bunker Filling Level',
      unit: '%',
      color: '#8b5cf6',
      warnThreshold: 90,
      domain: [40, 100],
      icon: Factory,
    },
  };

  const currentCfg = metricsConfig[activeMetric] || metricsConfig.coal_flow;

  return (
    <div className="analytics-root">
      {/* Header with Range Selectors */}
      <div className="analytics-header">
        <div>
          <div className="analytics-badge">
            <Activity size={14} className="text-emerald-400" />
            <span>REAL-TIME SCADA TIME-SERIES</span>
          </div>
          <h2>Live Process Analytics &amp; Trend Explorer</h2>
          <p className="analytics-subtitle">
            Simulated high-frequency operational telemetry from plant sensors. Select time ranges and inspect historical excursions.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="range-selector-buttons">
          {[
            { id: '1h', label: 'Last 1 Hour' },
            { id: '6h', label: 'Last 6 Hours' },
            { id: '24h', label: 'Last 24 Hours' },
          ].map((r) => (
            <button
              key={r.id}
              className={`range-btn ${timeRange === r.id ? 'active' : ''}`}
              onClick={() => {
                playClickSound();
                setTimeRange(r.id);
              }}
            >
              <Clock size={13} />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Tabs */}
      <div className="metric-tabs-bar">
        {Object.entries(metricsConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isSelected = activeMetric === key;
          return (
            <button
              key={key}
              className={`metric-tab-pill ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                playClickSound();
                setActiveMetric(key);
              }}
            >
              <Icon size={15} style={{ color: cfg.color }} />
              <span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Focus Chart Panel */}
      <div className="analytics-main-panel">
        <div className="chart-panel-top">
          <div>
            <h3>{currentCfg.label} Trend</h3>
            <span className="chart-sub">
              Units: <strong>{currentCfg.unit}</strong> · Threshold limit: {currentCfg.warnThreshold} {currentCfg.unit}
            </span>
          </div>

          <div className="chart-live-stat">
            <span>Points: {chartItems.length}</span>
            <span className="live-pulse-dot" />
          </div>
        </div>

        <div className="chart-container-large">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartItems} margin={{ top: 20, right: 25, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentCfg.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={currentCfg.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                minTickGap={40}
              />
              <YAxis
                domain={currentCfg.domain}
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val} ${currentCfg.unit}`, currentCfg.label]}
              />
              <ReferenceLine
                y={currentCfg.warnThreshold}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{ value: `Warning: ${currentCfg.warnThreshold} ${currentCfg.unit}`, fill: '#f87171', fontSize: 11, position: 'top' }}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke={currentCfg.color}
                strokeWidth={2.5}
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Comparative Side-by-Side Mini Charts */}
      <div className="comparative-grid">
        {/* Secondary Chart 1: Vibration & Motor Current */}
        <div className="comparative-card">
          <div className="comp-card-header">
            <h4>Crusher Vibration &amp; Motor Current Correlation</h4>
            <span className="comp-tag">CR-01 Telemetry</span>
          </div>
          <div className="comp-chart-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartItems} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="crusher_vib" stroke="#06b6d4" strokeWidth={2} dot={false} name="Vibration (mm/s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart 2: Stockyard vs Bunker Fill Level */}
        <div className="comparative-card">
          <div className="comp-card-header">
            <h4>Stockyard vs Boiler Bunker Fill Levels</h4>
            <span className="comp-tag">Storage Buffer</span>
          </div>
          <div className="comp-chart-wrap">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartItems} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 10 }} minTickGap={30} />
                <YAxis domain={[40, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="stock_level" stroke="#eab308" strokeWidth={2} dot={false} name="Stockyard %" />
                <Line type="monotone" dataKey="bunker_level" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Bunkers %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
