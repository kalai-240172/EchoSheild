import React, { useState } from 'react';
import { Activity, AlertTriangle, Phone, CreditCard, Shield, Info } from 'lucide-react';
import { runDemoAnalysis } from '../services/api';
import type { AnalysisResult } from '../types';
import { useToast } from '../components/Toast';

const CTX = {
  normal: {
    caller: 'Amit Verma', title: 'Operations Manager', phone: '+91 80 1234 5678', source: 'PSTN',
    prevCalls: 28, trust: 'High', lang: 'English', accent: 'Indian English',
    amount: '₹45,000', txType: 'Vendor Payment', normalRange: '₹10,000 – ₹2,00,000',
    indicators: [], contactStatus: 'Verified Contact', trustColor: '#22c55e',
  },
  suspicious: {
    caller: 'Priya Menon', title: 'Finance Manager', phone: '+91 98765 43210', source: 'Mobile',
    prevCalls: 3, trust: 'Medium', lang: 'English', accent: 'Indian English',
    amount: '₹8,50,000', txType: 'Emergency Transfer', normalRange: '₹50,000 – ₹5,00,000',
    indicators: ['Slightly elevated transaction', 'Urgency in request'], contactStatus: 'Known Contact', trustColor: '#f59e0b',
  },
  high_risk: {
    caller: 'Rahul Sharma', title: 'CEO (SUSPECTED IMPERSONATION)', phone: '+91 11 2345 6789', source: 'Enterprise VoIP',
    prevCalls: 0, trust: 'Very Low', lang: 'English', accent: 'Indian English',
    amount: '₹20,00,000', txType: 'Urgent Bank Transfer', normalRange: '₹10,000 – ₹2,00,000',
    indicators: ['New device', 'Unusual amount (₹20,00,000)', 'Urgency detected', 'First-time beneficiary', 'Bypasses approval', 'VoIP spoofing suspected'],
    contactStatus: 'Unverified – Caller ID Spoofing Suspected', trustColor: '#ef4444',
  },
};

type ScId = keyof typeof CTX;

