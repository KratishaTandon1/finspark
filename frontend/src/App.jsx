import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Shield, BarChart3, Settings, Database, Building, LogOut, User, Menu, X } from 'lucide-react';

import DashboardOverview from './pages/DashboardOverview';
import ComplianceHub     from './pages/ComplianceHub';
import FeatureTracker    from './pages/FeatureTracker';
import ComingSoon        from './pages/ComingSoon';
import Login             from './pages/Login';
import { telemetry }     from './sdk/finspark-telemetry';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  // Set default active tenant. Real value will be from user or telemetry
  const [activeTenant, setActiveTenant] = useState(telemetry?.tenantId || 'TENANT_HDFC');
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [availableTenants, setAvailableTenants] = useState([]);

  // Fetch available tenants from API
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/api/tenants`);
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setAvailableTenants(data);
          // Auto-select if current tenant is orphaned 
          if (!data.includes(activeTenant)) {
            telemetry.setTenant(data[0]);
            setActiveTenant(data[0]);
          }
        }
      } catch (e) {
        console.error("Failed to retrieve logical tenants", e);
      }
    };
    fetchTenants();
  }, [activeTenant]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.tenantOptions && user.tenantOptions.length > 0) {
      const firstTenant = user.tenantOptions[0];
      setActiveTenant(firstTenant);
      telemetry.setTenant(firstTenant);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTenant('TENANT_HDFC');
  };

  const switchTenant = (e) => {
    const newTenantId = e.target.value;
    telemetry.setTenant(newTenantId);
    setActiveTenant(newTenantId);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const roleBadgeColor = currentUser.role === 'Super_Admin' ? '#8b5cf6' : '#10b981';
  // Admin Check
  const isAdmin = currentUser.role === 'Super_Admin' || currentUser.role === 'Tenant_Admin' || currentUser.role === 'Admin';
  // Determine tenants to display
  const displayTenants = currentUser.role === 'Super_Admin' && availableTenants.length > 0 
    ? availableTenants 
    : (currentUser.tenantOptions || []);

  return (
    <BrowserRouter>
      <div className="app-container">

        <>
          {/* Mobile Header */}
          <div className="mobile-header">
            <div className="sidebar-logo" style={{ fontSize: '1.25rem' }}>
              <Database className="w-6 h-6 text-blue-500" />
              FinSpark
            </div>
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-300" /> : <Menu className="w-6 h-6 text-slate-300" />}
            </button>
          </div>

          {/* Mobile Overlay Backdrop */}
          {isMobileMenuOpen && (
            <div className="mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
          )}

          {/* Sidebar Menu */}
          <nav className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-logo hidden sm:flex">
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', opacity: currentUser.role === 'Tenant_Admin' ? 0.6 : 1 }}>
                <Building className="w-4 h-4 text-emerald-400" style={{ flexShrink: 0 }} />
                <select 
                  value={activeTenant} 
                  onChange={switchTenant}
                  disabled={currentUser.role === 'Tenant_Admin'}
                  className="tenant-switcher"
                  style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', outline: 'none', width: '100%', cursor: currentUser.role === 'Tenant_Admin' ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}
                >
                  {displayTenants.length > 0 ? (
                    displayTenants.map(t => (
                      <option key={t} value={t} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>
                        {t.replace('TENANT_', '').replace(/_/g, ' ')} {currentUser.role === 'Super_Admin' ? '(All Access)' : '(Restricted)'}
                      </option>
                    ))
                  ) : (
                    <option value={activeTenant} style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Loading Context...</option>
                  )}
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
              <NavLink to="/overview" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} data-feature="Dashboard:Navigation:Overview" onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard className="w-5 h-5" />
                Overview
              </NavLink>
              <NavLink to="/adoption" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} data-feature="Dashboard:Navigation:Adoption" onClick={() => setIsMobileMenuOpen(false)}>
                <BarChart3 className="w-5 h-5" />
                Feature Tracker
              </NavLink>
            </div>
            
            {isAdmin && (
              <>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 mt-4 px-3" data-feature="Sidebar:GovernanceVisibility">
                  Governance & Settings
                </div>
                <div className="nav-menu">
                  <NavLink to="/compliance" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} data-feature="Governance:Navigation:ComplianceHub" onClick={() => setIsMobileMenuOpen(false)}>
                    <Shield className="w-5 h-5" />
                    Compliance Hub
                  </NavLink>
                  <NavLink to="/settings" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} data-feature="Governance:Navigation:SystemSettings" onClick={() => setIsMobileMenuOpen(false)}>
                    <Settings className="w-5 h-5" />
                    System Settings
                  </NavLink>
                </div>
              </>
            )}

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
        </>

        {/* ── Main Content ──────────────────────────────────────────────────────── */}
        <main className="main-content">
          <Routes>
            <Route path="/overview" element={<DashboardOverview tenantId={activeTenant} />} />
            <Route path="/adoption" element={<FeatureTracker tenantId={activeTenant} />} />
            
            {/* Protected Routes */}
            <Route path="/compliance" element={
              isAdmin ? <ComplianceHub tenantId={activeTenant} /> : <Navigate to="/overview" replace />
            } />
            <Route path="/settings" element={
              isAdmin ? <ComingSoon title="System Settings" description="General system configuration options for managing Enterprise SSO, Roles, and License boundaries." /> : <Navigate to="/overview" replace />
            } />
            
            {/* Fallbacks */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;