import React, { useState, useEffect, useCallback } from 'react';
import { Settings as Gear, Save, Info, Bell, Lock, Sliders, Cpu, RefreshCw, AlertCircle } from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';
import type { Settings } from '../types';
import { useToast } from '../components/Toast';

const TABS = [
  { id: 'risk',    label: 'Risk Thresholds',   icon: <Sliders size={13}/> },
  { id: 'weights', label: 'Detection Weights', icon: <Cpu size={13}/> },
  { id: 'notif',   label: 'Notifications',     icon: <Bell size={13}/> },
  { id: 'privacy', label: 'Privacy & Security',icon: <Lock size={13}/> },
] as const;

type TabId = typeof TABS[number]['id'];

function ToggleRow({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="settings-row">
      <div>
        <div className="settings-row-label">{label}</div>
        {desc && <div className="settings-row-desc">{desc}</div>}
      </div>
      <button className={`toggle${value ? ' on' : ''}`} onClick={() => onChange(!value)} />
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('risk');
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSettings();
      setS(res.data);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      setError(err?.response?.data?.detail || err?.message || 'Failed to load system settings from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const upd = (key: keyof Settings, value: any) => setS(prev => prev ? { ...prev, [key]: value } : prev);

  const save = async () => {
    if (!s) return;

    // Validate weights sum
    const totalWeight = s.weight_anti_spoofing + s.weight_speaker_verification + s.weight_prosody + s.weight_context;
    if (Math.abs(totalWeight - 100) > 2) {
      showToast(`Detection weights must equal 100% (currently ${Math.round(totalWeight)}%)`, 'error');
      return;
    }

    if (s.low_threshold >= s.medium_threshold) {
      showToast('Low threshold must be lower than medium threshold', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await updateSettings(s);
      if (res.data?.settings) {
        setS(res.data.settings);
      }
      showToast('Settings saved successfully', 'success');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to save settings. Check backend connection.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // State 1: Loading
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="page-header">
          <div className="page-header-left">
            <h1><Gear size={18} style={{ color: '#64748b' }} />System Settings</h1>
            <p>Loading configuration parameters...</p>
          </div>
        </div>
        <div className="card empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <RefreshCw size={24} className="spin" style={{ color: '#3b82f6', margin: '0 auto 12px auto' }} />
          <div className="empty-state-title">Loading configuration...</div>
          <div className="empty-state-desc">Fetching system settings from EchoShield backend</div>
        </div>
      </div>
    );
  }

  // State 2: Error with Retry
  if (error || !s) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="page-header">
          <div className="page-header-left">
            <h1><Gear size={18} style={{ color: '#ef4444' }} />System Settings</h1>
            <p>Failed to load configuration</p>
          </div>
        </div>
        <div className="card empty-state" style={{ padding: '48px 24px', textAlign: 'center', borderColor: 'rgba(239,68,68,0.3)' }}>
          <AlertCircle size={28} style={{ color: '#ef4444', margin: '0 auto 12px auto' }} />
          <div className="empty-state-title" style={{ color: '#ef4444' }}>Unable to load settings</div>
          <div className="empty-state-desc" style={{ marginBottom: '16px' }}>{error || 'No settings could be retrieved from the server.'}</div>
          <button className="btn btn-primary" onClick={loadSettings} style={{ margin: '0 auto' }}>
            <RefreshCw size={13} />Retry Loading
          </button>
        </div>
        <ToastContainer />
      </div>
    );
  }

  // State 3: Success / Form
  const totalWeight = s.weight_anti_spoofing + s.weight_speaker_verification + s.weight_prosody + s.weight_context;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1><Gear size={18} style={{ color: '#64748b' }} />System Settings</h1>
          <p>Configure detection thresholds, signal weights, notifications, and security policies</p>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={13} />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="info-strip">
        <Info size={13} />
        System Configuration · Settings are dynamically applied to the detection engine and saved to the database.
      </div>

      <div className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Risk Thresholds */}
      {tab === 'risk' && (
        <div className="card">
          <div className="card-title"><Sliders size={13} />Risk Thresholds</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
            {[
              { label: 'LOW Threshold',    key: 'low_threshold' as const,    desc: 'Scores below = LOW risk',    color: '#22c55e' },
              { label: 'MEDIUM Threshold', key: 'medium_threshold' as const, desc: 'Scores below = MEDIUM risk', color: '#f59e0b' },
              { label: 'HIGH Threshold',   key: 'high_threshold' as const,   desc: 'Scores above = HIGH risk',   color: '#ef4444' },
            ].map(({ label, key, desc, color }) => (
              <div key={key} style={{ padding: '12px', borderRadius: '7px', background: `${color}08`, border: `1px solid ${color}20` }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color, marginBottom: '6px' }}>{label}</div>
                <input type="number" min={0} max={100} value={s[key]} onChange={e => upd(key, Number(e.target.value))}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: '5px', background: 'var(--bg-input)', border: `1px solid ${color}30`, color, fontSize: '20px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}
                />
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{desc}</div>
              </div>
            ))}
          </div>
          {/* Visual range bar */}
          <div style={{ display: 'flex', height: '22px', borderRadius: '6px', overflow: 'hidden' }}>
            {[
              { pct: s.low_threshold,                                   color: '#22c55e', label: 'LOW' },
              { pct: Math.max(0, s.medium_threshold - s.low_threshold), color: '#f59e0b', label: 'MEDIUM' },
              { pct: Math.max(0, 100 - s.medium_threshold),             color: '#ef4444', label: 'HIGH' },
            ].map(({ pct, color, label }) => (
              <div key={label} style={{ flex: Math.max(pct, 4), background: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detection Weights */}
      {tab === 'weights' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div className="card-title" style={{ marginBottom: 0 }}><Cpu size={13} />Detection Weights</div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: Math.abs(totalWeight - 100) > 2 ? '#ef4444' : '#22c55e' }}>
              Total: {Math.round(totalWeight)}% {Math.abs(totalWeight - 100) > 2 && '⚠ Must equal 100%'}
            </span>
          </div>
          {[
            { label: 'Anti-Spoofing',        key: 'weight_anti_spoofing' as const,        color: '#ef4444', desc: 'Weight of synthetic speech detection' },
            { label: 'Speaker Verification',  key: 'weight_speaker_verification' as const, color: '#f59e0b', desc: 'Weight of speaker biometric matching' },
            { label: 'Prosody Analysis',      key: 'weight_prosody' as const,              color: '#8b5cf6', desc: 'Weight of speaking rhythm and intonation' },
            { label: 'Context Intelligence',  key: 'weight_context' as const,              color: '#06b6d4', desc: 'Weight of transaction and caller anomalies' },
          ].map(({ label, key, color, desc }) => (
            <div key={key} className="settings-row">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                  <span className="settings-row-label">{label}</span>
                </div>
                <div className="settings-row-desc">{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <input type="range" min={5} max={60} step={1} value={s[key]}
                    onChange={e => upd(key, Number(e.target.value))}
                    style={{ flex: 1, accentColor: color }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 700, color, fontFamily: 'monospace', minWidth: '40px' }}>{Math.round(s[key])}%</span>
                </div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--text-muted)', padding: '8px 10px', borderRadius: '5px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
            risk = {(s.weight_anti_spoofing / 100).toFixed(2)}·spoof + {(s.weight_speaker_verification / 100).toFixed(2)}·speaker + {(s.weight_prosody / 100).toFixed(2)}·prosody + {(s.weight_context / 100).toFixed(2)}·context
          </div>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notif' && (
        <div className="card">
          <div className="card-title"><Bell size={13} />Notification Channels</div>
          <ToggleRow label="Email Notifications" desc="Send automated threat digest emails on high-risk detections" value={s.email_notifications} onChange={v => upd('email_notifications', v)} />
          <ToggleRow label="SMS Critical Alerts" desc="Send instantaneous SMS for confirmed impersonation incidents" value={s.sms_notifications} onChange={v => upd('sms_notifications', v)} />
          <ToggleRow label="Security Webhook" desc="POST security event payload to enterprise SIEM/SOAR endpoint" value={s.webhook_notifications} onChange={v => upd('webhook_notifications', v)} />
          <ToggleRow label="In-App Banner Notifications" desc="Display toast and header counter for active alerts" value={s.in_app_notifications ?? true} onChange={v => upd('in_app_notifications', v)} />
        </div>
      )}

      {/* Privacy */}
      {tab === 'privacy' && (
        <div className="card">
          <div className="card-title"><Lock size={13} />Privacy & Data Governance</div>
          <ToggleRow label="Data Encryption at Rest" desc="Store all biometric features with cryptographic AES-256 protection" value={s.encryption_enabled} onChange={v => upd('encryption_enabled', v)} />
          <ToggleRow label="Tamper-Evident Audit Logging" desc="Append all risk evaluations to the SHA-256 hash-chained ledger" value={s.audit_logging} onChange={v => upd('audit_logging', v)} />
          <div className="settings-row">
            <div>
              <div className="settings-row-label">Audio Retention Policy</div>
              <div className="settings-row-desc">Raw audio discard timing to preserve caller privacy</div>
            </div>
            <select
              value={s.audio_retention}
              onChange={e => upd('audio_retention', e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '5px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '12px' }}
            >
              <option value="minimal">Minimal (Discard immediately after extraction)</option>
              <option value="7days">7 Days (Forensic buffer)</option>
              <option value="30days">30 Days (Compliance standard)</option>
            </select>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}
