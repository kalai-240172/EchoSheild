import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import LiveCall from './pages/LiveCall';
import VoiceAnalysis from './pages/VoiceAnalysis';
import ContextIntelligence from './pages/ContextIntelligence';
import RiskEngine from './pages/RiskEngine';
import CallHistory from './pages/CallHistory';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import AuditLedger from './pages/AuditLedger';
import SettingsPage from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live-call" element={<LiveCall />} />
          <Route path="/voice-analysis" element={<VoiceAnalysis />} />
          <Route path="/context" element={<ContextIntelligence />} />
          <Route path="/risk-engine" element={<RiskEngine />} />
          <Route path="/call-history" element={<CallHistory />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/audit" element={<AuditLedger />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
