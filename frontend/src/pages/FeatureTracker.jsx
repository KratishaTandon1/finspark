import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Flame, Snowflake, Thermometer, XCircle, TrendingUp } from 'lucide-react';

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  hot:    { label: 'Hot',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: Flame,       barColor: '#ef4444' },
  warm:   { label: 'Warm',   color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: Thermometer, barColor: '#f59e0b' },
  cold:   { label: 'Cold',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', icon: Snowflake,   barColor: '#3b82f6' },
  unused: { label: 'Unused', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: XCircle,     barColor: '#6b7280' },
};

// ─── Small stat pill ──────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <span style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '999px',
      padding: '2px 10px',
      fontSize: '0.75rem',
      color: color || 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }}>
      {label}: <strong style={{ color: 'var(--text-main)' }}>{value}</strong>
    </span>
  );
}

// ─── Single feature card ──────────────────────────────────────────────────────
function FeatureCard({ feature }) {
  const cfg = STATUS_CONFIG[feature.status] || STATUS_CONFIG.unused;
  const Icon = cfg.icon;

  const channelEntries = Object.entries(feature.channels || {});
  const deployEntries  = Object.entries(feature.deployments || {});

  return (
    <div
      data-feature={`FeatureTracker:Card:${feature.featureId}`}
      style={{
        background: 'var(--glass-bg, rgba(255,255,255,0.04))',
        border: `1px solid ${cfg.color}44`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
          {feature.featureId.replace(/([A-Z])/g, ' $1').trim()}
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          background: cfg.bg, color: cfg.color,
          border: `1px solid ${cfg.color}55`,
          borderRadius: '999px', padding: '2px 10px', fontSize: '0.75rem', fontWeight: 600
        }}>
          <Icon size={12} /> {cfg.label}
        </span>
      </div>

      {/* Main metrics */}
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
            {feature.totalEvents.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Events</div>
        </div>
        <div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
            {feature.uniqueUsers}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Unique Users</div>
        </div>
      </div>

      {/* Channel + Deployment pills */}
      {(channelEntries.length > 0 || deployEntries.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {channelEntries.map(([ch, count]) => (
            <StatPill key={ch} label={ch} value={count} />
          ))}
          {deployEntries.map(([dep, count]) => (
            <StatPill key={dep} label={dep} value={count} color='#a78bfa' />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FeatureTracker({ tenantId }) {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filter, setFilter]     = useState('all'); // all | hot | warm | cold | unused

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3001/api/features', {
      headers: { 'x-tenant-id': tenantId }
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setFeatures(d.features || []);
      })
      .catch(() => setError('Could not reach backend. Is the server running?'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  // ── Derived data ────────────────────────────────────────────────────────────
  const counts = features.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === 'all' ? features : features.filter(f => f.status === filter);

  // Bar chart data — top 8 by events
  const chartData = [...features]
    .filter(f => f.totalEvents > 0)
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, 8)
    .map(f => ({ name: f.featureId.replace(/([A-Z])/g, ' $1').trim(), events: f.totalEvents, status: f.status }));

  // License utilization %
  const usedCount   = features.filter(f => f.status !== 'unused').length;
  const utilization = features.length ? Math.round((usedCount / features.length) * 100) : 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      Loading Feature Intelligence...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ color: '#ef4444' }}>Error</h1>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div data-feature="FeatureTracker:Page:Root">
      {/* Page header */}
      <div className="page-header">
        <h1 className="page-title">Feature Tracker</h1>
        <p className="page-subtitle">
          License utilization and adoption intelligence for <strong>{tenantId.replace('TENANT_', '')}</strong>.
        </p>
      </div>

      {/* ── Summary KPI strip ─────────────────────────────────────────────── */}
      <div className="grid-3" style={{ marginBottom: '2rem', gap: '1rem' }}>
        {/* Utilization ring */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} data-feature="FeatureTracker:KPI:Utilization">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="36" cy="36" r="28" fill="none"
              stroke={utilization >= 70 ? '#10b981' : utilization >= 40 ? '#f59e0b' : '#ef4444'}
              strokeWidth="8"
              strokeDasharray={`${(utilization / 100) * 175.9} 175.9`}
              strokeLinecap="round"
              transform="rotate(-90 36 36)"
            />
            <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{utilization}%</text>
          </svg>
          <div>
            <div className="kpi-label">License Utilization</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{usedCount} of {features.length} features used</div>
          </div>
        </div>

        {/* Status breakdown */}
        {['hot', 'warm', 'cold', 'unused'].map(status => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          return (
            <div
              key={status}
              className="glass-card"
              data-feature={`FeatureTracker:KPI:${status}`}
              style={{ cursor: 'pointer', borderColor: filter === status ? cfg.color : undefined, transition: 'border-color 0.2s' }}
              onClick={() => setFilter(filter === status ? 'all' : status)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="kpi-label" style={{ textTransform: 'capitalize' }}>{cfg.label} Features</span>
                <Icon size={16} style={{ color: cfg.color }} />
              </div>
              <div className="kpi-value" style={{ color: cfg.color }}>{counts[status] || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to filter</div>
            </div>
          );
        })}
      </div>

      {/* ── Bar chart: top features ───────────────────────────────────────── */}
      <div className="glass-card" style={{ marginBottom: '2rem' }} data-feature="FeatureTracker:Chart:TopFeatures">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <TrendingUp size={18} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          <h2 className="card-title" style={{ margin: 0 }}>Top Features by Event Volume</h2>
        </div>
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                fontSize={11}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ backgroundColor: 'var(--bg-secondary, #1e293b)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              />
              <Bar dataKey="events" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell key={idx} fill={STATUS_CONFIG[entry.status]?.barColor || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'hot', 'warm', 'cold', 'unused'].map(f => (
          <button
            key={f}
            data-feature={`FeatureTracker:Filter:${f}`}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              border: `1px solid ${filter === f ? (STATUS_CONFIG[f]?.color || 'var(--accent-primary)') : 'rgba(255,255,255,0.1)'}`,
              background: filter === f ? (STATUS_CONFIG[f]?.bg || 'rgba(59,130,246,0.15)') : 'transparent',
              color: filter === f ? (STATUS_CONFIG[f]?.color || 'var(--accent-primary)') : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'capitalize',
              transition: 'all 0.15s'
            }}
          >
            {f === 'all' ? `All (${features.length})` : `${f} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* ── Feature cards grid ───────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No features match this filter.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {filtered.map(f => <FeatureCard key={f.featureId} feature={f} />)}
        </div>
      )}
    </div>
  );
}   
