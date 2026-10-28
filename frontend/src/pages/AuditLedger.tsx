import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, CheckCircle, AlertTriangle, Hash } from 'lucide-react';
import { getAuditBlocks, verifyLedger } from '../services/api';
import type { AuditBlock } from '../types';

const fmtTs = (ts: string) =>
  new Date(ts + 'Z').toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', month: 'short', day: 'numeric' });

const short = (h: string) => h ? `${h.slice(0, 8)}...${h.slice(-6)}` : '—';
const rc = (score?: number) => !score ? '#22c55e' : score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';

export default function AuditLedger() {
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [selected, setSelected] = useState<AuditBlock | null>(null);

  const load = () => {
    setLoading(true);
    getAuditBlocks().then(r => setBlocks(r.data.slice().reverse())).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const doVerify = async () => {
    setVerifying(true);
    try {
      const r = await verifyLedger();
      setVerified(r.data.valid ?? r.data.verified);
    } catch { setVerified(false); }
    finally { setVerifying(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><Shield size={18} style={{ color: '#06b6d4' }} />Tamper-Evident Audit Ledger</h1>
          <p>SHA-256 hash-chained security event log · Click a block to view full hashes</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {verified !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 12px', borderRadius: '5px', fontSize: '11px', fontWeight: 700,
              background: verified ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: verified ? '#22c55e' : '#ef4444',
              border: `1px solid ${verified ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}>
              {verified ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
              {verified ? 'LEDGER INTEGRITY VERIFIED' : 'INTEGRITY CHECK FAILED'}
            </div>
          )}
          <button className="btn btn-ghost" onClick={load}><RefreshCw size={13} /></button>
          <button className="btn btn-primary" onClick={doVerify} disabled={verifying}>
            <Shield size={13} />{verifying ? 'Verifying...' : 'Verify Ledger'}
          </button>
        </div>
      </div>

      {/* Info strip */}
      <div className="info-strip" style={{ background: 'rgba(6,182,212,0.07)', borderColor: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
        <Shield size={13} />
        Each block's hash includes the previous block hash. Any retroactive modification breaks the chain. Cryptographically secured local tamper-evident audit chain.
      </div>

      {/* Stats */}
      <div className="grid-4">
        {[
          { label: 'Total Blocks', v: blocks.length, color: '#06b6d4' },
          { label: 'High Risk Events', v: blocks.filter(b => (b.risk_score ?? 0) >= 70).length, color: '#ef4444' },
          { label: 'Medium Risk Events', v: blocks.filter(b => { const s = b.risk_score ?? 0; return s >= 40 && s < 70; }).length, color: '#f59e0b' },
          { label: 'Chain Status', v: verified === null ? '—' : verified ? '✓' : '✗', color: verified === false ? '#ef4444' : '#22c55e' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center', padding: '10px 14px' }}>
            <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>{s.v}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Blocks + detail */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Block list */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="card empty-state" style={{ padding: '32px' }}>
              <div className="empty-state-title">Loading blocks...</div>
            </div>
          ) : blocks.length === 0 ? (
            <div className="card empty-state" style={{ padding: '32px' }}>
              <Shield size={28} className="empty-state-icon" />
              <div className="empty-state-title">No audit blocks yet</div>
              <div className="empty-state-desc">Simulate a call or analyze audio to record audit events</div>
            </div>
          ) : (
            blocks.map((block, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === blocks.length - 1;
              const color = rc(block.risk_score);
              return (
                <div key={block.id} style={{ display: 'flex', gap: '0' }}>
                  {/* Chain connector */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0 }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, marginTop: '14px', flexShrink: 0 }} />
                    {!isLast && <div style={{ width: '2px', flex: 1, background: 'rgba(255,255,255,0.06)', margin: '0 auto' }} />}
                  </div>

                  {/* Block card */}
                  <div
                    className={`audit-block${(block.risk_score ?? 0) >= 70 ? ' high-risk' : ''}`}
                    onClick={() => setSelected(selected?.id === block.id ? null : block)}
                    style={{
                      flex: 1, marginLeft: '8px', marginBottom: '4px', cursor: 'pointer',
                      border: selected?.id === block.id ? '1px solid rgba(59,130,246,0.4)' : undefined,
                      background: selected?.id === block.id ? 'rgba(59,130,246,0.05)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* Block number */}
                      <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#06b6d4' }}>
                        #{block.block_number}
                      </span>
                      {/* Timestamp */}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {fmtTs(block.timestamp)}
                      </span>
                      {/* Risk */}
                      {block.risk_score != null && (
                        <span style={{ fontSize: '12px', fontWeight: 800, fontFamily: 'monospace', color, marginLeft: 'auto' }}>
                          {block.risk_score.toFixed(0)}
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: '5px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{block.event}</span>
                      {block.action && (
                        <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {block.action}
                        </span>
                      )}
                    </div>

                    <div style={{ marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Hash size={10} style={{ color: '#22c55e', flexShrink: 0 }} />
                        <span className="audit-hash current">{short(block.current_hash)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <Hash size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <span className="audit-hash">prev: {short(block.previous_hash)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="card fade-in" style={{ width: '300px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span className="card-title" style={{ marginBottom: 0 }}>Block #{selected.block_number}</span>
              <button className="drawer-close" onClick={() => setSelected(null)}>×</button>
            </div>

            {[
              { k: 'Block Number', v: `#${selected.block_number}` },
              { k: 'Timestamp', v: fmtTs(selected.timestamp) },
              { k: 'Event', v: selected.event },
              { k: 'Risk Score', v: selected.risk_score != null ? `${selected.risk_score.toFixed(1)} / 100` : '—' },
              { k: 'Action', v: selected.action || '—' },
            ].map(({ k, v }) => (
              <div key={k} className="kv-row">
                <span className="kv-label">{k}</span>
                <span className="kv-value">{v}</span>
              </div>
            ))}

            <div style={{ marginTop: '10px' }}>
              <div className="section-label" style={{ marginBottom: '6px' }}>Cryptographic Hashes</div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#22c55e', marginBottom: '3px' }}>CURRENT HASH</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#22c55e', wordBreak: 'break-all', padding: '6px 8px', borderRadius: '5px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  {selected.current_hash || '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>PREVIOUS HASH</div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-muted)', wordBreak: 'break-all', padding: '6px 8px', borderRadius: '5px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                  {selected.previous_hash || 'GENESIS BLOCK'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              SHA-256 hash computed over: block_number + timestamp + event + risk_score + action + previous_hash
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
