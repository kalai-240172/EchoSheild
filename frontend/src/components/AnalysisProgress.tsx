import React, { useEffect, useState } from 'react';

interface AnalysisStage {
  label: string;
  duration: number; // ms
}

const STAGES: AnalysisStage[] = [
  { label: 'Audio Captured', duration: 600 },
  { label: 'Audio Preprocessing', duration: 800 },
  { label: 'Anti-Spoofing Analysis', duration: 1200 },
  { label: 'Speaker Verification', duration: 1000 },
  { label: 'Prosody Analysis', duration: 900 },
  { label: 'Context Analysis', duration: 700 },
  { label: 'Risk Fusion Engine', duration: 500 },
  { label: 'Security Action Generated', duration: 400 },
];

interface AnalysisProgressProps {
  running: boolean;
  onComplete: () => void;
}

export default function AnalysisProgress({ running, onComplete }: AnalysisProgressProps) {
  const [currentStage, setCurrentStage] = useState(-1);
  const [completed, setCompleted] = useState<number[]>([]);

  useEffect(() => {
    if (!running) {
      setCurrentStage(-1);
      setCompleted([]);
      return;
    }

    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const advance = () => {
      setCurrentStage(idx);
      timeout = setTimeout(() => {
        setCompleted(prev => [...prev, idx]);
        idx++;
        if (idx < STAGES.length) {
          advance();
        } else {
          setCurrentStage(-1);
          onComplete();
        }
      }, STAGES[idx].duration);
    };

    advance();
    return () => clearTimeout(timeout);
  }, [running]);

  const totalProgress = completed.length === STAGES.length ? 100
    : Math.round((completed.length / STAGES.length) * 100);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-semibold text-white">AI Analysis Pipeline</div>
        <div className="text-xs font-mono" style={{ color: '#3b82f6' }}>
          {running || completed.length > 0 ? `${totalProgress}%` : '—'}
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-5">
        <div
          className="progress-fill"
          style={{
            width: `${totalProgress}%`,
            background: 'linear-gradient(90deg, #2563eb, #06b6d4)',
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {STAGES.map((stage, i) => {
          const isDone = completed.includes(i);
          const isActive = currentStage === i;

          return (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{
                  background: isDone ? 'rgba(34,197,94,0.2)' : isActive ? 'rgba(59,130,246,0.2)' : 'rgba(71,85,105,0.2)',
                  border: `1px solid ${isDone ? '#22c55e' : isActive ? '#3b82f6' : '#475569'}`,
                  color: isDone ? '#22c55e' : isActive ? '#3b82f6' : '#475569',
                }}>
                {isDone ? '✓' : isActive ? '…' : i + 1}
              </div>
              <span className={isDone ? 'stage-complete' : isActive ? 'stage-active' : 'stage-pending'}>
                {stage.label}
              </span>
              {isActive && (
                <div className="ml-auto flex gap-1">
                  {[...Array(8)].map((_, j) => (
                    <div key={j} className="waveform-bar" style={{ animationDelay: `${j * 0.1}s` }} />
                  ))}
                </div>
              )}
              {isDone && (
                <div className="ml-auto text-xs" style={{ color: '#22c55e' }}>Complete</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs" style={{ color: '#64748b' }}>
        🔬 AI Voice Analysis Engine · Real-Time Verification
      </div>
    </div>
  );
}
