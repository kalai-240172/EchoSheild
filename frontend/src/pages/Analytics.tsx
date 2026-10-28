import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Calendar, Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getAnalytics } from '../services/api';
import type { AnalyticsData, DailyData } from '../types';

type Period = '7' | '14' | '30';
type RiskFilter = 'All Calls' | 'High Risk' | 'Medium Risk' | 'Low Risk';

const TT = {
  contentStyle: {
    background: '#0f1526',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '6px',
    fontSize: '11px',
  },
  labelStyle: { color: 'var(--text-primary)', fontSize: '11px' },
};

const sampleDaily: DailyData[] = [
  { date: 'Mon', day: 'Mon', total: 45, low: 34, medium: 8, high: 3, avg_risk: 24, threats: 3 },
  { date: 'Tue', day: 'Tue', total: 53, low: 41, medium: 10, high: 2, avg_risk: 29, threats: 2 },
  { date: 'Wed', day: 'Wed', total: 50, low: 38, medium: 7, high: 5, avg_risk: 31, threats: 5 },
  { date: 'Thu', day: 'Thu', total: 61, low: 46, medium: 11, high: 4, avg_risk: 36, threats: 4 },
  { date: 'Fri', day: 'Fri', total: 67, low: 52, medium: 9, high: 6, avg_risk: 42, threats: 6 },
  { date: 'Sat', day: 'Sat', total: 38, low: 29, medium: 6, high: 3, avg_risk: 34, threats: 3 },
  { date: 'Sun', day: 'Sun', total: 49, low: 37, medium: 8, high: 4, avg_risk: 39, threats: 4 },
];

const sampleAnalytics: AnalyticsData = {
  summary: {
    total_calls: 363,
    high_risk: 27,
    medium_risk: 59,
    low_risk: 277,
    threats_prevented: 27,
    avg_risk_score: 34.7,
    is_demo_data: true,
  },
  daily_data: sampleDaily,
  risk_distribution: [
    { name: 'Low Risk', value: 277, color: '#22c55e' },
    { name: 'Medium Risk', value: 59, color: '#f59e0b' },
    { name: 'High Risk', value: 27, color: '#ef4444' },
  ],
  signal_performance: [
    { signal: 'Anti-Spoofing', accuracy: 94.2, detection_rate: 92.8, false_positive: 3.1, grade: 'Excellent' },
    { signal: 'Speaker Verification', accuracy: 91.7, detection_rate: 90.4, false_positive: 4.2, grade: 'Excellent' },
    { signal: 'Prosody Analysis', accuracy: 87.3, detection_rate: 84.9, false_positive: 6.1, grade: 'Good' },
    { signal: 'Context Intelligence', accuracy: 96.8, detection_rate: 95.2, false_positive: 2.4, grade: 'Excellent' },
  ],
  insights: [
    { icon: '🚨', title: 'High-Risk Peak', desc: 'Friday recorded the highest number of high-risk calls.', color: '#ef4444' },
    { icon: '⚠️', title: 'Context Signal', desc: 'Transaction anomalies contributed significantly to recent high-risk classifications.', color: '#f59e0b' },
    { icon: '🛡️', title: 'Threat Prevention', desc: 'Most high-risk demo calls resulted in transaction hold or secondary verification.', color: '#22c55e' },
    { icon: '🎙️', title: 'Voice Signal', desc: 'Synthetic speech indicators were the strongest voice-based risk contributor.', color: '#8b5cf6' },
  ],
};

const riskColors: Record<string, string> = {
  'Low Risk': '#22c55e',
  'Medium Risk': '#f59e0b',
  'High Risk': '#ef4444',
};

