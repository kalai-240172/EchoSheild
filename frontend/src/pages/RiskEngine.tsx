import React, { useState, useEffect } from 'react';
import { Zap, Play, ChevronRight, Info } from 'lucide-react';
import { runDemoAnalysis, getSettings } from '../services/api';
import type { AnalysisResult, Settings } from '../types';
import RiskScoreGauge from '../components/RiskScoreGauge';
import { useToast } from '../components/Toast';

export default function RiskEngine() {
  const [sc, setSc] = useState<'normal' | 'suspicious' | 'high_risk'>('high_risk');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    getSettings().then(r => setSettings(r.data)).catch(() => {});
  }, []);

  const weights = [
    { key: 'spoof',   label: 'Anti-Spoofing',       pct: settings?.weight_anti_spoofing ?? 35, color: '#ef4444' },
    { key: 'speaker', label: 'Speaker Verification', pct: settings?.weight_speaker_verification ?? 25, color: '#f59e0b' },
    { key: 'prosody', label: 'Prosody Analysis',     pct: settings?.weight_prosody ?? 15, color: '#8b5cf6' },
    { key: 'context', label: 'Context Intelligence', pct: settings?.weight_context ?? 25, color: '#06b6d4' },
  ];

  const lowTh = settings?.low_threshold ?? 39;
  const medTh = settings?.medium_threshold ?? 69;

  const run = async () => {
    setLoading(true);
    try {
      const r = await runDemoAnalysis({ scenario: sc });
      setResult(r.data);
    } catch { showToast('Backend unavailable', 'warning'); }
    finally { setLoading(false); }
  };

  const rows = result ? [
    { ...weights[0], raw: result.anti_spoofing?.spoof_probability ?? 0,       contrib: result.risk_fusion?.spoof_contribution ?? 0 },
    { ...weights[1], raw: 100 - (result.speaker_verification?.match_score ?? 50), contrib: result.risk_fusion?.speaker_contribution ?? 0 },
    { ...weights[2], raw: result.prosody_analysis?.risk_score ?? 0,             contrib: result.risk_fusion?.prosody_contribution ?? 0 },
    { ...weights[3], raw: result.context_intelligence?.context_score ?? 0,       contrib: result.risk_fusion?.context_contribution ?? 0 },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><Zap size={18} style={{ color: '#f59e0b' }} />Risk Fusion Engine</h1>
          <p>Combines independent acoustic and contextual signals into a single calibrated risk score</p>
        </div>
        <button className="btn btn-warning" onClick={run} disabled={loading}>
          <Play size={13} />{loading ? 'Evaluating...' : 'Run Risk Fusion'}
        </button>
      </div>

      {/* Formula card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Info size={13} style={{ color: '#3b82f6' }} />
          <span className="card-title" style={{ marginBottom: 0 }}>Active Risk Fusion Formula</span>
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', color: 'var(--text-secondary)' }}>
          risk_score = &nbsp;
          <span style={{ color: '#ef4444' }}>{(weights[0].pct / 100).toFixed(2)} × spoof</span> +&nbsp;
          <span style={{ color: '#f59e0b' }}>{(weights[1].pct / 100).toFixed(2)} × speaker_risk</span> +&nbsp;
          <span style={{ color: '#8b5cf6' }}>{(weights[2].pct / 100).toFixed(2)} × prosody</span> +&nbsp;
          <span style={{ color: '#06b6d4' }}>{(weights[3].pct / 100).toFixed(2)} × context</span>
        </div>
      </div>

      {/* Scenario + Weights */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '12px' }}>
        {/* Scenario */}
        <div className="card">
          <div className="card-title">Scenario</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {([
              { id: 'normal',     label: 'Normal Call',    color: '#22c55e' },
              { id: 'suspicious', label: 'Suspicious',      color: '#f59e0b' },
              { id: 'high_risk',  label: 'AI Fraud Attempt', color: '#ef4444' },
            ] as const).map(s => (
              <button key={s.id} onClick={() => { setSc(s.id); setResult(null); }}
                style={{
                  padding: '7px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', textAlign: 'left',
                  background: sc === s.id ? `${s.color}12` : 'transparent',
                  border: `2px solid ${sc === s.id ? s.color : 'var(--border)'}`,
                  color: sc === s.id ? s.color : 'var(--text-secondary)', transition: 'all 0.15s',
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weights */}
        <div className="card">
          <div className="card-title">Configured Signal Weights</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {weights.map(w => (
              <div key={w.key} style={{ padding: '10px', borderRadius: '6px', background: `${w.color}08`, border: `1px solid ${w.color}20`, textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: w.color, fontFamily: 'monospace' }}>{Math.round(w.pct)}%</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{w.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '12px', alignItems: 'start' }}>

          {/* Breakdown table + formula result */}
          <div className="card">
            <div className="card-title">Signal Contribution Breakdown</div>
            <table className="data-table" style={{ marginBottom: '10px' }}>
              <thead>
                <tr>
                  {['Signal', 'Weight', 'Raw Score', 'Contribution', 'Share'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.key}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: row.color, display: 'inline-block', flexShrink: 0 }} />
                      {row.label}
                    </td>
                    <td className="mono" style={{ color: row.color }}>{Math.round(row.pct)}%</td>
                    <td className="mono">{row.raw.toFixed(1)}</td>
                    <td className="mono" style={{ fontWeight: 700, color: row.color }}>{row.contrib.toFixed(2)}</td>
                    <td style={{ width: '100px' }}>
                      <div className="prog-track">
                        <div className="prog-fill" style={{ width: `${result.risk_score > 0 ? (row.contrib / result.risk_score) * 100 : 0}%`, background: row.color }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-strong)' }}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>FINAL SCORE</td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>100%</td>
                  <td />
                  <td className="mono" style={{ fontWeight: 800, fontSize: '18px', color: result.risk_level === 'HIGH' ? '#ef4444' : result.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e' }}>
                    {result.risk_score}
                  </td>
                  <td>
                    <span className={`badge badge-${result.risk_level.toLowerCase()}`}>{result.risk_level}</span>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Formula evaluation */}
            <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '12px' }}>
              {rows.map((r, i) => (
                <span key={r.key}>
                  <span style={{ color: r.color }}>{r.contrib.toFixed(2)}</span>
                  {i < rows.length - 1 && <span style={{ color: 'var(--text-muted)' }}> + </span>}
                </span>
              ))}
              <span style={{ color: 'var(--text-muted)' }}> = </span>
              <span style={{ fontWeight: 700, color: result.risk_level === 'HIGH' ? '#ef4444' : '#f59e0b' }}>{result.risk_score}</span>
              <span style={{ color: 'var(--text-muted)' }}> → </span>
              <span style={{ color: result.risk_level === 'HIGH' ? '#ef4444' : result.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>{result.risk_level} RISK</span>
            </div>
          </div>

          {/* Gauge + decision */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="card-title" style={{ marginBottom: '8px' }}>Fused Risk Score</div>
              <RiskScoreGauge score={result.risk_score} level={result.risk_level} size={155} />
              <div style={{ marginTop: '8px', padding: '6px 14px', borderRadius: '5px', background: result.risk_level === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)', border: `1px solid ${result.risk_level === 'HIGH' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: result.risk_level === 'HIGH' ? '#ef4444' : '#22c55e', textAlign: 'center' }}>
                  DECISION: {result.risk_level === 'HIGH' ? '🛑 BLOCK / VERIFY' : result.risk_level === 'MEDIUM' ? '⚠ REVIEW' : '✓ ALLOW'}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Recommended Actions</div>
              {(result.recommended_actions || []).map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <ChevronRight size={10} style={{ color: 'var(--text-muted)' }} />{a}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Threshold legend */}
      <div className="card">
        <div className="card-title">Active Threshold Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { level: 'LOW',    range: `0 – ${lowTh}`,   color: '#22c55e', desc: 'Continue & Monitor' },
            { level: 'MEDIUM', range: `${lowTh + 1} – ${medTh}`,  color: '#f59e0b', desc: 'Secondary Verification Required' },
            { level: 'HIGH',   range: `${medTh + 1} – 100`, color: '#ef4444', desc: 'Block & Escalate Immediately' },
          ].map(({ level, range, color, desc }) => (
            <div key={level} style={{ padding: '10px 12px', borderRadius: '6px', background: `${color}08`, border: `1px solid ${color}20` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="badge" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{level}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'monospace' }}>{range}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
