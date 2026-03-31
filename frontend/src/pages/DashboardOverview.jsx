import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Sparkles, AlertTriangle, CheckCircle2, Info, ShieldCheck } from 'lucide-react';

// ─── Colors ───────────────────────────────────────────────────────────────────
const CHANNEL_COLORS = { web: '#3b82f6', mobile: '#10b981', api: '#f59e0b' };
const PIE_COLORS     = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

// ─── Reusable Insight Row ─────────────────────────────────────────────────────
function InsightRow({ insight }) {
  const borderColor = {
    danger:  'var(--danger,  #ef4444)',
    warning: 'var(--warning, #f59e0b)',
    success: 'var(--success, #10b981)',
    info:    'var(--accent-primary, #3b82f6)',
  }[insight.type] || 'var(--accent-primary)';

  return (
    <div style={{
      padding: '1rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'flex-start', gap: '1rem',
      borderLeft: `4px solid ${borderColor}`
    }}>
      {insight.type === 'danger'  && <AlertTriangle  className="text-red-500 w-5 h-5 flex-shrink-0" />}
      {insight.type === 'warning' && <AlertTriangle  className="text-yellow-500 w-5 h-5 flex-shrink-0" />}
      {insight.type === 'success' && <CheckCircle2   className="text-green-500 w-5 h-5 flex-shrink-0" />}
      {insight.type === 'info'    && <Info           className="text-blue-500 w-5 h-5 flex-shrink-0" />}
      <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.4' }}>
        {insight.message}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardOverview({ tenantId }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:3001/api/analytics', {
      headers: { 'x-tenant-id': tenantId }
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { console.error('Tenant access blocked:', d.error); return; }
        setData(d);
      })
      .catch(e => console.error('Error fetching analytics:', e))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (loading || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      Loading Enterprise Intelligence...
    </div>
  );

  const { kpis, featureAdoption, journeyFunnel, channelBreakdown, dailyTrend, licenseGap, predictiveInsights } = data;

  // Utilization color
  const utilizationColor = licenseGap?.utilizationPercent >= 70 ? '#10b981'
    : licenseGap?.utilizationPercent >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1 className="page-title">Enterprise Intelligence</h1>
        <p className="page-subtitle" data-feature="Dashboard:Navigation:OverviewSubtitle">
          Aggregated metrics for <strong>{tenantId.replace('TENANT_', '')}</strong> — calculated from raw telemetry events.
        </p>
      </div>

      {/* ── KPI Strip ────────────────────────────────────────────────────────── */}
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" data-feature="Dashboard:KPI:TotalEvents">
          <div className="kpi-label">Total Events Ingested</div>
          <div className="kpi-value">{kpis.totalEvents.toLocaleString()}</div>
        </div>
        <div className="glass-card" data-feature="Dashboard:KPI:ActiveUsers">
          <div className="kpi-label">Active Users Tracked</div>
          <div className="kpi-value">{kpis.activeUsers.toLocaleString()}</div>
        </div>
        <div className="glass-card" data-feature="Dashboard:KPI:AnonymizationRate">
          <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} className="text-green-400" /> Data Anonymized
          </div>
          <div className="kpi-value" style={{ color: '#10b981' }}>{kpis.anonymizedPercent}%</div>
        </div>
      </div>

      {/* ── License Gap Banner ───────────────────────────────────────────────── */}
      {licenseGap && (
        <div
          className="glass-card"
          data-feature="Dashboard:Component:LicenseGap"
          style={{ marginBottom: '2rem', borderColor: utilizationColor + '55', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}
        >
          {/* Ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ flexShrink: 0 }}>
            <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" />
            <circle
              cx="40" cy="40" r="30" fill="none"
              stroke={utilizationColor}
              strokeWidth="9"
              strokeDasharray={`${(licenseGap.utilizationPercent / 100) * 188.5} 188.5`}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
            />
            <text x="40" y="45" textAnchor="middle" fill="white" fontSize="15" fontWeight="bold">
              {licenseGap.utilizationPercent}%
            </text>
          </svg>

          {/* Text */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>
              License Utilization
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <strong style={{ color: '#10b981' }}>{licenseGap.totalUsed}</strong> of{' '}
              <strong>{licenseGap.totalLicensed}</strong> licensed features are actively used.{' '}
              <strong style={{ color: '#ef4444' }}>{licenseGap.unusedCount}</strong> features are paid for but never touched.
            </div>
            {licenseGap.unusedFeatures?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {licenseGap.unusedFeatures.map(f => (
                  <span key={f} style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#ef4444', borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 600
                  }}>{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Predictive Insights ───────────────────────────────────────────────── */}
      {predictiveInsights?.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '2rem', borderColor: 'var(--accent-secondary)' }} data-feature="Dashboard:Component:StrategicInsights">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Sparkles className="text-purple-400" />
            <h2 className="card-title" style={{
              margin: 0,
              background: 'linear-gradient(90deg, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              Strategic Intelligence Engine
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {predictiveInsights.map((insight, idx) => <InsightRow key={idx} insight={insight} />)}
          </div>
        </div>
      )}

      {/* ── Row 1: Feature Adoption + Journey Funnel ─────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Feature Adoption — Cloud vs On-Prem */}
        <div className="glass-card" data-feature="Dashboard:Component:Heatmap">
          <h2 className="card-title">Feature Adoption — Cloud vs On-Prem</h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureAdoption} margin={{ bottom: 40 }}>
                <XAxis dataKey="feature" stroke="var(--text-muted)" fontSize={10} angle={-30} textAnchor="end" interval={0} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" />
                <Bar dataKey="cloud"  name="Cloud"    fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onPrem" name="On-Prem"  fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Journey Funnel */}
        <div className="glass-card" data-feature="Dashboard:Component:JourneyFunnel">
          <h2 className="card-title">Loan Journey Funnel Drop-off</h2>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={journeyFunnel}>
                <XAxis dataKey="step" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="users" name="Users" stroke="#10b981" fill="rgba(16,185,129,0.15)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Daily Trend + Channel Breakdown ────────────────────────────── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Daily Trend line chart */}
        <div className="glass-card" data-feature="Dashboard:Component:DailyTrend">
          <h2 className="card-title">Daily Event Trend (Last 14 Days)</h2>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrend} margin={{ right: 10 }}>
                <XAxis
                  dataKey="date"
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickFormatter={d => d.slice(5)} // show MM-DD only
                />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="events" name="Events" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown pie */}
        <div className="glass-card" data-feature="Dashboard:Component:ChannelBreakdown">
          <h2 className="card-title">Events by Channel</h2>
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelBreakdown}
                  dataKey="count"
                  nameKey="channel"
                  cx="40%"
                  cy="50%"
                  outerRadius={90}
                  label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {channelBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={CHANNEL_COLORS[entry.channel] || PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend pills */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {channelBreakdown.map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <span style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: CHANNEL_COLORS[entry.channel] || PIE_COLORS[idx % PIE_COLORS.length],
                  display: 'inline-block'
                }} />
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{entry.channel}</span>
                <strong>{entry.count}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}