import React, { useEffect, useState } from 'react';
import { Target, TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';

export default function FeatureTracker({ tenantId }) {
  const [data, setData] = useState({
    metrics: { totalMonitoredFeatures: 0, averageEngagement: 0 },
    features: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    
    fetch(`${API_BASE_URL}/api/feature-tracker`, {
      headers: { 'x-tenant-id': tenantId }
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setError("Multi-tenant architecture blocked access.");
          return;
        }
        setData(d);
        setError(null);
      })
      .catch(e => {
        console.error("Error fetching feature tracking analytics", e);
        setError("Failed to load feature tracking data. Please ensure the backend is running.");
      });
  }, [tenantId]);

  if (error) {
    return (
      <div className="page-header">
        <h1 className="page-title text-red-500">Access Denied</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Feature Tracker</h1>
        <p className="page-subtitle" data-feature="FeatureTracker:Navigation:OverviewSubtitle">
          Deep granular engagement and ROI analytics mapped specifically to <strong>{tenantId.replace('TENANT_', '').replace(/_/g, ' ')}</strong>.
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} data-feature="FeatureTracker:KPI:TotalFeatures">
          <div style={{ background: 'var(--accent-primary)', padding: '1rem', borderRadius: '12px', color: '#000' }}>
            <Target className="w-8 h-8" />
          </div>
          <div>
            <div className="kpi-label" style={{ marginBottom: '0.25rem' }}>Features Monitored</div>
            <div className="kpi-value">{data.metrics.totalMonitoredFeatures}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }} data-feature="FeatureTracker:KPI:AverageEngagement">
          <div style={{ background: 'var(--accent-secondary)', padding: '1rem', borderRadius: '12px', color: '#000' }}>
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <div className="kpi-label" style={{ marginBottom: '0.25rem' }}>Average Engagement / Feature</div>
            <div className="kpi-value">{data.metrics.averageEngagement}</div>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }} data-feature="FeatureTracker:Component:AdoptionTable">
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
           <BarChart3 className="w-5 h-5 text-emerald-400" />
           <h2 className="card-title" style={{ margin: 0 }}>Omnichannel Feature Adoption</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
              <tr>
                <th style={{ width: '25%' }}>Feature Name</th>
                <th style={{ width: '15%' }}>Total Events</th>
                <th style={{ width: '15%' }}>Unique Users</th>
                <th style={{ width: '30%' }}>Channel Distribution (Web / Mob / API)</th>
                <th style={{ width: '15%' }}>ROI Status</th>
              </tr>
            </thead>
            <tbody>
              {data.features.map((feature, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{feature.featureId}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                    {feature.totalEngagement.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Users className="w-4 h-4" />
                      {feature.uniqueUsers.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    {/* Visual Segmented Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex', marginBottom: '0.5rem' }}>
                       {feature.distribution.web > 0 && <div style={{ width: `${feature.distribution.web}%`, height: '100%', background: 'var(--accent-primary)' }} title={`Web: ${feature.distribution.web}%`}></div>}
                       {feature.distribution.mobile > 0 && <div style={{ width: `${feature.distribution.mobile}%`, height: '100%', background: 'var(--accent-secondary)' }} title={`Mobile: ${feature.distribution.mobile}%`}></div>}
                       {feature.distribution.api > 0 && <div style={{ width: `${feature.distribution.api}%`, height: '100%', background: 'var(--success)' }} title={`API: ${feature.distribution.api}%`}></div>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                       {feature.distribution.web > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{width: 8, height: 8, background: 'var(--accent-primary)', borderRadius: '50%'}}></span>{feature.distribution.web}% Web</span>}
                       {feature.distribution.mobile > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{width: 8, height: 8, background: 'var(--accent-secondary)', borderRadius: '50%'}}></span>{feature.distribution.mobile}% Mob</span>}
                       {feature.distribution.api > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{width: 8, height: 8, background: 'var(--success)', borderRadius: '50%'}}></span>{feature.distribution.api}% API</span>}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${feature.statusClass}`}>
                      {feature.roiStatus === 'High ROI' && <TrendingUp className="w-3 h-3 inline mr-1" />}
                      {feature.roiStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {data.features.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No feature adoption data recorded for this tenant yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
