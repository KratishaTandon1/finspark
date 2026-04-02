import React, { useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { telemetry } from '../sdk/finspark-telemetry';

export default function ComplianceHub({ tenantId }) {
  const [piiRules, setPiiRules] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  
  // Local state for UI toggles
  const [globalConsent, setGlobalConsent] = useState(true);
  const [healthMetrics, setHealthMetrics] = useState(telemetry.getHealthMetrics());

  useEffect(() => {
    // Poll SDK health metrics every second for visual UI updates
    const interval = setInterval(() => {
      setHealthMetrics(telemetry.getHealthMetrics());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // We must pass the DB Segregation header for the V2 backend
    const headers = { 'x-tenant-id': tenantId };

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
    Promise.all([
      fetch(`${API_BASE_URL}/api/compliance/consent`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/compliance/pii-rules`, { headers }).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/compliance/audit-logs`, { headers }).then(r => r.json())
    ]).then(([consentData, piiData, logsData]) => {
      if (consentData.error || piiData.error || logsData.error) {
         setError("Backend Multi-Tenancy Firewall rejected the request. Missing tenant context.");
         return;
      }
      setGlobalConsent(consentData.globalTelemetryEnabled);
      setPiiRules(piiData);
      setLogs(logsData.logs || []);
    }).catch(e => {
      console.error(e);
      setError("Failed to fetch compliance configuration.");
    });
  }, [tenantId]);

  const handleConsentToggle = (val) => {
    setGlobalConsent(val);
    telemetry.setConsent(val); 
  };

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
        <h1 className="page-title">Compliance Hub</h1>
        <p className="page-subtitle">Manage feature telemetry consent, PII masking rules, and review audit logs for <strong>{tenantId}</strong>.</p>
      </div>

      {/* On-Premise Navigation Sync (Manual Federated Sync) */}
      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity className="w-5 h-5 text-blue-400" />
          Manual Federated Sync (On-Premise Simulation)
        </h2>
        <p className="text-muted" style={{ marginBottom: "1rem" }}>
          In an air-gapped or on-premise installation, aggregated and anonymized telemetry batches are periodically pushed to your central cloud. You can force a manual sync.
        </p>
        <button 
          className="btn-primary" 
          style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600, background: 'var(--accent-primary)', color: 'black', border: 'none', cursor: 'pointer' }}
          onClick={() => {
            telemetry.flush();
            alert('Federated sync triggered! Anonymized logs pushing to central cloud.');
          }}
        >
          Force Sync to Cloud
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: "2rem" }}>
        {/* Telemetry Consent Toggle */}
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="card-title" style={{ margin: 0 }}>Global Telemetry Consent</h2>
            {globalConsent ? <ShieldCheck className="text-green-500" /> : <ShieldAlert className="text-red-500" />}
          </div>
          
          <p className="text-muted" style={{ marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            Enabling this allows the system to aggregate user interaction and platform telemetry. Disabling it instantly halts the Telemetry SDK from dispatching `POST` requests.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={globalConsent} 
                onChange={(e) => handleConsentToggle(e.target.checked)} 
              />
              <span className="slider"></span>
            </label>
            <span style={{ fontWeight: 600 }}>{globalConsent ? "Tracking Active" : "Tracking Disabled"}</span>
          </div>
        </div>

        {/* PII Masking Status Summary */}
        <div className="glass-card">
          <h2 className="card-title">Live PII Masking Strategy</h2>
          {piiRules && piiRules.rules ? (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className={`status-badge ${piiRules.active ? 'success' : 'danger'}`}>
                  {piiRules.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span className="status-badge warning">{piiRules.maskingStrategy}</span>
              </div>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                {piiRules.rules.map((rule, idx) => (
                  <li key={idx} style={{ marginBottom: '0.25rem' }}>
                    <strong>{rule.field}</strong> → {rule.action.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-muted">Loading rules...</p>
          )}
        </div>
      </div>

      {/* Telemetry SDK System Health Speedometer */}
      <div className="glass-card" style={{ marginBottom: "2rem", borderColor: "rgba(16, 185, 129, 0.4)" }}>
        <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity className="w-5 h-5 text-green-500" />
          Telemetry SDK Performance & Health
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
             <p className="text-muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
               The FinSpark SDK uses an intelligent batched circuit-breaker architecture to ensure your core Enterprise host application experiences <strong>zero performance degradation</strong>.
             </p>
             <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{healthMetrics.overheadMs}ms</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg Main-Thread Overhead</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{healthMetrics.reductionPercent}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Network Call Reduction</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>10s</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch Flush Interval</div>
                </div>
             </div>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             {/* Simulated Speedometer UI */}
             <svg width="120" height="70" viewBox="0 0 120 70">
                <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" strokeLinecap="round" />
                <path d="M 10 60 A 50 50 0 0 1 85 15" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />
                <text x="60" y="55" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">Active</text>
             </svg>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Activity className="w-5 h-5 text-blue-500" />
           <h2 className="card-title" style={{ margin: 0 }}>Telemetry Configuration Audit Logs</h2>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
              <tr>
                <th>Timestamp</th>
                <th>Actor ID</th>
                <th>Role</th>
                <th>Action</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.auditId}>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 500 }}>{log.actorId}</td>
                  <td><span className="status-badge" style={{ background: 'var(--glass-border)' }}>{log.actorRole}</span></td>
                  <td>{log.action.replace(/_/g, ' ')}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ipAddress}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No audit logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