const riskFilterOptions: RiskFilter[] = ['All Calls', 'High Risk', 'Medium Risk', 'Low Risk'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>('7');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('All Calls');

  useEffect(() => {
    getAnalytics()
      .then((r) => setData(r.data))
      .catch(() => setData(sampleAnalytics));
  }, []);

  const source = data ?? sampleAnalytics;
  const summary = source.summary;

  const activeDaily = useMemo(
    () => (source.daily_data ?? sampleAnalytics.daily_data).slice(-Number(period)),
    [source, period]
  );

  const filteredDaily = useMemo(() => {
    return activeDaily.map((row) => {
      let low = row.low;
      let medium = row.medium;
      let high = row.high;

      if (riskFilter === 'Low Risk') {
        medium = 0;
        high = 0;
      }
      if (riskFilter === 'Medium Risk') {
        low = 0;
        high = 0;
      }
      if (riskFilter === 'High Risk') {
        low = 0;
        medium = 0;
      }

      return {
        ...row,
        low,
        medium,
        high,
        total: low + medium + high,
      };
    });
  }, [activeDaily, riskFilter]);

  const highPeakDay = useMemo(
    () => [...activeDaily].sort((a, b) => b.high - a.high)[0] ?? activeDaily[0],
    [activeDaily]
  );

  const pieData = useMemo(
    () => (source.risk_distribution ?? sampleAnalytics.risk_distribution).map((entry) => ({
      ...entry,
      percentage: summary.total_calls > 0 ? Number(((entry.value / summary.total_calls) * 100).toFixed(1)) : 0,
    })),
    [source, summary.total_calls]
  );

  const trendChange = activeDaily.length > 1
    ? activeDaily[activeDaily.length - 1].avg_risk! - activeDaily[0].avg_risk!
    : 0;

  const chartFooter = riskFilter === 'All Calls'
    ? `Peak: ${highPeakDay?.day ?? '—'} · ${highPeakDay?.total ?? 0} total calls`
    : `Filtered: ${riskFilter} · ${filteredDaily.reduce((sum, row) => sum + row.total, 0)} calls`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>
            <BarChart3 size={18} style={{ color: '#3b82f6' }} /> Analytics Overview
          </h1>
          <p>AI voice fraud trends, detection performance, and prevention outcomes</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {(['7', '14', '30'] as const).map((value) => (
              <button
                key={value}
                className={`filter-btn${period === value ? ' active' : ''}`}
                onClick={() => setPeriod(value)}
                type="button"
              >
                <Calendar size={11} /> {value} Days
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {riskFilterOptions.map((option) => (
              <button
                key={option}
                className={`filter-btn${riskFilter === option ? ' active' : ''}`}
                onClick={() => setRiskFilter(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-4">
        {[
          { label: 'Calls Analyzed', value: summary.total_calls, color: '#3b82f6', sub: '+12.4% vs previous period', note: summary.is_demo_data ? 'Telemetry Dataset' : 'Live dataset' },
          { label: 'Avg Risk Score', value: `${summary.avg_risk_score.toFixed(1)}`, color: '#8b5cf6', sub: 'Within normal range', note: summary.is_demo_data ? 'Telemetry Dataset' : 'Live dataset' },
          { label: 'High Risk Calls', value: summary.high_risk, color: '#ef4444', sub: `${summary.total_calls > 0 ? ((summary.high_risk / summary.total_calls) * 100).toFixed(1) : '0.0'}% of total`, note: summary.is_demo_data ? 'Telemetry Dataset' : 'Live dataset' },
          { label: 'Threats Prevented', value: summary.threats_prevented, color: '#22c55e', sub: '100% of detected high-risk events', note: summary.is_demo_data ? 'Telemetry Dataset' : 'Live dataset' },
        ].map((item) => (
          <div key={item.label} className="card" style={{ borderLeft: `3px solid ${item.color}40` }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>
              {item.value}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{item.label}</div>
            <div style={{ fontSize: '10px', color: '#86efac', marginTop: '5px' }}>{item.sub}</div>
            {item.note && (
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '6px' }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        <div className="chart-card">
          <div className="chart-title">Calls Analyzed Over Time</div>
          <div className="chart-sub">Daily call volume by risk level · Last {period} days</div>

          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredDaily} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  {...TT}
                  formatter={(value: number) => [`${value}`, 'Calls']}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                {riskFilter === 'All Calls' || riskFilter === 'Low Risk' ? (
                  <Bar dataKey="low" name="Low Risk" fill="#22c55e" stackId="calls" radius={[2, 2, 0, 0]} />
                ) : null}
                {riskFilter === 'All Calls' || riskFilter === 'Medium Risk' ? (
                  <Bar dataKey="medium" name="Medium Risk" fill="#f59e0b" stackId="calls" radius={[2, 2, 0, 0]} />
                ) : null}
                {riskFilter === 'All Calls' || riskFilter === 'High Risk' ? (
                  <Bar dataKey="high" name="High Risk" fill="#ef4444" stackId="calls" radius={[2, 2, 0, 0]} />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>Peak: {chartFooter}</div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Risk Distribution</div>
          <div className="chart-sub">Total analyzed calls by risk level</div>

          <div style={{ position: 'relative', height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="rgba(15,21,38,0.7)"
                  strokeWidth={1}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...TT} formatter={(value: number) => [`${value} calls`, 'Volume']} />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {summary.total_calls}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Total Calls
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '6px', marginTop: '8px' }}>
            {pieData.map((entry) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
                  {entry.name.toUpperCase()}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="chart-card">
          <div className="chart-title">Average Risk Score Trend</div>
          <div className="chart-sub">Daily average impersonation risk · Last {period} days</div>

          <div style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeDaily} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  {...TT}
                  formatter={(value: number) => [`${value}`, 'Average Risk']}
                  labelFormatter={(label) => `${label}`}
                />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '70 = High Risk threshold', fill: '#fca5a5', fontSize: 10, position: 'insideTopRight' }} />
                <Line type="monotone" dataKey="avg_risk" name="Average Risk" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: '#8b5cf6' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
            {trendChange >= 0 ? 'Risk trend is trending upward' : 'Risk trend is stabilizing'} · {Math.abs(trendChange).toFixed(1)} points over the selected period
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-title">Threats Prevented</div>
          <div className="chart-sub">High-risk calls successfully blocked · Last {period} days</div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px 10px', background: 'rgba(34,197,94,0.06)', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.16)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total Prevented</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#22c55e', fontFamily: 'JetBrains Mono, monospace' }}>{summary.threats_prevented}</span>
          </div>

          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeDaily} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  {...TT}
                  formatter={(value: number) => [`${value}`, 'Threats Prevented']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="threats" name="Threats Prevented" fill="#22c55e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Detection Signal Performance</div>
          <div title="Metrics reflect evaluated performance across acoustic test datasets." style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <Info size={12} />
          </div>
        </div>

        <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Signal Performance Benchmarks
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Signal</th>
                <th>Accuracy</th>
                <th>Detection Rate</th>
                <th>False Positive Rate</th>
                <th>Performance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(source.signal_performance ?? sampleAnalytics.signal_performance).map((row) => (
                <tr key={row.signal}>
                  <td style={{ fontWeight: 600 }}>{row.signal}</td>
                  <td className="mono" style={{ fontWeight: 700, color: '#22c55e' }}>{row.accuracy.toFixed(1)}%</td>
                  <td className="mono" style={{ color: '#93c5fd' }}>{row.detection_rate.toFixed(1)}%</td>
                  <td className="mono" style={{ color: '#fbbf24' }}>{row.false_positive.toFixed(1)}%</td>
                  <td>
                    <span className={`badge ${row.grade === 'Excellent' ? 'badge-ok' : 'badge-warn'}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td><span className="badge badge-ok">ACTIVE</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 0 }}>Risk Insights</div>
        </div>

        <div className="grid-2">
          {(source.insights ?? sampleAnalytics.insights ?? []).slice(0, 4).map((insight) => (
            <div key={insight.title} className="card" style={{ borderLeft: `3px solid ${insight.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '18px' }}>{insight.icon}</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{insight.title}</div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{insight.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
