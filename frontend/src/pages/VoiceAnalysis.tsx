import React, { useState, useRef, useCallback } from 'react';
import { Mic, Upload, Square, Brain, Wand2, FileAudio, Shield, Activity, Zap, CheckCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';
import RiskScoreGauge from '../components/RiskScoreGauge';
import AnalysisProgress from '../components/AnalysisProgress';
import LiveWaveform from '../components/LiveWaveform';
import { useToast } from '../components/Toast';
import { runDemoAnalysis, analyzeAudio } from '../services/api';
import type { AnalysisResult } from '../types';

const DEMO_SCENARIOS = [
  { id: 'normal',     label: 'Normal Executive Call',  desc: 'Legitimate business call',     color: '#22c55e', expected: 18 },
  { id: 'suspicious', label: 'Suspicious Voice Call',  desc: 'Moderate risk indicators',    color: '#f59e0b', expected: 61 },
  { id: 'high_risk',  label: 'AI Voice Fraud Attempt', desc: 'Synthetic voice detected',     color: '#ef4444', expected: 91 },
] as const;

type ScenarioId = typeof DEMO_SCENARIOS[number]['id'];

function ScoreBar({ label, score, color, icon }: { label: string; score: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ padding: '8px 10px', borderRadius: '6px', background: `${color}08`, border: `1px solid ${color}18` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span style={{ color }}>{icon}</span>{label}
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'monospace' }}>{Math.round(score)}</span>
      </div>
      <div className="prog-track">
        <div className="prog-fill" style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: color }} />
      </div>
    </div>
  );
}

