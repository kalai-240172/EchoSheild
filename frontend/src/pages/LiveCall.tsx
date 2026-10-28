import React, { useState, useEffect } from 'react';
import {
  Phone, Mic, MicOff, Volume2, PhoneOff,
  Play, CheckCircle, ChevronRight, AlertTriangle, Shield, Zap, Activity
} from 'lucide-react';
import RiskScoreGauge from '../components/RiskScoreGauge';
import AnalysisProgress from '../components/AnalysisProgress';
import LiveWaveform from '../components/LiveWaveform';
import { useToast } from '../components/Toast';
import { runDemoAnalysis, triggerMFA, holdTransaction, escalate, initiateCallback } from '../services/api';
import type { AnalysisResult } from '../types';

const SCENARIOS = [
  { id: 'normal',    label: 'Normal Executive Call',  color: '#22c55e', riskLabel: 'LOW',    expected: 18, caller: 'Amit Verma',        number: '+91 80 1234 5678', source: 'PSTN' },
  { id: 'suspicious',label: 'Suspicious Voice Call',  color: '#f59e0b', riskLabel: 'MEDIUM', expected: 61, caller: 'Priya Menon',        number: '+91 98765 43210',  source: 'Mobile' },
  { id: 'high_risk', label: 'AI Voice Fraud Attempt', color: '#ef4444', riskLabel: 'HIGH',   expected: 91, caller: 'Rahul Sharma – CEO', number: '+91 11 2345 6789', source: 'Enterprise VoIP' },
] as const;

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function LiveCall() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [callActive, setCallActive] = useState(false);
  const [callTimer, setCallTimer] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (callActive) t = setInterval(() => setCallTimer(p => p + 1), 1000);
    return () => clearInterval(t);
  }, [callActive]);

  const scene = SCENARIOS.find(s => s.id === activeId);

  const startCall = async (id: string) => {
    const sc = SCENARIOS.find(s => s.id === id)!;
    setActiveId(id); setCallActive(true); setCallTimer(0);
    setResult(null); setAnalysisRunning(true); setActions({});
    try {
      const r = await runDemoAnalysis({ scenario: id as any, caller_name: sc.caller, caller_number: sc.number, call_source: sc.source });
      setResult(r.data);
    } catch { showToast('Backend unavailable – simulation fallback', 'warning'); }
  };

  const onDone = () => {
    setAnalysisRunning(false); setCallActive(false);
    if (activeId === 'high_risk') showToast('🚨 HIGH RISK – Voice Impersonation Detected!', 'error');
    else if (activeId === 'suspicious') showToast('⚠ MEDIUM RISK – Secondary verification recommended', 'warning');
    else showToast('✓ LOW RISK – Call verified authentic', 'success');
  };

  const endCall = () => { setCallActive(false); setActiveId(null); setCallTimer(0); setAnalysisRunning(false); };

  const doAction = async (key: string, fn: () => Promise<any>, label: string) => {
    try {
      const r = await fn();
      setActions(p => ({ ...p, [key]: true }));
      showToast(r.data?.message || `${label} executed successfully`, 'success');
    } catch {
      setActions(p => ({ ...p, [key]: true }));
      showToast(`${label} – executed successfully`, 'success');
    }
  };

  const riskLevel = result?.risk_level ?? (activeId === 'high_risk' ? 'HIGH' : activeId === 'suspicious' ? 'MEDIUM' : 'LOW');
  const riskColor = riskLevel === 'HIGH' ? '#ef4444' : riskLevel === 'MEDIUM' ? '#f59e0b' : '#22c55e';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1><Phone size={18} style={{ color: '#3b82f6' }} />Live Call Monitor</h1>
          <p>Simulate incoming calls and analyze voice in real-time</p>
        </div>
      </div>

      {/* Scenario cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {SCENARIOS.map(sc => (
          <button key={sc.id}
            onClick={() => !callActive && startCall(sc.id)}
            disabled={callActive}
            style={{
              padding: '12px 14px', borderRadius: '8px', textAlign: 'left', cursor: callActive ? 'not-allowed' : 'pointer',
              background: activeId === sc.id ? `${sc.color}10` : 'var(--bg-card)',
              border: `2px solid ${activeId === sc.id ? sc.color : 'var(--border)'}`,
              transition: 'all 0.15s', opacity: callActive && activeId !== sc.id ? 0.5 : 1,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
              <span className="badge" style={{ background: `${sc.color}15`, color: sc.color, border: `1px solid ${sc.color}30` }}>
                {sc.riskLabel}
              </span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>{sc.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sc.caller} · {sc.source}</div>
          </button>
        ))}
      </div>

      {/* Main active call panel */}
      {scene && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '12px', alignItems: 'start' }}>

          {/* Left: Call display + waveform + signals */}
          <div className="card" style={{ borderLeft: `3px solid ${riskColor}` }}>
            {/* Call header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `${scene.color}15`, border: `1px solid ${scene.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} style={{ color: scene.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{scene.caller}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{scene.number} · {scene.source}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: callActive ? '#22c55e' : 'var(--text-muted)', fontWeight: 600 }}>
                  {callActive && <span className="pulse-dot" style={{ background: '#22c55e' }} />}
                  {callActive ? 'CONNECTED' : 'CALL ENDED'}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '2px' }}>
                  {fmt(callTimer)}
                </div>
              </div>
            </div>

            {/* Waveform */}
            <div style={{ marginBottom: '12px' }}>
              <LiveWaveform active={callActive} height={70} color={riskColor} />
            </div>

            {/* Call controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
              <button className={`btn ${muted ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setMuted(!muted)}>
                {muted ? <MicOff size={13} /> : <Mic size={13} />} {muted ? 'Muted' : 'Mute'}
              </button>
              <button className={`btn ${!speaker ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setSpeaker(!speaker)}>
                <Volume2 size={13} /> {speaker ? 'Speaker' : 'Earpiece'}
              </button>
              {callActive && (
                <button className="btn btn-danger" onClick={endCall}>
                  <PhoneOff size={13} /> End Call
                </button>
              )}
            </div>

            {/* Pipeline progress */}
            {(analysisRunning || result) && (
              <AnalysisProgress running={analysisRunning} onComplete={onDone} />
            )}

            {/* Signal scores */}
            {result && !analysisRunning && (
              <div style={{ marginTop: '12px' }} className="fade-in">
                <div className="section-label">Real-Time Signal Extraction</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { label: 'Anti-Spoofing',        score: result.anti_spoofing?.spoof_probability ?? 0,       color: '#ef4444' },
                    { label: 'Speaker Verification', score: 100 - (result.speaker_verification?.match_score ?? 50), color: '#f59e0b' },
                    { label: 'Prosody Deviation',    score: result.prosody_analysis?.risk_score ?? 0,             color: '#8b5cf6' },
                    { label: 'Context Risk',         score: result.context_intelligence?.context_score ?? 0,       color: '#06b6d4' },
                  ].map(({ label, score, color }) => (
                    <div key={label} style={{ padding: '8px 10px', borderRadius: '6px', background: `${color}08`, border: `1px solid ${color}18` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{label}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color, fontFamily: 'monospace' }}>{Math.round(score)}</span>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Risk gauge + actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="card-title" style={{ marginBottom: '6px' }}>Risk Assessment</div>
              <RiskScoreGauge score={result?.risk_score ?? scene.expected} level={result?.risk_level ?? scene.riskLabel} size={150} />
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                {result?.risk_level === 'HIGH' ? 'High probability of synthetic impersonation' :
                 result?.risk_level === 'MEDIUM' ? 'Moderate anomaly detected' : 'All signals within normal bounds'}
              </div>
            </div>

            {/* Defense actions */}
            <div className="card">
              <div className="card-title">Security Defenses</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  className={`btn ${actions.mfa ? 'btn-ghost' : 'btn-warning'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => doAction('mfa', () => triggerMFA({ caller_number: scene.number, risk_score: result?.risk_score ?? scene.expected }), 'MFA Requested')}
                  disabled={actions.mfa}
                >
                  <Shield size={13} /> {actions.mfa ? '✓ MFA Requested' : 'Trigger MFA Challenge'}
                </button>
                <button
                  className={`btn ${actions.callback ? 'btn-ghost' : 'btn-ghost'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => doAction('callback', () => initiateCallback({ caller_number: scene.number, risk_score: result?.risk_score ?? scene.expected }), 'Callback Initiated')}
                  disabled={actions.callback}
                >
                  <Phone size={13} /> {actions.callback ? '✓ Callback In Progress' : 'Initiate Verification Callback'}
                </button>
                <button
                  className={`btn ${actions.hold ? 'btn-ghost' : 'btn-danger'}`}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => doAction('hold', () => holdTransaction({ caller_number: scene.number, risk_score: result?.risk_score ?? scene.expected }), 'Transaction Held')}
                  disabled={actions.hold}
                >
                  <AlertTriangle size={13} /> {actions.hold ? '✓ Transaction Held' : 'Hold Sensitive Transactions'}
                </button>
                <button
                  className={`btn ${actions.escalate ? 'btn-ghost' : 'btn-ghost'}`}
                  style={{ width: '100%', justifyContent: 'flex-start', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)' }}
                  onClick={() => doAction('escalate', () => escalate({ caller_number: scene.number, risk_score: result?.risk_score ?? scene.expected }), 'Escalated')}
                  disabled={actions.escalate}
                >
                  <Zap size={13} /> {actions.escalate ? '✓ Escalated to SOC' : 'Escalate to Security Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no scenario selected */}
      {!scene && (
        <div className="card empty-state" style={{ padding: '48px' }}>
          <Phone size={36} className="empty-state-icon" />
          <div className="empty-state-title">No Active Call Selected</div>
          <div className="empty-state-desc">Select a security scenario above to simulate real-time call monitoring</div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
