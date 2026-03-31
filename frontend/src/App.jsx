import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Shield, BarChart3, Settings, Database, Building, LogOut, User } from 'lucide-react';

import DashboardOverview from './pages/DashboardOverview';
import ComplianceHub     from './pages/ComplianceHub';
import FeatureTracker    from './pages/FeatureTracker';
import ComingSoon        from './pages/ComingSoon';
import Login             from './pages/Login';
import { telemetry }     from './sdk/finspark-telemetry';

function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  // currentUser is null = not logged in, otherwise holds the user object from Login.jsx
  const [currentUser, setCurrentUser] = useState(null);

  // Active tenant — for Super Admin this can be switched, for Tenant Admin it's locked
  const [activeTenant, setActiveTenant] = useState('TENANT_HDFC');

  // ── Login handler ────────────────────────────────────────────────────────────
  const handleLogin = (user) => {
    setCurrentUser(user);
    // Set the tenant to whatever this user is allowed to see first
    const firstTenant = user.tenantOptions[0];
    setActiveTenant(firstTenant);
    telemetry.setTenant(firstTenant);
  };

  // ── Logout handler ───────────────────────────────────────────────────────────
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTenant('TENANT_HDFC');
  };

  // ── Tenant switch (only Super Admin can do this freely) ──────────────────────
  const switchTenant = (e) => {
    const newTenantId = e.target.value;
    telemetry.setTenant(newTenantId);
    setActiveTenant(newTenantId);
  };

  // ── If not logged in, show Login page ────────────────────────────────────────
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  // ── Role badge colors ─────────────────────────────────────────────────────────
  const roleBadgeColor = currentUser.role === 'Super_Admin' ? '#8b5cf6' : '#10b981';

  return (
    <BrowserRouter>
      <div className="app-container">

        {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
        <nav className="sidebar">
          <div className="sidebar-logo">
            <Database className="w-8 h-8 text-blue-500" />
            FinSpark
          </div>

          {/* ── Logged-in user info ──────────────────────────────────────────── */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px', padding: '0.75rem', marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${roleBadgeColor}, #3b82f6)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <User size={14} color="white" />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {currentUser.displayName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {currentUser.email}
                </div>
              </div>
            </div>
            <span style={{
              display: 'inline-block', fontSize: '0.65rem', fontWeight: 700,
              background: `${roleBadgeColor}22`, color: roleBadgeColor,
              border: `1px solid ${roleBadgeColor}44`,
              borderRadius: '999px', padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>

          {/* ── Tenant selector ──────────────────────────────────────────────── */}
          <div className="mt-2 mb-2 px-1">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
              {currentUser.role === 'Super_Admin' ? 'Context Segregation' : 'Your Tenant'}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px',
              // Dim the selector if tenant admin (can't switch)
              opacity: currentUser.role === 'Tenant_Admin' ? 0.6 : 1
            }}>
              <Building className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0 }} />
              <select
                value={activeTenant}
                onChange={switchTenant}
                disabled={currentUser.role === 'Tenant_Admin'} // Tenant Admin locked
                style={{
                  background: 'transparent', color: 'var(--text-main)', border: 'none',
                  outline: 'none', width: '100%',
                  cursor: currentUser.role === 'Tenant_Admin' ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                {currentUser.tenantOptions.map(t => (
                  <option key={t} value={t} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                    {t.replace('TENANT_', '')} {currentUser.role === 'Super_Admin' ? '(All Access)' : '(Restricted)'}
                  </option>
                ))}
              </select>
            </div>
            {currentUser.role === 'Tenant_Admin' && (
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '4px' }}>
                Tenant Admin — view locked to your organisation
              </p>
            )}
          </div>

          {/* ── Nav links ────────────────────────────────────────────────────── */}
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 mt-4 px-3">
            Analytics & Intelligence
          </div>
          <div className="nav-menu">
            <NavLink to="/overview" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} data-feature="Dashboard:Navigation:Overview">
              <LayoutDashboard className="w-5 h-5" /> Overview
            </NavLink>
            <NavLink to="/adoption" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} data-feature="Dashboard:Navigation:Adoption">
              <BarChart3 className="w-5 h-5" /> Feature Tracker
            </NavLink>
          </div>

          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 mt-4 px-3">
            Governance & Settings
          </div>
          <div className="nav-menu">
            <NavLink to="/compliance" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} data-feature="Governance:Navigation:ComplianceHub">
              <Shield className="w-5 h-5" /> Compliance Hub
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} data-feature="Governance:Navigation:SystemSettings">
              <Settings className="w-5 h-5" /> System Settings
            </NavLink>
          </div>

          {/* ── Logout button at bottom ───────────────────────────────────────── */}
          <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
            <button
              onClick={handleLogout}
              data-feature="Governance:Action:Logout"
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 0.75rem', borderRadius: '8px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </nav>

        {/* ── Main Content ──────────────────────────────────────────────────────── */}
        <main className="main-content">
          <Routes>
            <Route path="/overview"    element={<DashboardOverview tenantId={activeTenant} />} />
            <Route path="/adoption"    element={<FeatureTracker    tenantId={activeTenant} />} />
            <Route path="/compliance"  element={<ComplianceHub     tenantId={activeTenant} />} />
            <Route path="/settings"    element={<ComingSoon title="System Settings" description="General system configuration options for managing Enterprise SSO, Roles, and License boundaries." />} />
            <Route path="*"            element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;