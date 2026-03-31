import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import { Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function DashboardOverview({ tenantId }) {
  const [data, setData] = useState({
    kpis: { totalEvents: 0, activeUsers: 0, anonymizedPercent: 0 },
    featureAdoption: [],
    journeyFunnel: [],
    predictiveInsights: []
  });

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    // Making sure the fetch includes strict DB segregation identifier
    fetch(`${API_BASE_URL}/api/dashboard-data`, {
       headers: {
           'x-tenant-id': tenantId
       }
    })
      .then(r => r.json())
      .then(d => {
         if (d.error) {
             console.error("Multi-tenant architecture blocked access.");
             return;
         }
         setData(d);
      })
      .catch(e => console.error("Error fetching analytics", e));
  }, [tenantId]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Enterprise Intelligence</h1>
        <p className="page-subtitle" data-feature="Dashboard:Navigation:OverviewSubtitle">Aggregated metrics showcasing feature adoption and predictive models for <strong>{tenantId.replace('TENANT_', '')}</strong>.</p>
      </div>

      <div className="grid-3">
        <div className="glass-card" data-feature="Dashboard:KPI:TotalEvents">
          <div className="kpi-label">Total Events Ingested</div>
          <div className="kpi-value">{data.kpis.totalEvents.toLocaleString()}</div>
        </div>
        <div className="glass-card" data-feature="Dashboard:KPI:ActiveUsers">
          <div className="kpi-label">Active Users Tracked</div>
          <div className="kpi-value">{data.kpis.activeUsers.toLocaleString()}</div>
        </div>
        <div className="glass-card" data-feature="Dashboard:KPI:AnonymizationRate">
          <div className="kpi-label">Data Anonymized</div>
          <div className="kpi-value text-green-400">{data.kpis.anonymizedPercent}%</div>
        </div>
      </div>

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
         // Dynamic Predictive Logic (Feature trigger based on usage count)
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
          <div className="glass-card page-header" style={{ borderColor: 'var(--accent-secondary)' }} data-feature="Dashboard:Component:StrategicInsights">
             <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                <Sparkles className="text-purple-400" />
                <h2 className="card-title" style={{ margin: 0, background: 'linear-gradient(90deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Strategic Intelligence Engine</h2>
             </div>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allInsights.map((insight, idx) => (
                    <div key={idx} style={{ 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        borderLeft: `4px solid ${insight.type === 'danger' ? 'var(--danger)' : insight.type === 'success' ? 'var(--success)' : insight.type === 'warning' ? 'var(--warning)' : 'var(--accent-primary)'}` 
                    }}>
                        {insight.type === 'danger' && <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0" />}
                        {insight.type === 'warning' && <AlertTriangle className="text-yellow-500 w-5 h-5 flex-shrink-0" />}
                        {insight.type === 'success' && <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />}
                        {insight.type === 'info' && <Info className="text-blue-500 w-5 h-5 flex-shrink-0" />}
                        
                        <div style={{ color: "var(--text-main)", fontSize: "0.95rem", lineHeight: "1.4" }}>
                            {insight.message}
                        </div>
                    </div>
                ))}
             </div>
          </div>
         );
      })()}

      <div className="grid-2">
        <div className="glass-card" data-feature="Dashboard:Component:Heatmap">
          <h2 className="card-title">Feature Adoption Heatmap (Cloud vs On-Prem)</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.featureAdoption}>
                <XAxis dataKey="feature" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Legend />
                <Bar dataKey="cloud" name="Cloud MUs" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="onPrem" name="On-Prem MUs" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card" data-feature="Dashboard:Component:JourneyFunnel">
          <h2 className="card-title">Journey Funnel Drop-off</h2>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.journeyFunnel}>
                <XAxis dataKey="step" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="users" stroke="var(--success)" fill="rgba(16, 185, 129, 0.2)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
