import React, { useState, useEffect } from 'react';
import { History, Search, ChevronDown, ChevronUp, Download, RefreshCw, X } from 'lucide-react';
import { getCalls } from '../services/api';
import type { CallRecord, RiskLevel } from '../types';

const rc = (l: RiskLevel) => l === 'HIGH' ? '#ef4444' : l === 'MEDIUM' ? '#f59e0b' : '#22c55e';
const fmtD = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const fmtTs = (ts: string) => {
  const d = new Date(ts + 'Z');
  return d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
};

export default function CallHistory() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RiskLevel | 'ALL'>('ALL');
  const [sortKey, setSortKey] = useState<'timestamp' | 'risk_score'>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<CallRecord | null>(null);

  const load = () => {
    setLoading(true);
    getCalls().then(r => setCalls(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = calls
    .filter(c =>
      (filter === 'ALL' || c.risk_level === filter) &&
      (c.caller_name.toLowerCase().includes(search.toLowerCase()) ||
       c.caller_number.includes(search) ||
       c.call_source.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const va = sortKey === 'timestamp' ? new Date(a.timestamp).getTime() : a.risk_score;
      const vb = sortKey === 'timestamp' ? new Date(b.timestamp).getTime() : b.risk_score;
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const toggleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: string }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
    : <ChevronDown size={11} style={{ opacity: 0.3 }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><History size={18} style={{ color: '#3b82f6' }} />Call History</h1>
          <p>Searchable log of all analyzed calls · Click a row to view details</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={13} />Refresh</button>
          <button className="btn btn-ghost"><Download size={13} />Export</button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-4">
        {[
          { label: 'Total Calls', v: calls.length, color: '#3b82f6' },
          { label: 'High Risk', v: calls.filter(c => c.risk_level === 'HIGH').length, color: '#ef4444' },
          { label: 'Medium Risk', v: calls.filter(c => c.risk_level === 'MEDIUM').length, color: '#f59e0b' },
          { label: 'Low Risk', v: calls.filter(c => c.risk_level === 'LOW').length, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '10px 14px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="search-input" style={{ paddingLeft: '30px' }} placeholder="Search caller, number, source..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(l => (
          <button key={l} className={`filter-btn${filter === l ? ' active' : ''}`} onClick={() => setFilter(l)}>{l}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>{filtered.length} records</span>
      </div>

      {/* Table + Drawer side by side */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Table */}
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort('timestamp')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Time <SortIcon k="timestamp" /></div>
                  </th>
                  <th>Caller</th>
                  <th>Source</th>
                  <th>Duration</th>
                  <th onClick={() => toggleSort('risk_score')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Risk <SortIcon k="risk_score" /></div>
                  </th>
                  <th>Level</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <History size={24} className="empty-state-icon" />
                        <div className="empty-state-title">No analyzed calls yet</div>
                        <div className="empty-state-desc">Simulate a call or analyze an audio file to log records</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(call => (
                    <tr key={call.id} onClick={() => setSelected(selected?.id === call.id ? null : call)}
                      style={{ background: selected?.id === call.id ? 'rgba(59,130,246,0.06)' : undefined }}>
                      <td className="muted mono" style={{ fontSize: '11px' }}>{fmtTs(call.timestamp)}</td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12px' }}>{call.caller_name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{call.caller_number}</div>
                      </td>
                      <td className="muted">{call.call_source}</td>
                      <td className="mono muted">{fmtD(call.duration)}</td>
                      <td>
                        <span style={{ fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: rc(call.risk_level) }}>
                          {call.risk_score.toFixed(0)}
                        </span>
                      </td>
                      <td><span className={`badge badge-${call.risk_level.toLowerCase()}`}>{call.risk_level}</span></td>
                      <td className="muted" style={{ fontSize: '11px' }}>{call.action_taken}</td>
                      <td>
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px',
                          background: call.status === 'Blocked' ? 'rgba(239,68,68,0.1)' : call.status === 'Completed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                          color: call.status === 'Blocked' ? '#ef4444' : call.status === 'Completed' ? '#22c55e' : '#f59e0b',
                        }}>{call.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail drawer (inline) */}
        {selected && (
          <div className="card fade-in" style={{ width: '280px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span className="card-title" style={{ marginBottom: 0 }}>Call Detail</span>
              <button className="drawer-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { k: 'Caller', v: selected.caller_name },
                { k: 'Number', v: selected.caller_number, mono: true },
                { k: 'Source', v: selected.call_source },
                { k: 'Duration', v: fmtD(selected.duration), mono: true },
                { k: 'Time', v: fmtTs(selected.timestamp) },
                { k: 'Status', v: selected.status },
                { k: 'Action', v: selected.action_taken },
              ].map(({ k, v, mono }) => (
                <div key={k} className="kv-row">
                  <span className="kv-label">{k}</span>
                  <span className="kv-value" style={{ fontFamily: mono ? 'monospace' : undefined, fontSize: mono ? '11px' : undefined }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px' }}>
              <div className="section-label">AI Signal Scores</div>
              {[
                { label: 'Anti-Spoofing',    v: selected.spoof_score,         color: '#ef4444' },
                { label: 'Speaker Match',    v: selected.speaker_match_score,  color: '#f59e0b' },
                { label: 'Prosody Risk',     v: selected.prosody_score,        color: '#8b5cf6' },
                { label: 'Context Risk',     v: selected.context_score,        color: '#06b6d4' },
              ].map(({ label, v, color }) => (
                <div key={label} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'monospace' }}>{v.toFixed(0)}</span>
                  </div>
                  <div className="prog-track"><div className="prog-fill" style={{ width: `${v}%`, background: color }} /></div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'monospace', color: rc(selected.risk_level) }}>
                {selected.risk_score.toFixed(0)}
              </span>
              <div style={{ marginTop: '2px' }}>
                <span className={`badge badge-${selected.risk_level.toLowerCase()}`}>{selected.risk_level}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
