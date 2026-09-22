import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { LandingPage } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { PredictionPage } from './pages/PredictionPage'
import { WeatherIntelligencePage } from './pages/WeatherIntelligence'
import { WeatherMapPage } from './pages/WeatherMapPage'
import { AlertsPage } from './pages/Alerts'
import { HowItWorksPage } from './pages/HowItWorks'
import ScenarioLab from './pages/ScenarioLab'
import SystemHealth from './pages/SystemHealth'
import { FloodRiskPage } from './pages/FloodRisk'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Page 1: Landing / Home */}
        <Route
          path="/"
          element={
            <Layout>
              <LandingPage />
            </Layout>
          }
        />

        {/* Page 2: Dashboard */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />

        {/* Page 2.5: Interactive India Weather Map */}
        <Route
          path="/weather-map"
          element={
            <Layout>
              <WeatherMapPage />
            </Layout>
          }
        />
        <Route
          path="/map"
          element={
            <Layout>
              <WeatherMapPage />
            </Layout>
          }
        />

        {/* Page 3: Prediction Lab (Run Prediction) */}
        <Route
          path="/predict"
          element={
            <Layout>
              <PredictionPage />
            </Layout>
          }
        />

        {/* Page 3.5: Flood Inundation & Early Warning (U-Net) */}
        <Route
          path="/flood-risk"
          element={
            <Layout>
              <FloodRiskPage />
            </Layout>
          }
        />
        <Route
          path="/flood"
          element={
            <Layout>
              <FloodRiskPage />
            </Layout>
          }
        />


        {/* Page 4: Weather Intelligence */}
        <Route
          path="/weather"
          element={
            <Layout>
              <WeatherIntelligencePage />
            </Layout>
          }
        />

        {/* Page 5: Alert Center */}
        <Route
          path="/alerts"
          element={
            <Layout>
              <AlertsPage />
            </Layout>
          }
        />

        {/* Page 6: About / How It Works */}
        <Route
          path="/about"
          element={
            <Layout>
              <HowItWorksPage />
            </Layout>
          }
        />

        {/* Page 7: Scenario Simulator */}
        <Route
          path="/scenario"
          element={
            <Layout>
              <ScenarioLab />
            </Layout>
          }
        />
        <Route
          path="/scenarios"
          element={
            <Layout>
              <ScenarioLab />
            </Layout>
          }
        />
        <Route
          path="/scenario-lab"
          element={
            <Layout>
              <ScenarioLab />
            </Layout>
          }
        />

        {/* Page 8: System Health */}
        <Route
          path="/system"
          element={
            <Layout>
              <SystemHealth />
            </Layout>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <Layout>
              <LandingPage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}