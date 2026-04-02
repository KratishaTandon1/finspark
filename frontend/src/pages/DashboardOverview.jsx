import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Sparkles, AlertTriangle, CheckCircle2, Info, ShieldCheck, Target, Activity } from 'lucide-react';

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    // Making sure the fetch includes strict DB segregation identifier
    fetch(`${API_BASE_URL}/api/dashboard-data`, {
       headers: {
           'x-tenant-id': tenantId
       }
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

  const { kpis, featureAdoption, journeyFunnel, channelBreakdown, dailyTrend, licenseGap, segmentation, heatmapMatrix } = data;

  // Utilization color
  const utilizationColor = licenseGap?.utilizationPercent >= 70 ? '#10b981'
    : licenseGap?.utilizationPercent >= 40 ? '#f59e0b' : '#ef4444';

  const maxHeat = heatmapMatrix ? Math.max(...heatmapMatrix.flatMap(h => [h.web, h.mobile, h.api])) : 1;
  const getHeatColor = (val) => {
    if (!val) return 'rgba(255,255,255,0.02)';
    const intensity = Math.min(val / maxHeat, 1);
    // Fire color mapping for heat: from dark transparent red to bright orange/yellow
    return `hsla(${40 - (intensity * 40)}, 90%, ${40 + intensity * 20}%, ${0.2 + intensity * 0.8})`;
  };

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
              <strong>{licenseGap.totalLicensed}</strong> licensed features are heavily adopted.{' '}
              <strong style={{ color: '#ef4444' }}>{licenseGap.unusedCount}</strong> features are severely under-utilized (Low ROI).
            </div>
            {licenseGap.wastedSpend > 0 && (
              <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={14} /> Total Wasted Spend: ${licenseGap.wastedSpend.toLocaleString()} / year
              </div>
            )}
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

      {/* License Utilization Context */}
      {data.kpis.licensedSeats && (
        <div className="glass-card" style={{ marginBottom: '2rem' }} data-feature="Dashboard:KPI:LicenseUtilization">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
            <div>
              <h2 className="card-title" style={{ margin: 0 }}>License Utilization ROI</h2>
              <p className="text-muted" style={{ fontSize: '0.875rem' }}>Active Users vs Procured Enterprise Seats</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                  {Math.round((data.kpis.activeUsers / data.kpis.licensedSeats) * 100)}%
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
             <div style={{ width: `${Math.round((data.kpis.activeUsers / data.kpis.licensedSeats) * 100)}%`, height: '100%', background: 'var(--success)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
             <span>{data.kpis.activeUsers.toLocaleString()} Active</span>
             <span>{data.kpis.licensedSeats.toLocaleString()} Purchased</span>
          </div>
        </div>
      )}

      {/* Predictive Strategic Intelligence UI Section */}
      {(() => {
         const threshold = 100000;
         const usageCount = data.kpis ? data.kpis.totalEvents : 0;
         const dynamicInsights = [];
         
         if (usageCount > 0 && usageCount < threshold) {
             dynamicInsights.push({
                 type: 'danger',
                 message: `High Risk of Non-Renewal: Engagement is severely low (${usageCount.toLocaleString()} events). Immediate CSM intervention required.`
             });
         }
         
         const allInsights = [...(data.predictiveInsights || []), ...dynamicInsights];
         if (allInsights.length === 0) return null;

         return (
          <div className="glass-card" style={{ marginBottom: '2rem', borderColor: 'var(--accent-secondary)' }} data-feature="Dashboard:Component:StrategicInsights">
             <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                <Sparkles className="text-purple-400" />
                <h2 className="card-title" style={{ margin: 0, background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Strategic Intelligence Engine
                </h2>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allInsights.map((insight, idx) => <InsightRow key={idx} insight={insight} />)}
             </div>
          </div>
         );
      })()}

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

      {/* ── Row 3: Hackathon Intelligence (Heatmap + Segmentation) ────────────── */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Advanced Heatmap */}
        <div className="glass-card" data-feature="Dashboard:Component:AdvancedHeatmap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Activity className="text-orange-500 w-5 h-5" />
            <h2 className="card-title" style={{ margin: 0 }}>Feature Channel Heatmap</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowX: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 1fr', gap: '4px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
               <div style={{ textAlign: 'left' }}>Feature Module</div>
               <div>Web</div>
               <div>Mobile</div>
               <div>API</div>
            </div>
            
            {/* Rows */}
            {heatmapMatrix && heatmapMatrix.map((row, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr 1fr', gap: '4px' }}>
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                   {row.feature}
                 </div>
                 <div style={{ background: getHeatColor(row.web), height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>{row.web > 0 ? row.web : ''}</div>
                 <div style={{ background: getHeatColor(row.mobile), height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>{row.mobile > 0 ? row.mobile : ''}</div>
                 <div style={{ background: getHeatColor(row.api), height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>{row.api > 0 ? row.api : ''}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Segmentation Radar */}
        <div className="glass-card" data-feature="Dashboard:Component:CustomerSegmentation">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Target className="text-blue-400 w-5 h-5" />
            <h2 className="card-title" style={{ margin: 0 }}>Customer Personas Segmentation</h2>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={segmentation}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="segment" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar name="Adoption Volume" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}