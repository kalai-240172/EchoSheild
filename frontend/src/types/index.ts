// EchoShield – Type Definitions
// Real-Time Voice Impersonation Defense

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AnalysisResult {
  call_id?: number;
  scenario: string;
  system_status?: string;
  analysis_note: string;
  risk_score: number;
  risk_level: RiskLevel;
  filename?: string;
  file_size_kb?: number;
  anti_spoofing: {
    spoof_probability: number;
    authenticity_score: number;
    confidence: number;
    artifacts: string[];
    explanation: string;
  };
  speaker_verification: {
    match_score: number;
    expected_speaker: string;
    result_label: string;
    confidence: number;
    explanation: string;
  };
  prosody_analysis: {
    risk_score: number;
    pitch_variation: number;
    speaking_rate: number;
    energy_variation: number;
    anomalies: string[];
    explanation: string;
    pitch_data: Array<{ time: number; observed: number; expected: number }>;
    energy_data: Array<{ time: number; observed: number; expected: number }>;
  };
  context_intelligence: {
    context_score: number;
    indicators: string[];
  };
  risk_fusion: {
    final_score: number;
    spoof_contribution: number;
    speaker_contribution: number;
    prosody_contribution: number;
    context_contribution: number;
  };
  recommended_actions: string[];
  audit_block_number?: number;
}

export interface CallRecord {
  id: number;
  caller_name: string;
  caller_number: string;
  call_source: string;
  duration: number;
  risk_score: number;
  risk_level: RiskLevel;
  spoof_score: number;
  speaker_match_score: number;
  prosody_score: number;
  context_score: number;
  action_taken: string;
  status: string;
  timestamp: string;
  reasons: string;
}

export interface AlertRecord {
  id: number;
  title: string;
  caller_number: string;
  risk_score: number;
  risk_level: RiskLevel;
  reason: string;
  action: string;
  timestamp: string;
  read: boolean;
}

export interface AuditBlock {
  id: number;
  block_number: number;
  timestamp: string;
  event: string;
  risk_score?: number;
  action: string;
  caller: string;
  previous_hash: string;
  current_hash: string;
  verified: string;
}

export interface DailyData {
  date: string;
  day?: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  avg_risk?: number;
  threats?: number;
}

export interface SignalPerformance {
  signal: string;
  accuracy: number;
  detection_rate: number;
  false_positive: number;
  grade: string;
}

export interface AnalyticsInsight {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

export interface AnalyticsData {
  summary: {
    total_calls: number;
    high_risk: number;
    medium_risk: number;
    low_risk: number;
    threats_prevented: number;
    avg_risk_score: number;
    is_demo_data?: boolean;
  };
  daily_data: DailyData[];
  risk_distribution: Array<{ name: string; value: number; color: string }>;
  signal_performance: SignalPerformance[];
  insights?: AnalyticsInsight[];
}

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  expected_risk: number;
  expected_level: RiskLevel;
  caller: {
    name: string;
    number: string;
    source: string;
    title: string;
    trust: string;
    previous_calls: number;
  };
  expected_action: string;
  color: string;
}

export interface Settings {
  // Risk thresholds
  low_threshold: number;
  medium_threshold: number;
  high_threshold: number;
  // Detection weights (as %)
  weight_anti_spoofing: number;
  weight_speaker_verification: number;
  weight_prosody: number;
  weight_context: number;
  // Notifications
  email_notifications: boolean;
  sms_notifications: boolean;
  webhook_notifications: boolean;
  in_app_notifications?: boolean;
  min_alert_level?: string;
  // Privacy
  audio_retention: string;
  encryption_enabled: boolean;
  audit_logging: boolean;
  minimal_retention?: boolean;
  anonymize?: boolean;
  retention_days?: number;
}
