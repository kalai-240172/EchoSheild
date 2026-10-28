import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Phone, Brain, Activity, Zap,
  History, AlertTriangle, BarChart3, Shield, Settings,
  Cpu, Bell, ChevronRight, Menu, X
} from 'lucide-react';
import { getAlerts } from '../services/api';

const NAV = [
  { path: '/',               label: 'Dashboard',          icon: LayoutDashboard },
  { path: '/live-call',      label: 'Live Call',           icon: Phone },
  { path: '/voice-analysis', label: 'Voice Analysis',      icon: Brain },
  { path: '/context',        label: 'Context Intel.',      icon: Activity },
  { path: '/risk-engine',    label: 'Risk Engine',         icon: Zap },
  { path: '/call-history',   label: 'Call History',        icon: History },
  { path: '/alerts',         label: 'Alerts',              icon: AlertTriangle },
  { path: '/analytics',      label: 'Analytics',           icon: BarChart3 },
  { path: '/audit',          label: 'Audit Ledger',        icon: Shield },
  { path: '/settings',       label: 'Settings',            icon: Settings },
];

interface LayoutProps { children: React.ReactNode; }

export default function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const load = () => getAlerts().then(r => setUnread(r.data.filter((a: any) => !a.read).length)).catch(() => {});
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const currentPage = NAV.find(n => n.path === location.pathname)?.label || 'Dashboard';

  return (
    <div className="app-shell">
      {/* ── SIDEBAR ── */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Cpu size={14} color="white" />
          </div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <div className="brand">EchoShield</div>
              <div className="product">Security Platform</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
          >
            {collapsed ? <Menu size={14} /> : <X size={14} />}
          </button>
        </div>

        {/* Status */}
        {!collapsed && (
          <div className="sidebar-status">
            <div className="status-line">
              <span className="pulse-dot" style={{ background: '#22c55e' }} />
              SYSTEM ONLINE
            </div>
            <div className="status-sub">AI Engine Active</div>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <span className="nav-icon">
                    <Icon size={16} color={isActive ? '#60a5fa' : 'currentColor'} />
                  </span>
                  {!collapsed && <span className="nav-label">{label}</span>}
                  {!collapsed && label === 'Alerts' && unread > 0 && (
                    <span className="nav-badge">{unread}</span>
                  )}
                  {collapsed && label === 'Alerts' && unread > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                    }} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="sidebar-footer">
            <div className="footer-line1">EchoShield Platform</div>
            <div className="footer-line2">Enterprise Security</div>
          </div>
        )}
      </aside>

      {/* ── MAIN COLUMN ── */}
      <div className="main-col">
        {/* Header */}
        <header className="top-header">
          <div className="header-breadcrumb">
            <span className="crumb-root">EchoShield</span>
            <ChevronRight size={12} className="crumb-sep" />
            <span className="crumb-page">{currentPage}</span>
          </div>

          <div className="header-right">
            <span className="system-status-badge">● SYSTEM ACTIVE</span>

            <button className="header-icon-btn" title="Notifications">
              <Bell size={15} />
              {unread > 0 && <span className="notif-dot" />}
            </button>

            <div className="header-user">
              <div className="avatar">SC</div>
              <span className="uname">Security Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="page-content">
          <div className="fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
