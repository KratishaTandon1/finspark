import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Shield, BarChart3, Settings, Database, Building, Menu, X } from 'lucide-react';
import DashboardOverview from './pages/DashboardOverview';
import ComplianceHub from './pages/ComplianceHub';
import ComingSoon from './pages/ComingSoon';
import { telemetry } from './sdk/finspark-telemetry'; 

function App() {
  const [activeTenant, setActiveTenant] = useState(telemetry.tenantId);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeRole, setActiveRole] = useState('Admin');

  const switchTenant = (e) => {
    const newTenantId = e.target.value;
    telemetry.setTenant(newTenantId);
    setActiveTenant(newTenantId);
    window.location.reload(); // Hard reload strictly unmounts contexts mimicking a re-login
  };

  return (
    <BrowserRouter>
      <div className="app-container">
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

        {/* Sidebar */}
        <nav className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-logo">
            <Database className="w-8 h-8 text-blue-500" />
            FinSpark
          </div>

          <div className="mt-2 mb-2 px-1">
             <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
                Context Segregation
              </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
                <Building className="w-4 h-4 text-emerald-400" />
                <select 
                  value={activeTenant} 
                  onChange={switchTenant}
                  style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', outline: 'none', width: '100%', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  <option value="TENANT_HDFC" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>HDFC Enterprise</option>
                  <option value="TENANT_ICICI" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>ICICI Bank</option>
                </select>
             </div>
          </div>

          {/* PERSONA SIMULATOR */}
          <div className="mt-4 mb-2 px-1">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2" data-feature="Sidebar:RoleSegregation">
               Role Persona
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px' }}>
               <Shield className="w-4 h-4 text-purple-400" />
               <select 
                 value={activeRole} 
                 onChange={(e) => setActiveRole(e.target.value)}
                 style={{ background: 'transparent', color: 'var(--text-main)', border: 'none', outline: 'none', width: '100%', cursor: 'pointer', fontSize: '0.875rem' }}
               >
                 <option value="Admin" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Platform Admin</option>
                 <option value="User" style={{ background: 'var(--bg-secondary)', color: 'var(--text-main)' }}>Standard User</option>
               </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 mt-4 px-3">
            Analytics & Intelligence
          </div>
          <div className="nav-menu">
            {/* Note the updated data-feature attribute for hierarchical taxonomy schema */}
            <NavLink to="/overview" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} data-feature="Dashboard:Navigation:Overview" onClick={() => setIsMobileMenuOpen(false)}>
              <LayoutDashboard className="w-5 h-5" />
              Overview
            </NavLink>
            <NavLink to="/adoption" className={({isActive}) => isActive ? "nav-link active" : "nav-link"} data-feature="Dashboard:Navigation:Adoption" onClick={() => setIsMobileMenuOpen(false)}>
              <BarChart3 className="w-5 h-5" />
              Feature Tracker
            </NavLink>
          </div>
          
          {activeRole === 'Admin' && (
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
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/overview" element={<DashboardOverview tenantId={activeTenant} />} />
            <Route path="/adoption" element={<ComingSoon title="Feature Tracker" description="This module is under construction. It will display deeper metric tracking natively bound to the selected organizational context." />} />
            <Route path="/compliance" element={<ComplianceHub tenantId={activeTenant} />} />
            <Route path="/settings" element={<ComingSoon title="System Settings" description="General system configuration options for managing Enterprise SSO, Roles, and License boundaries." />} />
            {/* Fallbacks */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
