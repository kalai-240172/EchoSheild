import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Filter, CheckCircle, Check } from 'lucide-react';
import { getAlerts, markAlertRead, resolveAlert, markAllAlertsRead } from '../services/api';
import type { AlertRecord, RiskLevel } from '../types';

const rc = (l: RiskLevel) => l === 'HIGH' ? '#ef4444' : l === 'MEDIUM' ? '#f59e0b' : '#22c55e';
const timeAgo = (ts: string) => {
  const d = (Date.now() - new Date(ts + 'Z').getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return new Date(ts + 'Z').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RiskLevel | 'ALL' | 'UNREAD'>('ALL');

  const load = () => {
    setLoading(true);
    getAlerts().then(r => setAlerts(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

  const handleMarkRead = async (id: number) => {
    try {
      await markAlertRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
    } catch {}
  };

  const handleResolve = async (id: number) => {
    try {
      await resolveAlert(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true, title: a.title.replace('Detected', 'Resolved') } : a));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    } catch {}
  };

  const filtered = alerts.filter(a =>
    filter === 'ALL' ? true :
    filter === 'UNREAD' ? !a.read :
    a.risk_level === filter
  );

  const counts = {
    total: alerts.length,
    high: alerts.filter(a => a.risk_level === 'HIGH').length,
    medium: alerts.filter(a => a.risk_level === 'MEDIUM').length,
    unread: alerts.filter(a => !a.read).length,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><AlertTriangle size={18} style={{ color: '#f59e0b' }} />Security Alerts</h1>
          <p>Real-time voice security alerts · Auto-refreshes every 15s</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {counts.unread > 0 && (
            <button className="btn btn-ghost" onClick={handleMarkAllRead}>
              <Check size={13} />Mark All Read
            </button>
          )}
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={13} />Refresh</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: 'Total Alerts', v: counts.total, color: '#3b82f6' },
          { label: 'High Risk', v: counts.high, color: '#ef4444' },
          { label: 'Medium Risk', v: counts.medium, color: '#f59e0b' },
          { label: 'Unread', v: counts.unread, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '10px 14px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <Filter size={13} style={{ color: 'var(--text-muted)' }} />
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW', 'UNREAD'] as const).map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
            {f} {f !== 'ALL' && f !== 'UNREAD' && `(${alerts.filter(a => a.risk_level === f).length})`}
            {f === 'UNREAD' && `(${counts.unread})`}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{filtered.length} alerts</span>
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="card empty-state" style={{ padding: '32px' }}>
          <div className="empty-state-title">Loading alerts...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state" style={{ padding: '32px' }}>
          <AlertTriangle size={28} className="empty-state-icon" />
          <div className="empty-state-title">No active security alerts</div>
          <div className="empty-state-desc">Simulate a call or analyze an audio file to generate security events</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map(alert => (
            <div key={alert.id}
              className={`alert-row ${alert.risk_level.toLowerCase()}${!alert.read ? ' unread' : ''}${alert.risk_level === 'HIGH' && !alert.read ? ' alert-high-flash' : ''}`}>
              {/* Icon */}
              <div style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>
                {alert.risk_level === 'HIGH' ? '🚨' : alert.risk_level === 'MEDIUM' ? '⚠️' : '✅'}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</span>
                  <span className={`badge badge-${alert.risk_level.toLowerCase()}`}>{alert.risk_level}</span>
                  {!alert.read && <span className="badge badge-info">UNREAD</span>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: 1.5 }}>{alert.reason}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{alert.caller_number}</span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Action: <strong>{alert.action}</strong></span>
                  <span style={{ color: 'var(--text-muted)' }}>·</span>
                  <span style={{ color: 'var(--text-muted)' }}>{timeAgo(alert.timestamp)}</span>
                </div>
              </div>

              {/* Actions & Score */}
              <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', color: rc(alert.risk_level), lineHeight: 1 }}>
                  {alert.risk_score.toFixed(0)}
                </span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  {!alert.read && (
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '2px 8px', fontSize: '10px', height: '22px' }}
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(alert.id); }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '2px 8px', fontSize: '10px', height: '22px', color: '#22c55e' }}
                    onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
