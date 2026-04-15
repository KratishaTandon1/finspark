import React, { useState, useEffect } from 'react';
import { Key, Lock, Copy, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { telemetry } from '../sdk/finspark-telemetry';

export default function SystemSettings({ tenantId }) {
  // Password State
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [passStatus, setPassStatus] = useState(null);

  // API Key State
  const [apiKey, setApiKey] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    // Simulate loading existing API Key from Auth State
    const stored = localStorage.getItem('finspark_api_key');
    if (stored) {
      setApiKey(stored);
    } else {
      const generated = 'fs_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(generated);
      localStorage.setItem('finspark_api_key', generated);
    }
  }, []);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      setPassStatus({ type: 'error', msg: 'New passwords do not match' });
      return;
    }
    if (passData.new.length < 8) {
      setPassStatus({ type: 'error', msg: 'Password must be at least 8 characters' });
      return;
    }
    
    // Simulate API call
    setPassStatus({ type: 'loading', msg: 'Updating credentials...' });
    telemetry.track("Governance:Action:PasswordChange", { status: "initiated" });

    setTimeout(() => {
      setPassStatus({ type: 'success', msg: 'Password successfully updated' });
      setPassData({ old: '', new: '', confirm: '' });
      telemetry.track("Governance:Action:PasswordChange", { status: "success" });
      setTimeout(() => setPassStatus(null), 3000);
    }, 1200);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    telemetry.track("Governance:Action:APIKeyCopy", { tenantId });
    setTimeout(() => setCopied(false), 2000);
  };

  const rotateApiKey = () => {
    const confirm = window.confirm("WARNING: Rotating your API key will immediately invalidate the current key. Any active integrations using the old key will fail. Continue?");
    if (!confirm) return;

    setIsRotating(true);
    telemetry.track("Governance:Action:APIKeyRotate", { status: "initiated", tenantId });
    
    // Simulate API delay
    setTimeout(() => {
      const newKey = 'fs_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(newKey);
      localStorage.setItem('finspark_api_key', newKey);
      setIsRotating(false);
      telemetry.track("Governance:Action:APIKeyRotate", { status: "success", tenantId });
    }, 1500);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>System Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal credentials, workspace security, and developer API keys.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Password Workflow */}
        <section style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
              <Lock style={{ color: '#3b82f6', width: '20px', height: '20px' }} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>Change Password</h2>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Current Password</label>
              <input 
                type="password" 
                value={passData.old} 
                onChange={e => setPassData({...passData, old: e.target.value})}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '6px' }}
                placeholder="Enter current password"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>New Password</label>
              <input 
                type="password" 
                value={passData.new} 
                onChange={e => setPassData({...passData, new: e.target.value})}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '6px' }}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>Confirm New Password</label>
              <input 
                type="password" 
                value={passData.confirm} 
                onChange={e => setPassData({...passData, confirm: e.target.value})}
                required
                style={{ width: '100%', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.75rem', borderRadius: '6px' }}
                placeholder="Re-type new password"
              />
            </div>

            {passStatus && (
              <div style={{ 
                marginBottom: '1rem', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem',
                background: passStatus.type === 'error' ? 'rgba(239,68,68,0.1)' : passStatus.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                color: passStatus.type === 'error' ? '#ef4444' : passStatus.type === 'success' ? '#10b981' : '#3b82f6',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                {passStatus.type === 'success' && <CheckCircle size={16} />}
                {passStatus.type === 'error' && <AlertTriangle size={16} />}
                {passStatus.msg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={passStatus?.type === 'loading'}
              style={{
                width: '100%', padding: '0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px',
                fontWeight: 600, cursor: passStatus?.type === 'loading' ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
                opacity: passStatus?.type === 'loading' ? 0.7 : 1
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}
            >
              {passStatus?.type === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Developer API Setup */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.5rem', borderRadius: '8px' }}>
                <Key style={{ color: '#8b5cf6', width: '20px', height: '20px' }} />
              </div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>Developer API Key</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Use this key to authenticate your backend servers or external applications with the FinSpark API. Keep it secure and do not expose it in client-side code.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <code style={{ color: '#a78bfa', fontFamily: 'monospace', letterSpacing: '1px', filter: isRotating ? 'blur(4px)' : 'none', transition: 'filter 0.3s' }}>
                {apiKey}
              </code>
              <button 
                onClick={copyToClipboard}
                title="Copy to clipboard"
                style={{ background: 'transparent', border: 'none', color: copied ? '#10b981' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'color 0.2s' }}
              >
                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
              </button>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> Danger Zone
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                If your API key has been compromised, you should rotate it immediately. This action cannot be undone.
              </p>
              <button 
                onClick={rotateApiKey}
                disabled={isRotating}
                style={{
                  padding: '0.6rem 1rem', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', 
                  borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem', cursor: isRotating ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ef4444'; }}
              >
                <RefreshCw size={14} className={isRotating ? 'animate-spin' : ''} />
                {isRotating ? 'Rotating Key...' : 'Rotate API Key'}
              </button>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
