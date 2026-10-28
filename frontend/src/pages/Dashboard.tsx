import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone, Shield, AlertTriangle, CheckCircle, TrendingUp,
  Activity, Zap, Play, Clock, BarChart2, ChevronRight
} from 'lucide-react';
import RiskScoreGauge from '../components/RiskScoreGauge';
import { getAnalytics, getAlerts, runDemoAnalysis } from '../services/api';
import type { AnalyticsData, AlertRecord, AnalysisResult } from '../types';
import AnalysisProgress from '../components/AnalysisProgress';
import { useToast } from '../components/Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

function StatCard({ label, value, icon, color, sub }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div className="stat-card" style={{ borderLeft: `3px solid ${color}40` }}>
      <div className="stat-icon" style={{ background: `${color}12` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-body">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-trend" style={{ color: 'var(--text-muted)' }}>{sub}</div>}
      </div>
    </div>
  );
}

const riskColor = (level?: string) =>
  level === 'HIGH' ? '#ef4444' : level === 'MEDIUM' ? '#f59e0b' : '#22c55e';

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const timeAgo = (ts: string) => {
  const diff = (Date.now() - new Date(ts + 'Z').getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertRecord[]>([]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callActive, setCallActive] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const refresh = useCallback(() => {
    getAnalytics().then(r => setAnalytics(r.data)).catch(() => {});
    getAlerts().then(r => setRecentAlerts(r.data.slice(0, 5))).catch(() => {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (callActive) t = setInterval(() => setCallTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [callActive]);

  const startDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true); setResult(null); setCallTimer(0);
    setCallActive(true); setAnalysisRunning(true);
    try {
      const r = await runDemoAnalysis({ scenario: 'high_risk', caller_name: 'Rahul Sharma – CEO', caller_number: '+91 11 2345 6789', call_source: 'Enterprise VoIP' });
      setResult(r.data);
    } catch {
      showToast('Backend connection error – using cached simulation parameters', 'warning');
      setResult({
        call_id: 1042, scenario: 'high_risk',
        analysis_note: 'AI Voice Intelligence Engine',
        risk_score: 91, risk_level: 'HIGH',
        anti_spoofing: { spoof_probability: 92.3, authenticity_score: 7.7, confidence: 96.5, artifacts: ['GAN artifacts', 'Phase discontinuities'], explanation: 'Synthetic speech detected.' },
        speaker_verification: { match_score: 18.3, expected_speaker: 'Rahul Sharma', result_label: 'LOW_CONFIDENCE', confidence: 94, explanation: 'Speaker mismatch.' },
        prosody_analysis: { risk_score: 78.5, pitch_variation: 5.2, speaking_rate: 210, energy_variation: 1.8, anomalies: ['Very low pitch variation', 'Missing natural pauses'], explanation: 'Prosodic anomalies.', pitch_data: [], energy_data: [] },
        context_intelligence: { context_score: 95, indicators: ['New device', 'Unusual transaction', 'Urgency'] },
        risk_fusion: { final_score: 91, spoof_contribution: 32.3, speaker_contribution: 20.4, prosody_contribution: 11.8, context_contribution: 23.75 },
        recommended_actions: ['Trigger MFA', 'Initiate Callback', 'Hold Transaction', 'Escalate'],
        audit_block_number: 1042,
      });
    }
  }, [demoRunning, showToast]);

  const onAnalysisDone = useCallback(() => {
    setAnalysisRunning(false); setCallActive(false); setDemoRunning(false);
    showToast('🚨 HIGH RISK – AI Voice Impersonation Detected!', 'error');
    refresh();
  }, [refresh, showToast]);

  const s = analytics?.summary;
  const chartData = analytics?.daily_data?.slice(-7) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>EchoShield Dashboard</h1>
          <p>Real-Time AI Voice Impersonation Detection & Risk Monitoring</p>
        </div>
        <button className="btn-demo" onClick={startDemo} disabled={demoRunning}>
          <Play size={13} />
          {demoRunning ? '🔴 SIMULATION RUNNING...' : 'SIMULATE CALL'}
        </button>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid-5">
        <StatCard label="Calls Analyzed"    value={s?.total_calls ?? '—'}        icon={<Phone size={16}/>}        color="#3b82f6" sub="Total" />
        <StatCard label="High Risk Calls"   value={s?.high_risk ?? '—'}           icon={<AlertTriangle size={16}/>} color="#ef4444" sub="Blocked" />
        <StatCard label="Medium Risk"       value={s?.medium_risk ?? '—'}         icon={<Shield size={16}/>}       color="#f59e0b" sub="Review" />
        <StatCard label="Threats Prevented" value={s?.threats_prevented ?? '—'}   icon={<CheckCircle size={16}/>}  color="#22c55e" sub="Protected" />
        <StatCard label="Avg Risk Score"    value={s?.avg_risk_score ?? '—'}      icon={<TrendingUp size={16}/>}   color="#8b5cf6" sub="Score /100" />
      </div>

      {/* ── ROW 2: Live Call + Risk Gauge ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', alignItems: 'start' }}>

        {/* Live Call Monitor */}
        <div className="card" style={{ borderLeft: callActive ? '3px solid rgba(239,68,68,0.5)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Phone size={14} style={{ color: '#3b82f6' }} />
            <span className="card-title" style={{ marginBottom: 0 }}>Live Call Monitor</span>
            {callActive && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                <span className="pulse-dot" style={{ background: '#ef4444' }} />
                LIVE
              </div>
            )}
          </div>

          {/* Call info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {[
              { k: 'CALLER',   v: callActive ? 'Rahul Sharma – CEO' : '—' },
              { k: 'NUMBER',   v: callActive ? '+91 11 2345 6789' : '—' },
              { k: 'SOURCE',   v: callActive ? 'Enterprise VoIP' : '—' },
              { k: 'DURATION', v: callActive ? fmt(callTimer) : '—' },
            ].map(({ k, v }) => (
              <div key={k} style={{
                padding: '8px 10px',
                borderRadius: '6px',
                background: callActive ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '3px' }}>{k}</div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', fontFamily: k === 'DURATION' || k === 'NUMBER' ? 'JetBrains Mono, monospace' : undefined }}>
                  {k === 'DURATION' && callActive ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} style={{ color: '#22c55e' }} />{v}
                    </span>
                  ) : v}
                </div>
              </div>
            ))}
          </div>

          {/* Analysis progress */}
          {(analysisRunning || result) && (
            <AnalysisProgress running={analysisRunning} onComplete={onAnalysisDone} />
          )}

          {/* Signal scores after result */}
          {result && !analysisRunning && (
            <div style={{ marginTop: '10px' }} className="fade-in">
              <div className="section-label">AI Signal Scores</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { label: 'Anti-Spoofing',       score: result.anti_spoofing.spoof_probability,       color: '#ef4444' },
                  { label: 'Speaker Verification', score: 100 - result.speaker_verification.match_score, color: '#f59e0b' },
                  { label: 'Prosody Risk',         score: result.prosody_analysis.risk_score,             color: '#8b5cf6' },
                  { label: 'Context Risk',         score: result.context_intelligence.context_score,       color: '#06b6d4' },
                ].map(({ label, score, color }) => (
                  <div key={label} style={{ padding: '7px 10px', borderRadius: '6px', background: `${color}08`, border: `1px solid ${color}20` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'monospace' }}>{Math.round(score)}</span>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{ width: `${score}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>

              {result.risk_level === 'HIGH' && (
                <div className="alert-high-flash fade-in" style={{
                  marginTop: '8px', padding: '8px 12px', borderRadius: '6px',
                  border: '1px solid rgba(239,68,68,0.35)', textAlign: 'center',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
                    🚨 AI VOICE IMPERSONATION DETECTED
                  </span>
                  <span style={{ display: 'block', fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
                    Immediate action required · Transaction Hold Recommended
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!callActive && !result && (
            <div className="empty-state" style={{ padding: '16px' }}>
              <Phone size={28} className="empty-state-icon" />
              <div className="empty-state-title">No Active Call</div>
              <div className="empty-state-desc">Click SIMULATE CALL to test incoming call analysis</div>
            </div>
          )}
        </div>

        {/* Risk Gauge */}
        <div className="card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          borderLeft: result?.risk_level === 'HIGH' ? '3px solid rgba(239,68,68,0.5)' : '1px solid var(--border)',
        }}>
          <div className="card-title" style={{ marginBottom: '4px' }}>Risk Score</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>AI-Assisted Assessment</div>

          <RiskScoreGauge score={result?.risk_score ?? 0} level={result?.risk_level ?? 'LOW'} size={160} />

          <div style={{ width: '100%', marginTop: '10px' }}>
            {[
              { label: 'LOW',    range: '0 – 39',  color: '#22c55e' },
              { label: 'MEDIUM', range: '40 – 69', color: '#f59e0b' },
              { label: 'HIGH',   range: '70 – 100',color: '#ef4444' },
            ].map(({ label, range, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="badge" style={{
                  background: `${color}12`, color, border: `1px solid ${color}25`,
                  fontWeight: result?.risk_level === label ? 800 : 600,
                }}>{label}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{range}</span>
              </div>
            ))}
          </div>

          {result && (
            <div style={{ width: '100%', marginTop: '10px' }}>
              <div className="section-label" style={{ marginBottom: '6px' }}>Recommended Actions</div>
              {result.recommended_actions.slice(0, 3).map((a, i) => (
                <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                  <ChevronRight size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />{a}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: Alerts + Quick Nav ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px', alignItems: 'start' }}>

        {/* Recent Alerts */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div className="card-title" style={{ marginBottom: 0 }}>
              <AlertTriangle size={13} style={{ color: '#f59e0b' }} />
              Recent Alerts
            </div>
            <button className="btn btn-ghost" style={{ padding: '3px 10px', fontSize: '11px' }} onClick={() => navigate('/alerts')}>
              View All →
            </button>
          </div>
          {recentAlerts.length === 0 ? (
            <div className="empty-state" style={{ padding: '16px' }}>
              <div className="empty-state-title">No alerts</div>
              <div className="empty-state-desc">Simulate a call scenario to generate security events</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {recentAlerts.map(a => (
                <div key={a.id} className={`alert-row ${a.risk_level.toLowerCase()}`}
                  onClick={() => navigate('/alerts')}>
                  <div style={{ fontSize: '14px', flexShrink: 0 }}>
                    {a.risk_level === 'HIGH' ? '🚨' : a.risk_level === 'MEDIUM' ? '⚠️' : '✅'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {a.caller_number} · Risk: <span style={{ color: riskColor(a.risk_level), fontWeight: 600 }}>{a.risk_score}</span>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span className={`badge badge-${a.risk_level.toLowerCase()}`}>{a.risk_level}</span>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{timeAgo(a.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Nav */}
        <div className="card">
          <div className="card-title">Quick Access</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {[
              { label: 'Live Call',     path: '/live-call',      color: '#3b82f6', icon: <Phone size={13}/> },
              { label: 'Voice Analysis',path: '/voice-analysis', color: '#8b5cf6', icon: <Activity size={13}/> },
              { label: 'Risk Engine',   path: '/risk-engine',    color: '#f59e0b', icon: <Zap size={13}/> },
              { label: 'Audit Ledger',  path: '/audit',          color: '#06b6d4', icon: <Shield size={13}/> },
            ].map(({ label, path, color, icon }) => (
              <button key={path} onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '7px 10px', borderRadius: '6px', cursor: 'pointer',
                  background: `${color}0d`, border: `1px solid ${color}22`,
                  color, fontSize: '12px', fontWeight: 500, textAlign: 'left',
                  transition: 'background 0.15s',
                }}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 4: Risk Activity Chart ── */}
      {chartData.length > 0 && (
        <div className="chart-card">
          <div className="chart-title">
            <BarChart2 size={13} style={{ color: '#3b82f6' }} />
            Risk Activity – Last 7 Days
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip
                contentStyle={{ background: '#0f1526', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px' }}
                labelStyle={{ color: 'var(--text-primary)' }}
              />
              <Bar dataKey="low"    name="Low"    fill="#22c55e" stackId="a" />
              <Bar dataKey="medium" name="Medium" fill="#f59e0b" stackId="a" />
              <Bar dataKey="high"   name="High"   fill="#ef4444" stackId="a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
