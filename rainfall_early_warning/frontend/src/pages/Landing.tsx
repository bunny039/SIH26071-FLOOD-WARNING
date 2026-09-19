import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CloudRain,
  ShieldAlert,
  Cpu,
  Activity,
  Database
} from 'lucide-react'
import { checkBackendHealth, getSamplePrediction } from '../services/api'
import type { BackendHealth, BackendPredictionResponse } from '../types'

export function LandingPage() {
  const [health, setHealth] = useState<BackendHealth | null>(null)
  const [sample, setSample] = useState<BackendPredictionResponse | null>(null)

  useEffect(() => {
    async function loadData() {
      const [h, s] = await Promise.all([checkBackendHealth(), getSamplePrediction()])
      setHealth(h)
      setSample(s)
    }
    loadData()
  }, [])

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* ---------------- Hero Section with Rain Animation ---------------- */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/80 p-8 md:p-14 shadow-2xl backdrop-blur-xl">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="relative z-10 flex flex-col items-start gap-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-cyan-300 uppercase">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            AquaSentinel · Team NEXORA · SIH26071
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
              Aqua<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Sentinel</span>
            </h1>
            <p className="text-xl md:text-2xl font-medium text-cyan-200">
              AI-Powered Heavy Rainfall Early Warning
            </p>
          </div>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
            "Turning weather intelligence into early action." An integrated heavy precipitation forecasting system
            built upon deep convolutional U-Net architectures, fusing ECMWF ERA5 multi-level atmospheric reanalysis
            and NASA GPM-IMERG satellite data.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02]"
            >
              <Activity size={18} />
              Launch Dashboard
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/predict"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-5 py-3.5 text-sm font-semibold text-slate-200 transition-all hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white"
            >
              <CloudRain size={18} className="text-cyan-400" />
              Run Model Prediction
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-medium text-slate-400 transition-colors hover:text-cyan-300"
            >
              How It Works
            </Link>
          </div>
        </div>

        {/* Floating Quick Status Snapshot Badge on Right */}
        <div className="mt-8 md:mt-0 md:absolute md:top-12 md:right-12 z-20 flex flex-col gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl max-w-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Status</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {health?.status === 'operational' ? 'Live Operational' : 'Ready (Demo Mode)'}
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Region:</span>
              <span className="font-semibold text-white">{sample?.location ?? 'Bhubaneswar, Odisha'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Forecast Horizon:</span>
              <span className="font-semibold text-cyan-300">{sample?.forecast_horizon ?? '24 hours'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Predicted Depth:</span>
              <span className="font-bold text-amber-400">{sample?.predicted_rainfall ?? 100.5} mm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Risk Assessment:</span>
              <span className="rounded px-2 py-0.5 text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30">
                {sample?.risk_level ?? 'WARNING'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Key Pillars Section ---------------- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Cpu size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Research U-Net Architecture</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Reusing the proven 9.19M-parameter 2D CNN model from <span className="text-cyan-300">RainfallForecasting-main</span>, featuring multi-scale feature downsampling, bilinear upsampling, and direct skip connections.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <Database size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Multi-Source Atmospheric Inputs</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Fusing 57 vertical atmospheric parameters (CAPE, CIN, humidity profiles, vertical velocity, wind fields) with spatio-temporal cyclical features on a 64×64 domain.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/30">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Standard Warning Classification</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Directly translating physical millimeter forecasts into actionable risk tiers (NORMAL, WATCH, WARNING, SEVERE) following scientific meteorological criteria.
          </p>
        </div>
      </section>

      {/* ---------------- Workflow Pipeline Summary ---------------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8">
        <h2 className="text-xl font-bold text-white mb-4">Operational Architecture</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
          {[
            { step: '01', title: 'Data Sources', desc: 'ERA5 & GPM Satellite' },
            { step: '02', title: 'Preprocessing', desc: 'Cubic Zoom & Z-Norm' },
            { step: '03', title: 'U-Net Model', desc: 'models64.py Inference' },
            { step: '04', title: 'Prediction', desc: '24h Rainfall (mm)' },
            { step: '05', title: 'Risk Analysis', desc: 'IMD Warning Criteria' },
            { step: '06', title: 'Early Warning', desc: 'Alert Center Triggers' },
            { step: '07', title: 'Dashboard', desc: 'AquaSentinel UI' },
          ].map((item, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3.5">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{item.step}</span>
              <h4 className="text-xs font-semibold text-white mt-1">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
