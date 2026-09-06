import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { FoundationPage } from './pages/Foundation'
import { RainfallPage } from './pages/Rainfall'
import { FloodRiskPage } from './pages/FloodRisk'
import { DataFusionPage } from './pages/DataFusion'
import { AlertsPage } from './pages/Alerts'
import { AIInsightsPage } from './pages/AIInsights'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Phase 3 — Command Center (hero page) */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route path="/rainfall" element={<Layout><RainfallPage /></Layout>} />
        <Route path="/flood-risk" element={<Layout><FloodRiskPage /></Layout>} />
        <Route path="/data-fusion" element={<Layout><DataFusionPage /></Layout>} />
        <Route path="/alerts" element={<Layout><AlertsPage /></Layout>} />
        <Route path="/ai-insights" element={<Layout><AIInsightsPage /></Layout>} />
        <Route
          path="/foundation"
          element={
            <Layout>
              <FoundationPage />
            </Layout>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}