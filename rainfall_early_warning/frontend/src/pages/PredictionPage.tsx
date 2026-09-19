import { useState } from 'react'
import {
  Calculator,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Cloud,
  Zap,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react'
import { runModelPrediction } from '../services/api'
import type { BackendPredictionRequest, BackendPredictionResponse, RiskLevel } from '../types'

export function PredictionPage() {
  const [formData, setFormData] = useState<BackendPredictionRequest>({
    location: 'Bhubaneswar',
    forecast_horizon: '24 hours',
    temperature: 28.5,
    relative_humidity: 86.0,
    surface_pressure: 1006.5,
    wind_speed: 24.0,
    total_cloud_cover: 0.82,
    convective_cape: 1750.0,
    dewpoint_temperature: 25.5,
    day_of_year: 205,
    month: 7,
  })

  const [stepStatus, setStepStatus] = useState<'idle' | 'loading' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<BackendPredictionResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  const handleInputChange = (field: keyof BackendPredictionRequest, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }))
  }

  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setStepStatus('loading')

    // Stage 1: Loading inputs
    await new Promise((r) => setTimeout(r, 400))
    setStepStatus('running')

    // Stage 2: Running model inference on U-Net CNN
    try {
      const { data, isDemo: demoUsed } = await runModelPrediction(formData)
      setResult(data)
      setIsDemo(demoUsed)
      setStepStatus('done')
    } catch (err: any) {
      setErrorMsg('Prediction service unavailable. Please check the backend connection.')
      setStepStatus('idle')
    }
  }

  const getRiskBadgeColor = (level: RiskLevel | string) => {
    switch (level) {
      case 'SEVERE':
        return 'bg-red-500/20 text-red-400 border-red-500/40'
      case 'WARNING':
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      case 'WATCH':
      case 'MODERATE':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ---------------- Header ---------------- */}
      <div className="border-b border-slate-800 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
          <Cpu size={14} />
          RainfallForecasting-main Inference Engine
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Model Prediction Lab
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Directly execute the research U-Net 2D CNN (9.19M parameters) on standard atmospheric variables.
          Inputs correspond strictly to the variables consumed by the model pipeline.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ---------------- Input Form (7 cols) ---------------- */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <form onSubmit={handleRunPrediction} className="flex flex-col gap-5">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator size={18} className="text-cyan-400" />
              Meteorological Input Parameters
            </h2>

            {/* Location & Horizon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <MapPin size={13} className="text-cyan-400" />
                  Target Location
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Bhubaneswar">Bhubaneswar (Odisha)</option>
                  <option value="Cuttack">Cuttack (Odisha)</option>
                  <option value="Puri">Puri (Odisha)</option>
                  <option value="Guwahati">Guwahati (Assam)</option>
                  <option value="Kolkata">Kolkata (West Bengal)</option>
                  <option value="Mumbai">Mumbai (Maharashtra)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Clock size={13} className="text-cyan-400" />
                  Forecast Horizon
                </label>
                <select
                  value={formData.forecast_horizon}
                  onChange={(e) => handleInputChange('forecast_horizon', e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="6 hours">6 Hours Lead</option>
                  <option value="12 hours">12 Hours Lead</option>
                  <option value="24 hours">24 Hours Lead (Baseline)</option>
                  <option value="48 hours">48 Hours Lead</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-1" />

            {/* Core Thermodynamic Variables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Thermometer size={13} className="text-rose-400" /> 2m Temperature (°C)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.temperature}°C</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Droplets size={13} className="text-blue-400" /> Relative Humidity (%)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.relative_humidity}%</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={formData.relative_humidity}
                  onChange={(e) => handleInputChange('relative_humidity', parseFloat(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge size={13} className="text-amber-400" /> Surface Pressure (hPa)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.surface_pressure} hPa</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.surface_pressure}
                  onChange={(e) => handleInputChange('surface_pressure', parseFloat(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Wind size={13} className="text-cyan-400" /> 10m Wind Speed (km/h)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.wind_speed} km/h</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.wind_speed}
                  onChange={(e) => handleInputChange('wind_speed', parseFloat(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cloud size={13} className="text-slate-400" /> Total Cloud Cover (0-1)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.total_cloud_cover}</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.total_cloud_cover}
                  onChange={(e) => handleInputChange('total_cloud_cover', parseFloat(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap size={13} className="text-yellow-400" /> Convective CAPE (J/kg)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.convective_cape} J/kg</span>
                </label>
                <input
                  type="number"
                  step="50"
                  value={formData.convective_cape}
                  onChange={(e) => handleInputChange('convective_cape', parseFloat(e.target.value))}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Run Button */}
            <button
              type="submit"
              disabled={stepStatus === 'loading' || stepStatus === 'running'}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {stepStatus === 'loading' ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  Loading inputs...
                </>
              ) : stepStatus === 'running' ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  Running U-Net CNN (models64.py)...
                </>
              ) : (
                <>
                  <Play size={16} />
                  RUN PREDICTION
                </>
              )}
            </button>
          </form>
        </div>

        {/* ---------------- Output & Model Provenance (5 cols) ---------------- */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Status Progression Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Inference Pipeline Status
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className={`flex items-center gap-2.5 ${stepStatus !== 'idle' ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 size={14} className={stepStatus !== 'idle' ? 'text-cyan-400' : 'text-slate-600'} />
                1. Standard Z-Score normalization (57 channels)
              </div>
              <div className={`flex items-center gap-2.5 ${stepStatus === 'running' || stepStatus === 'done' ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 size={14} className={stepStatus === 'running' || stepStatus === 'done' ? 'text-cyan-400' : 'text-slate-600'} />
                2. Forward pass via models64.UNet
              </div>
              <div className={`flex items-center gap-2.5 ${stepStatus === 'done' ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 size={14} className={stepStatus === 'done' ? 'text-cyan-400' : 'text-slate-600'} />
                3. Inverse normalization to physical depth (mm)
              </div>
            </div>
          </div>

          {/* Prediction Result Display */}
          {result ? (
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Generated Forecast
                  </span>
                  {isDemo && (
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] px-2 py-0.5 font-bold">
                      DEMO DATA
                    </span>
                  )}
                </div>
                <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${getRiskBadgeColor(result.risk_level)}`}>
                  {result.risk_level}
                </span>
              </div>

              <div className="my-5">
                <div className="text-5xl font-extrabold text-white tracking-tight">
                  {result.predicted_rainfall}{' '}
                  <span className="text-2xl font-normal text-cyan-400">{result.unit}</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {result.warning_message}
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Target Region:</span>
                  <span className="font-semibold text-white">{result.location}</span>
                </div>
                <div className="flex justify-between">
                  <span>Forecast Horizon:</span>
                  <span className="font-semibold text-cyan-300">{result.forecast_horizon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Domain Peak Rain:</span>
                  <span className="font-semibold text-amber-300">{result.grid_summary.max_rainfall} mm</span>
                </div>
                <div className="flex justify-between">
                  <span>Confidence:</span>
                  <span className="italic text-slate-400">N/A (Deterministic U-Net)</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Provenance:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{result.model_name}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Sparkles size={28} className="text-slate-600" />
              <p className="text-sm">Configure parameters and click "RUN PREDICTION"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
