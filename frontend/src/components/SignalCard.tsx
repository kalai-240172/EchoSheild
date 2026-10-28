import React from 'react';
import type { RiskLevel } from '../types';

interface SignalCardProps {
  title: string;
  score: number;
  status: string;
  explanation: string;
  icon: React.ReactNode;
  level?: RiskLevel;
  artifacts?: string[];
  infoText?: string;
}

const levelColor = (score: number) => {
  if (score >= 70) return { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
  if (score >= 40) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' };
  return { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' };
};

export default function SignalCard({
  title, score, status, explanation, icon, artifacts = [], infoText
}: SignalCardProps) {
  const { color, bg, border } = levelColor(score);
  const [showInfo, setShowInfo] = React.useState(false);

  return (
    <div className="glass-card p-4 relative" style={{ border: `1px solid ${border}`, background: bg }}>
      {infoText && (
        <button
          className="absolute top-3 right-3 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center hover:opacity-80 transition-opacity"
          style={{ background: 'rgba(99,179,237,0.2)', color: '#94a3b8', border: '1px solid rgba(99,179,237,0.3)' }}
          onClick={() => setShowInfo(!showInfo)}
          title="How it works?"
        >
          ?
        </button>
      )}

      {showInfo && infoText && (
        <div className="absolute top-8 right-3 z-20 w-64 p-3 rounded-lg text-xs leading-relaxed"
          style={{ background: '#1e293b', border: '1px solid rgba(99,179,237,0.3)', color: '#94a3b8' }}>
          <div className="font-semibold text-white mb-1">How it works?</div>
          {infoText}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs font-mono mt-0.5" style={{ color }}>{status}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-black mono" style={{ color }}>{Math.round(score)}</div>
          <div className="text-xs" style={{ color: '#64748b' }}>/ 100</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-2">
        <div
          className="progress-fill"
          style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }}
        />
      </div>

      <p className="text-xs leading-relaxed" style={{ color: '#94a3b8' }}>{explanation}</p>

      {artifacts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {artifacts.map((a, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded font-medium"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
