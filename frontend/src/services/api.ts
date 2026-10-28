// EchoShield API Service
// Real-Time Voice Impersonation Defense

import axios from 'axios';
import type {
  AnalysisResult, CallRecord, AlertRecord, AuditBlock,
  AnalyticsData, DemoScenario, Settings
} from '../types';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Health
export const getHealth = () => api.get('/health');

// Analysis
export interface DemoAnalysisRequest {
  scenario: 'normal' | 'suspicious' | 'high_risk';
  caller_name?: string;
  caller_number?: string;
  call_source?: string;
}

export const runDemoAnalysis = (req: DemoAnalysisRequest) =>
  api.post<AnalysisResult>('/demo/analyze', req);

export const analyzeAudio = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post<AnalysisResult>('/analyze-audio', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// Calls
export const getCalls = () => api.get<CallRecord[]>('/calls');
export const getCall = (id: number) => api.get<CallRecord>(`/calls/${id}`);

// Alerts
export const getAlerts = () => api.get<AlertRecord[]>('/alerts');
export const markAlertRead = (id: number) => api.patch(`/alerts/${id}/read`);
export const resolveAlert = (id: number) => api.patch(`/alerts/${id}/resolve`);
export const markAllAlertsRead = () => api.post('/alerts/mark-all-read');

// Analytics
export const getAnalytics = (period: number = 7) =>
  api.get<AnalyticsData>(`/analytics?period=${period}`);

// Audit
export const getAuditBlocks = () => api.get<AuditBlock[]>('/audit');
export const verifyLedger = () =>
  api.post<{ valid: boolean; verified: boolean; blocks_checked: number; issues: string[]; message: string }>('/audit/verify');

// Security Actions
export interface ActionRequest {
  call_id?: number;
  caller_number?: string;
  risk_score?: number;
  reason?: string;
}

export const triggerMFA = (req: ActionRequest) => api.post('/actions/mfa', req);
export const initiateCallback = (req: ActionRequest) => api.post('/actions/callback', req);
export const holdTransaction = (req: ActionRequest) => api.post('/actions/hold-transaction', req);
export const escalate = (req: ActionRequest) => api.post('/actions/escalate', req);

// Settings
export const getSettings = () => api.get<Settings>('/settings');
export const updateSettings = (settings: Settings) => api.put<{ success: boolean; message: string; settings: Settings }>('/settings', settings);

// Scenarios
export const getDemoScenarios = () =>
  api.get<{ scenarios: DemoScenario[] }>('/demo/scenarios');

export default api;