export default function ContextIntelligence() {
  const [sc, setSc] = useState<ScId>('high_risk');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastContainer } = useToast();
  const ctx = CTX[sc];

  const load = async () => {
    setLoading(true);
    try {
      const r = await runDemoAnalysis({ scenario: sc, caller_name: ctx.caller, caller_number: ctx.phone });
      setResult(r.data);
    } catch { showToast('Backend unavailable', 'warning'); }
    finally { setLoading(false); }
  };

  const indColor = ctx.indicators.length === 0 ? '#22c55e' : ctx.indicators.length <= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><Activity size={18} style={{ color: '#06b6d4' }} />Context Intelligence</h1>
          <p>Caller metadata, transaction context, and fraud indicator analysis</p>
        </div>
        <button className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? 'Loading...' : 'Load Context + Analyze'}
        </button>
      </div>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {Object.entries({ normal: '#22c55e', suspicious: '#f59e0b', high_risk: '#ef4444' }).map(([id, color]) => (
          <button key={id} onClick={() => { setSc(id as ScId); setResult(null); }}
            style={{
              padding: '5px 14px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              background: sc === id ? `${color}12` : 'transparent',
              border: `2px solid ${sc === id ? color : 'var(--border)'}`,
              color: sc === id ? color : 'var(--text-secondary)', transition: 'all 0.15s',
            }}>
            {id === 'normal' ? 'Normal Call' : id === 'suspicious' ? 'Suspicious' : 'AI Fraud Attempt'}
          </button>
        ))}
      </div>

      {/* 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>

        {/* Caller profile */}
        <div className="card">
          <div className="card-title"><Phone size={13} style={{ color: '#3b82f6' }} />Caller Profile</div>
          {[
            { k: 'Name', v: ctx.caller },
            { k: 'Title', v: ctx.title },
            { k: 'Phone', v: ctx.phone, mono: true },
            { k: 'Call Source', v: ctx.source },
            { k: 'Previous Calls', v: `${ctx.prevCalls} calls` },
            { k: 'Language', v: ctx.lang },
            { k: 'Accent', v: ctx.accent },
          ].map(({ k, v, mono }) => (
            <div key={k} className="kv-row">
              <span className="kv-label">{k}</span>
              <span className="kv-value" style={{ fontFamily: mono ? 'JetBrains Mono, monospace' : undefined, fontSize: mono ? '11px' : undefined }}>{v}</span>
            </div>
          ))}
          <div className="kv-row" style={{ borderBottom: 'none' }}>
            <span className="kv-label">Trust</span>
            <span className="kv-value" style={{ color: ctx.trustColor, fontWeight: 700 }}>{ctx.trust}</span>
          </div>
          <div style={{ marginTop: '8px', padding: '6px 8px', borderRadius: '5px', background: `${ctx.trustColor}0d`, border: `1px solid ${ctx.trustColor}25`, fontSize: '11px', color: ctx.trustColor }}>
            {ctx.contactStatus}
          </div>
        </div>

        {/* Transaction */}
        <div className="card">
          <div className="card-title"><CreditCard size={13} style={{ color: '#8b5cf6' }} />Transaction Context</div>
          {[
            { k: 'Requested Amount', v: ctx.amount, highlight: sc === 'high_risk' },
            { k: 'Transaction Type', v: ctx.txType },
            { k: 'Normal Range', v: ctx.normalRange },
          ].map(({ k, v, highlight }) => (
            <div key={k} className="kv-row">
              <span className="kv-label">{k}</span>
              <span className="kv-value" style={{ color: highlight ? '#ef4444' : undefined, fontWeight: highlight ? 700 : undefined }}>{v}</span>
            </div>
          ))}

          {result && (
            <div style={{ marginTop: '10px' }}>
              <div className="section-label">Context Risk Score</div>
              <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'monospace', color: result.context_intelligence.context_score >= 70 ? '#ef4444' : '#f59e0b', lineHeight: 1, marginBottom: '6px' }}>
                {result.context_intelligence.context_score}
              </div>
              <div className="prog-track">
                <div className="prog-fill" style={{
                  width: `${result.context_intelligence.context_score}%`,
                  background: result.context_intelligence.context_score >= 70 ? '#ef4444' : '#f59e0b',
                }} />
              </div>
            </div>
          )}

          {sc === 'high_risk' && (
            <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444' }}>⚠ 10× above normal range</div>
              <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>High-value unauthorized transfer risk</div>
            </div>
          )}
        </div>

        {/* Fraud Indicators */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <AlertTriangle size={13} style={{ color: indColor }} />
            <span className="card-title" style={{ marginBottom: 0 }}>Fraud Indicators</span>
            <span className="badge" style={{ marginLeft: 'auto', background: `${indColor}12`, color: indColor, border: `1px solid ${indColor}25` }}>
              {ctx.indicators.length} detected
            </span>
          </div>

          {ctx.indicators.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '12px', padding: '8px 0' }}>
              <Shield size={14} />No fraud indicators detected
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {ctx.indicators.map((ind, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '6px 8px', borderRadius: '5px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <span style={{ color: '#ef4444', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>⚑</span>
                  <span style={{ fontSize: '11px', color: '#fca5a5' }}>{ind}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <div className="card-title"><Info size={13} style={{ color: '#3b82f6' }} />How Context Intelligence Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { title: 'Caller History Analysis', desc: 'Tracks previous call patterns, contact trust, and device fingerprinting to establish a behavioral baseline.' },
            { title: 'Transaction Anomaly Detection', desc: 'Compares requested transactions against historical patterns to flag unusual amounts, frequency, or beneficiaries.' },
            { title: 'Urgency & Social Engineering', desc: 'Detects linguistic patterns associated with urgency, pressure, and social engineering scripts in call context.' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