export default function VoiceAnalysis() {
  const [tab, setTab] = useState<'demo' | 'record' | 'upload'>('demo');
  const [scenario, setScenario] = useState<ScenarioId>('high_risk');
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [mr, setMr] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const { showToast, ToastContainer } = useToast();

  const startRec = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start(); setMr(rec); setRecording(true); setRecSecs(0); setAudioBlob(null); setAudioUrl(null);
      timerRef.current = setInterval(() => setRecSecs(s => s + 1), 1000);
    } catch (e: any) {
      showToast(e.name === 'NotAllowedError' ? 'Microphone access denied' : `Mic error: ${e.message}`, 'error');
    }
  }, [showToast]);

  const stopRec = () => { mr?.stop(); setRecording(false); clearInterval(timerRef.current); };

  const analyze = async (file?: File, blob?: Blob, sc?: ScenarioId) => {
    setRunning(true); setResult(null);
    try {
      if (file || blob) {
        const f = file || new File([blob!], 'recording.webm', { type: 'audio/webm' });
        const r = await analyzeAudio(f);
        setResult(r.data);
      } else {
        const r = await runDemoAnalysis({ scenario: sc!, caller_name: 'Simulated Caller', caller_number: '+91 11 2345 6789', call_source: 'VoIP' });
        setResult(r.data);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Analysis request failed – please verify backend connection.';
      showToast(msg, 'error');
      setRunning(false);
    }
  };

  const onDone = () => setRunning(false);

  const radarData = result ? [
    { subject: 'Spoof', v: result.anti_spoofing?.spoof_probability ?? 0 },
    { subject: 'Speaker', v: 100 - (result.speaker_verification?.match_score ?? 50) },
    { subject: 'Prosody', v: result.prosody_analysis?.risk_score ?? 0 },
    { subject: 'Context', v: result.context_intelligence?.context_score ?? 0 },
    { subject: 'Confidence', v: result.anti_spoofing?.confidence ?? 0 },
  ] : [];

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><Brain size={18} style={{ color: '#8b5cf6' }} />AI Voice Intelligence</h1>
          <p>Analyze audio for synthetic speech, speaker identity, and prosodic anomalies</p>
        </div>
      </div>

      <div className="info-strip">
        <Brain size={13} />
        Voice Intelligence Engine · Acoustic artifact analysis, biometric verification, and dynamic risk fusion
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { id: 'demo',   label: 'Security Scenarios', icon: <Wand2 size={13}/> },
          { id: 'record', label: 'Record Audio',       icon: <Mic size={13}/> },
          { id: 'upload', label: 'Upload File',        icon: <Upload size={13}/> },
        ].map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id as any)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab: Security Scenarios */}
      {tab === 'demo' && (
        <div className="card">
          <div className="card-title">Select Scenario</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
            {DEMO_SCENARIOS.map(s => (
              <button key={s.id} onClick={() => setScenario(s.id)}
                style={{
                  padding: '10px 12px', borderRadius: '7px', textAlign: 'left', cursor: 'pointer',
                  background: scenario === s.id ? `${s.color}10` : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${scenario === s.id ? s.color : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: s.color, marginBottom: '3px' }}>{s.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{s.desc}</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: s.color, fontFamily: 'monospace' }}>~{s.expected}</div>
              </button>
            ))}
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => analyze(undefined, undefined, scenario)} disabled={running}>
            <Brain size={13} />
            {running ? 'Analyzing...' : 'Run AI Voice Analysis'}
          </button>
        </div>
      )}

      {/* Tab: Record */}
      {tab === 'record' && (
        <div className="card">
          <div className="card-title">Record Voice Sample</div>
          <div style={{ marginBottom: '10px' }}>
            <LiveWaveform active={recording} height={60} />
          </div>
          {recording && (
            <div style={{ textAlign: 'center', fontSize: '12px', fontFamily: 'monospace', color: '#ef4444', marginBottom: '8px' }}>
              ● REC {fmt(recSecs)}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            {!recording ? (
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={startRec}>
                <Mic size={13} />Start Recording
              </button>
            ) : (
              <button className="btn btn-warning" style={{ flex: 1 }} onClick={stopRec}>
                <Square size={13} />Stop Recording
              </button>
            )}
          </div>
          {audioUrl && (
            <>
              <audio controls src={audioUrl} style={{ width: '100%', marginBottom: '8px', filter: 'invert(1) hue-rotate(180deg)' }} />
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => analyze(undefined, audioBlob!)} disabled={running}>
                <Brain size={13} />Analyze Recording
              </button>
            </>
          )}
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            ℹ Recordings are processed in-memory and governed by the active privacy retention policy
          </div>
        </div>
      )}

      {/* Tab: Upload */}
      {tab === 'upload' && (
        <div className="card">
          <div className="card-title">Upload Audio File</div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border-strong)', borderRadius: '8px',
              padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px',
              background: 'rgba(255,255,255,0.01)', transition: 'border-color 0.15s',
            }}
          >
            <FileAudio size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Drop audio file or click to browse
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>WAV · MP3 · M4A · OGG (Max 25MB)</div>
            <input ref={fileRef} type="file" accept=".wav,.mp3,.m4a,.ogg,.webm" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) { setUploadFile(f); setResult(null); }
              }} />
          </div>
          {uploadFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '8px' }}>
              <FileAudio size={16} style={{ color: '#3b82f6' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{uploadFile.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(uploadFile.size / 1024).toFixed(1)} KB</div>
              </div>
              <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => analyze(uploadFile)} disabled={running}>
                Analyze
              </button>
            </div>
          )}
          {!uploadFile && (
            <div className="empty-state" style={{ padding: '12px' }}>
              <div className="empty-state-desc">Select an audio file above to begin analysis</div>
            </div>
          )}
        </div>
      )}

      {/* Analysis progress */}
      {running && (
        <div className="card">
          <AnalysisProgress running={running} onComplete={onDone} />
        </div>
      )}

      {/* Results */}
      {result && !running && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 2×2 signal cards + gauge */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '10px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="card">
                <div className="card-title"><Shield size={13} style={{ color: '#ef4444' }} />Anti-Spoofing</div>
                <ScoreBar label="Synthetic Prob." score={result.anti_spoofing?.spoof_probability ?? 0} color="#ef4444" icon={<Shield size={11}/>} />
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>{result.anti_spoofing?.explanation}</div>
                {(result.anti_spoofing?.artifacts?.length ?? 0) > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {result.anti_spoofing.artifacts.slice(0, 3).map((a, i) => (
                      <span key={i} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>{a}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="card-title"><Activity size={13} style={{ color: '#f59e0b' }} />Speaker Verification</div>
                <ScoreBar label="Speaker Match" score={result.speaker_verification?.match_score ?? 0} color="#f59e0b" icon={<Activity size={11}/>} />
                <div style={{ marginTop: '6px' }} className="kv-row">
                  <span className="kv-label">Expected</span>
                  <span className="kv-value">{result.speaker_verification?.expected_speaker || 'Registered Speaker'}</span>
                </div>
                <div className="kv-row">
                  <span className="kv-label">Status</span>
                  <span className="kv-value" style={{ color: '#f59e0b' }}>{(result.speaker_verification?.result_label || 'NORMAL').replace(/_/g, ' ')}</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>{result.speaker_verification?.explanation}</div>
              </div>

              <div className="card">
                <div className="card-title"><Zap size={13} style={{ color: '#8b5cf6' }} />Prosody Analysis</div>
                <ScoreBar label="Prosody Risk" score={result.prosody_analysis?.risk_score ?? 0} color="#8b5cf6" icon={<Zap size={11}/>} />
                <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(result.prosody_analysis?.anomalies ?? []).map((a, i) => (
                    <span key={i} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>{a}</span>
                  ))}
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>{result.prosody_analysis?.explanation}</div>
              </div>

              <div className="card">
                <div className="card-title"><Brain size={13} style={{ color: '#06b6d4' }} />Context Risk</div>
                <ScoreBar label="Context Score" score={result.context_intelligence?.context_score ?? 0} color="#06b6d4" icon={<Brain size={11}/>} />
                <div style={{ marginTop: '6px' }}>
                  <div className="section-label">Indicators</div>
                  {(result.context_intelligence?.indicators ?? []).map((ind, i) => (
                    <div key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '5px', padding: '2px 0' }}>
                      <span style={{ color: '#06b6d4' }}>⚑</span>{ind}
                    </div>
                  ))}
                  {(result.context_intelligence?.indicators?.length ?? 0) === 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No behavioral anomalies detected</div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: gauge + radar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <RiskScoreGauge score={result.risk_score} level={result.risk_level} size={150} />
              </div>
              <div className="card">
                <div className="card-title">Signal Radar</div>
                <ResponsiveContainer width="100%" height={160}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} />
                    <Radar name="Risk" dataKey="v" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Analysis timeline */}
          <div className="card">
            <div className="card-title">Analysis Timeline</div>
            <div className="pipeline">
              {['Audio Captured', 'Preprocessed', 'Anti-Spoofing', 'Speaker Verification', 'Prosody', 'Risk Fusion', 'Complete'].map((s, i, arr) => (
                <React.Fragment key={s}>
                  <div className="pipeline-step done">
                    <CheckCircle size={11} />{s}
                  </div>
                  {i < arr.length - 1 && <span className="pipeline-arrow">→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
