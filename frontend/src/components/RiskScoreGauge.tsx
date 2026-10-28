import React from 'react';
import type { RiskLevel } from '../types';

interface RiskScoreGaugeProps {
  score: number;
  level: RiskLevel;
  size?: number;
  animated?: boolean;
}

const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

export default function RiskScoreGauge({ score, level, size = 200, animated = true }: RiskScoreGaugeProps) {
  const color = RISK_COLORS[level];
  const radius = (size / 2) - 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="score-ring">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(99,179,237,0.08)"
            strokeWidth={12}
          />
          {/* Score ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: animated ? 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          />
          {/* Tick marks */}
          {[0, 39, 69, 100].map((tick) => {
            const angle = ((tick / 100) * 360 - 90) * (Math.PI / 180);
            const x1 = size / 2 + (radius - 8) * Math.cos(angle);
            const y1 = size / 2 + (radius - 8) * Math.sin(angle);
            const x2 = size / 2 + (radius + 2) * Math.cos(angle);
            const y2 = size / 2 + (radius + 2) * Math.sin(angle);
            return (
              <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(99,179,237,0.3)" strokeWidth={2} />
            );
          })}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-black mono" style={{ color, lineHeight: 1 }}>
            {Math.round(score)}
          </div>
          <div className="text-xs text-slate-400 mt-1">/ 100</div>
          <div
            className={`mt-2 px-3 py-1 rounded-full text-xs font-bold tracking-wider ${level === 'HIGH' ? 'risk-badge-high' : level === 'MEDIUM' ? 'risk-badge-medium' : 'risk-badge-low'}`}
          >
            {level} RISK
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs">
        <span style={{ color: '#22c55e' }}>● LOW (0–39)</span>
        <span style={{ color: '#f59e0b' }}>● MED (40–69)</span>
        <span style={{ color: '#ef4444' }}>● HIGH (70+)</span>
      </div>
    </div>
  );
}
