import React, { useState, useEffect } from 'react';
import { Database, Eye, EyeOff, Shield, Building2, ChevronRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [availableTenants, setAvailableTenants] = useState([]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/tenants`);
        const data = await res.json();
        if (data && Array.isArray(data)) {
          setAvailableTenants(data);
        }
      } catch (e) {
        console.error("Failed to retrieve logical tenants");
      }
    };
    fetchTenants();
  }, []);

  // Dynamically build MOCK_USERS and DEMO_ACCOUNTS based on available backend tenants
  const MOCK_USERS = [
    {
      id: 'admin_usr_001',
      email: 'superadmin@finspark.io',
      password: 'admin123',
      role: 'Super_Admin',
      displayName: 'Arjun Mehta',
      tenantId: null,
      tenantOptions: availableTenants.length > 0 ? availableTenants : ['TENANT_HDFC'],
      badge: 'Platform Admin',
      badgeColor: '#8b5cf6'
    }
  ];

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#06b6d4'];
  const tList = availableTenants.length > 0 ? availableTenants : ['TENANT_HDFC', 'TENANT_ICICI'];
  
  tList.forEach((tenant, idx) => {
    const name = tenant.replace('TENANT_', '').toLowerCase();
    MOCK_USERS.push({
      id: `${name}_tenant_001`,
      email: `admin@${name}.com`,
      password: `${name}123`,
      role: 'Tenant_Admin',
      displayName: `${name.toUpperCase()} Admin`,
      tenantId: tenant,
      tenantOptions: [tenant],
      badge: `${name.toUpperCase()} Enterprise`,
      badgeColor: colors[idx % colors.length]
    });
  });

  const DEMO_ACCOUNTS = MOCK_USERS.map(u => ({
    label: u.role === 'Super_Admin' ? 'Super Admin' : `${u.tenantOptions[0].replace('TENANT_', '')} Admin`,
    email: u.email,
    password: u.password,
    color: u.badgeColor,
    desc: u.role === 'Super_Admin' ? 'All tenants visible' : `${u.tenantOptions[0].replace('TENANT_', '')} restricted scope`
  }));

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate a small network delay for realism
    setTimeout(() => {
      const user = MOCK_USERS.find(
        u => u.email === email.trim().toLowerCase() && u.password === password
      );

      if (!user) {
        setError('Invalid email or password.');
        setLoading(false);
        return;
      }

      // Pass user object up to App.jsx
      onLogin(user);
      setLoading(false);
    }, 600);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary, #0f172a)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'inherit',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background grid decoration */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      {/* Glow blobs */}
      <div style={{ position:'absolute', top:'10%', left:'15%', width:'400px', height:'400px', borderRadius:'50%', background:'rgba(59,130,246,0.06)', filter:'blur(80px)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'10%', right:'10%', width:'350px', height:'350px', borderRadius:'50%', background:'rgba(139,92,246,0.06)', filter:'blur(80px)', pointerEvents:'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            marginBottom: '1rem', boxShadow: '0 8px 32px rgba(59,130,246,0.3)'
          }}>
            <Database size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main, white)', margin: 0, letterSpacing: '-0.02em' }}>
            FinSpark
          </h1>
          <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Feature Intelligence Platform
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '16px',
          padding: '2rem',
          backdropFilter: 'blur(12px)',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main, white)', margin: '0 0 1.5rem 0' }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@company.com"
                required
                style={{
                  width: '100%', padding: '0.7rem 1rem', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  color: 'var(--text-main, white)', fontSize: '0.9rem',
                  outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#3b82f6'}
                onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted, #94a3b8)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '0.7rem 2.8rem 0.7rem 1rem', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${error ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    color: 'var(--text-main, white)', fontSize: '0.9rem',
                    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#3b82f6'}
                  onBlur={e => e.target.style.borderColor = error ? '#ef4444' : 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #94a3b8)', padding: '4px' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '0.6rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem', borderRadius: '8px',
                background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                border: 'none', color: 'white', fontSize: '0.9rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.15s', boxShadow: '0 4px 16px rgba(59,130,246,0.3)'
              }}
            >
              {loading ? 'Signing in...' : (
                <> Sign In <ChevronRight size={16} /> </>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px', padding: '1.25rem'
        }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Demo Accounts — click to fill
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc)}
                style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${acc.color}33`,
                  borderRadius: '8px', padding: '0.6rem 0.875rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer', transition: 'background 0.15s',
                  color: 'var(--text-main, white)'
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${acc.color}11`}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: acc.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{acc.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)' }}>{acc.desc}</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-muted, #94a3b8)' }} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}