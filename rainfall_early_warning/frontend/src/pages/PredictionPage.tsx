import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  Sparkles,
  Layers,
  Activity
} from 'lucide-react'
import { runModelPrediction } from '../services/api'
import type { BackendPredictionRequest, BackendPredictionResponse, RiskLevel } from '../types'

const SCENARIO_PRESETS = [
  {
    name: 'Current Live Weather',
    season: 'live',
    desc: 'Live Open-Meteo NWP Radar + Recent Grid Memory',
    cape: 1200,
    humidity: 80,
    temp: 27.5,
    pressure: 1005.0,
    wind: 18.0,
    cloud: 0.75,
  },
  {
    name: 'Severe Convective Storm',
    season: 'live',
    desc: 'High Convective CAPE (1750 J/kg) & 86% RH',
    cape: 1750,
    humidity: 86,
    temp: 28.5,
    pressure: 1006.5,
    wind: 24.0,
    cloud: 0.85,
  },
  {
    name: 'Peak Monsoon (July Event)',
    season: 'monsoon',
    desc: 'Heavy Southwest Monsoon Sequence (July 2023)',
    cape: 1100,
    humidity: 92,
    temp: 26.0,
    pressure: 998.0,
    wind: 28.0,
    cloud: 0.95,
  },
  {
    name: 'Historic Cyclone / Flood',
    season: 'cyclone',
    desc: 'Sept 2021 Odisha Extreme Depression (337mm event)',
    cape: 2500,
    humidity: 95,
    temp: 25.5,
    pressure: 988.0,
    wind: 55.0,
    cloud: 1.0,
  },
  {
    name: 'Dry Winter Baseline',
    season: 'winter',
    desc: 'Late December 2023 (0 mm antecedent dry)',
    cape: 50,
    humidity: 40,
    temp: 22.0,
    pressure: 1014.0,
    wind: 8.0,
    cloud: 0.15,
  },
]

export function PredictionPage() {
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState<BackendPredictionRequest>({
    location: searchParams.get('loc') || 'Bhubaneswar',
    forecast_horizon: '24 hours',
    season: 'live',
    latitude: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
    longitude: searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : undefined,
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

  const [activePreset, setActivePreset] = useState<string>('Severe Convective Storm')
  const [stepStatus, setStepStatus] = useState<'idle' | 'loading' | 'running' | 'done'>('idle')
  const [result, setResult] = useState<BackendPredictionResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  // Sync if URL search params change
  useEffect(() => {
    const loc = searchParams.get('loc')
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    if (loc || lat || lon) {
      setFormData((prev) => ({
        ...prev,
        location: loc || prev.location,
        latitude: lat ? parseFloat(lat) : prev.latitude,
        longitude: lon ? parseFloat(lon) : prev.longitude,
      }))
      if (lat && lon) {
        setConvFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }))
      }
    }
  }, [searchParams])

  const handleInputChange = (field: keyof BackendPredictionRequest, val: any) => {
    setActivePreset('')
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }))
  }

  const applyPreset = (preset: typeof SCENARIO_PRESETS[0]) => {
    setActivePreset(preset.name)
    setFormData((prev) => ({
      ...prev,
      season: preset.season,
      convective_cape: preset.cape,
      relative_humidity: preset.humidity,
      temperature: preset.temp,
      surface_pressure: preset.pressure,
      wind_speed: preset.wind,
      total_cloud_cover: preset.cloud,
    }))
  }

  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setStepStatus('loading')

    // Stage 1: Loading inputs
    await new Promise((r) => setTimeout(r, 200))
    setStepStatus('running')

    // Stage 2: Running PyTorch ConvLSTM & NWP Fusion
    try {
      const { data, isDemo: demoUsed } = await runModelPrediction(formData)
      setResult(data)
      setIsDemo(demoUsed)
      setStepStatus('done')
    } catch (err: any) {
      setErrorMsg(err.message || 'Prediction service unavailable. Please check backend connection.')
      setStepStatus('idle')
    }
  }

  // --- ConvLSTM Spatial Predictor State ---
  const [convFormData, setConvFormData] = useState({
    latitude: 64,
    longitude: 64,
    forecast_horizon: '24 hours',
    season: 'live'
  })
  const [convStatus, setConvStatus] = useState<'idle' | 'loading' | 'done'>('idle')
  const [convResult, setConvResult] = useState<any>(null)
  const [convError, setConvError] = useState<string | null>(null)
  const [convIsDemo, setConvIsDemo] = useState(false)

  const handleConvRun = async (e: React.FormEvent) => {
    e.preventDefault()
    setConvError(null)
    setConvStatus('loading')
    try {
      const { runConvLSTMPrediction } = await import('../services/api')
      const { data, isDemo: demoUsed } = await runConvLSTMPrediction(convFormData)
      setConvResult(data)
      setConvIsDemo(demoUsed)
    } catch (err: any) {
      setConvError(err.message || 'ConvLSTM spatial query failed.')
    } finally {
      setConvStatus('done')
    }
  }

  const getRiskBadgeColor = (level: RiskLevel | string) => {
    switch (level) {
      case 'SEVERE':
      case 'CRITICAL':
      case 'RED':
        return 'bg-red-500/20 text-red-400 border-red-500/40'
      case 'WARNING':
      case 'HIGH':
      case 'ALERT':
      case 'ORANGE':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      case 'WATCH':
      case 'MODERATE':
      case 'YELLOW':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
          ConvLSTM Neural Engine + Multi-Sensor Atmospheric Fusion
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Model Prediction Lab
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          Directly execute the trained PyTorch ConvLSTM Spatio-Temporal Forecaster (trained on IMD 0.25° Gridded Rainfall)
          fused with thermodynamic convective stress simulation and live Open-Meteo NWP radar observations.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle size={18} />
          {errorMsg}
        </div>
      )}

      {/* ---------------- Scenario Quick Presets ---------------- */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-400" />
          Quick Meteorological Scenario Presets:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {SCENARIO_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.name
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col text-left p-3 rounded-xl border text-xs transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-md shadow-cyan-900/20'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <span className="font-bold flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                  {preset.name}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 line-clamp-1">{preset.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ---------------- Input Form (7 cols) ---------------- */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
          <form onSubmit={handleRunPrediction} className="flex flex-col gap-5">
            <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator size={18} className="text-cyan-400" />
              Meteorological & Convective Parameters
            </h2>

            {/* Location, Season & Horizon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <option value="Chennai">Chennai (Tamil Nadu)</option>
                  <option value="Delhi">Delhi (NCR)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers size={13} className="text-cyan-400" />
                  Grid Data Profile
                </label>
                <select
                  value={formData.season ?? 'live'}
                  onChange={(e) => handleInputChange('season', e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="live">Live NWP & Recent Grid</option>
                  <option value="monsoon">Peak Monsoon (July 2023)</option>
                  <option value="cyclone">Historic Cyclone (Sept 2021)</option>
                  <option value="winter">Dry Winter (Dec 2023 Archive)</option>
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
                    <Zap size={13} className="text-amber-400" /> Convective CAPE (J/kg)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.convective_cape} J/kg</span>
                </label>
                <input
                  type="number"
                  step="50"
                  value={formData.convective_cape}
                  onChange={(e) => handleInputChange('convective_cape', parseFloat(e.target.value) || 0)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Instability index: &gt;1500 indicates severe thunderstorm potential.</span>
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
                  onChange={(e) => handleInputChange('relative_humidity', parseFloat(e.target.value) || 0)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Tropospheric column saturation and moisture flux.</span>
              </div>

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
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gauge size={13} className="text-yellow-400" /> Surface Pressure (hPa)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.surface_pressure} hPa</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.surface_pressure}
                  onChange={(e) => handleInputChange('surface_pressure', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleInputChange('wind_speed', parseFloat(e.target.value) || 0)}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Cloud size={13} className="text-slate-400" /> Total Cloud Cover (0 - 1)
                  </span>
                  <span className="text-cyan-400 font-bold">{formData.total_cloud_cover}</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={formData.total_cloud_cover}
                  onChange={(e) => handleInputChange('total_cloud_cover', parseFloat(e.target.value) || 0)}
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
                  Loading meteorological sequences...
                </>
              ) : stepStatus === 'running' ? (
                <>
                  <RotateCw size={16} className="animate-spin" />
                  Running PyTorch ConvLSTM & Convective Synthesis...
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity size={14} className="text-cyan-400" />
              Inference Pipeline Status
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className={`flex items-center gap-2.5 ${stepStatus !== 'idle' ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 size={14} className={stepStatus !== 'idle' ? 'text-cyan-400' : 'text-slate-600'} />
                1. IMD 0.25° Gridded Antecedent Sequence (7-Day Memory)
              </div>
              <div className={`flex items-center gap-2.5 ${stepStatus === 'running' || stepStatus === 'done' ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 size={14} className={stepStatus === 'running' || stepStatus === 'done' ? 'text-cyan-400' : 'text-slate-600'} />
                2. Neural Spatio-Temporal Pass via ConvLSTM (PyTorch CUDA)
              </div>
              <div className={`flex items-center gap-2.5 ${stepStatus === 'done' ? 'text-cyan-400 font-semibold' : 'text-slate-500'}`}>
                <CheckCircle2 size={14} className={stepStatus === 'done' ? 'text-cyan-400' : 'text-slate-600'} />
                3. Convective Thermodynamics & NWP Weather Fusion
              </div>
            </div>
          </div>

          {/* Prediction Result Display */}
          {result ? (
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/95 to-slate-950 p-6 shadow-xl backdrop-blur-md">
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
                  {result.predicted_rainfall.toFixed(2)}{' '}
                  <span className="text-2xl font-normal text-cyan-400">{result.unit}</span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                  {result.warning_message}
                </p>
              </div>

              {/* Multi-Sensor Breakdown Bar */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5 my-4 space-y-2 text-xs">
                <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Multi-Sensor Breakdown</span>
                  <span className="text-cyan-400 font-mono">
                    Score: {result.meteorological_inputs?.composite_risk_score ?? 'N/A'}/100
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>ConvLSTM Antecedent Baseline:</span>
                  <span className="font-semibold text-white font-mono">
                    {(result.convlstm_baseline_mm ?? result.meteorological_inputs?.convlstm_baseline_mm ?? 0.08).toFixed(2)} mm
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Thermodynamic Convective Potential:</span>
                  <span className="font-semibold text-amber-300 font-mono">
                    {(result.convective_potential_mm ?? result.meteorological_inputs?.convective_potential_mm ?? 0.0).toFixed(2)} mm
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{result.meteorological_inputs?.season_profile === 'live' ? 'Live NWP Radar (Open-Meteo):' : 'Atmospheric Profile:'}</span>
                  <span className="font-semibold text-cyan-300 font-mono">
                    {result.meteorological_inputs?.season_profile === 'live'
                      ? (result.meteorological_inputs?.live_weather?.nwp_forecast_summary?.expected_24h_precipitation_mm !== undefined
                          ? `${result.meteorological_inputs.live_weather.nwp_forecast_summary.expected_24h_precipitation_mm} mm`
                          : 'Live Service Active')
                      : `${result.meteorological_inputs?.season_profile ?? 'Simulated'} Archive Profile`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                  <span>Primary Risk Driver:</span>
                  <span className="font-semibold text-rose-300">
                    {result.meteorological_inputs?.primary_driver ?? 'ConvLSTM Antecedent Memory'}
                  </span>
                </div>
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
                  <span>Model Calibration:</span>
                  <span className="font-semibold text-emerald-400">PyTorch CUDA (Val Loss: 0.2683)</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Provenance:</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate max-w-[220px]" title={result.model_name}>
                    {result.model_name}
                  </span>
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

      {/* ---------------- Spatial ConvLSTM Grid Predictor (Full width) ---------------- */}
      <div className="border-t border-slate-800 pt-8 mt-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300 mb-2">
          <Cpu size={14} />
          ConvLSTM PyTorch Engine (Spatial Grid Direct Query)
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Spatial ConvLSTM Rainfall Predictor
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl mb-6">
          Query the trained PyTorch ConvLSTM model directly on the Indian 0.25° grid dataset. Enter Latitude (0-128) and Longitude (0-134) indices or choose key regional presets to generate multi-horizon precipitation forecasts.
        </p>

        {convError && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
            <AlertTriangle size={18} />
            {convError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md flex flex-col justify-between">
            <form onSubmit={handleConvRun} className="flex flex-col gap-5">
              {/* Regional Hotspot Presets */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Regional Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { name: 'Central India', lat: 64, lon: 64 },
                    { name: 'Mumbai / Coast', lat: 50, lon: 25 },
                    { name: 'Odisha Belt', lat: 55, lon: 77 },
                    { name: 'Assam Valley', lat: 78, lon: 101 },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setConvFormData((prev) => ({ ...prev, latitude: preset.lat, longitude: preset.lon }))}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        convFormData.latitude === preset.lat && convFormData.longitude === preset.lon
                          ? 'border-violet-400 bg-violet-500/20 text-white shadow-sm shadow-violet-500/30'
                          : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Indices Inputs with Geo Preview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Latitude Index (0 - 128)</label>
                    <span className="text-[11px] font-mono text-violet-400">
                      {(6.5 + Math.min(128, Math.max(0, convFormData.latitude)) * 0.25).toFixed(2)}°N
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="128"
                    value={convFormData.latitude}
                    onChange={(e) => setConvFormData({ ...convFormData, latitude: parseInt(e.target.value) || 0 })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Grid latitude (India: 6.5°N - 38.5°N)</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Longitude Index (0 - 134)</label>
                    <span className="text-[11px] font-mono text-violet-400">
                      {(66.5 + Math.min(134, Math.max(0, convFormData.longitude)) * 0.25).toFixed(2)}°E
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="134"
                    value={convFormData.longitude}
                    onChange={(e) => setConvFormData({ ...convFormData, longitude: parseInt(e.target.value) || 0 })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-400 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Grid longitude (India: 66.5°E - 100.0°E)</span>
                </div>
              </div>

              {/* Season & Horizon Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Condition Profile</label>
                  <select
                    value={convFormData.season}
                    onChange={(e) => setConvFormData({ ...convFormData, season: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                  >
                    <option value="live">Live Meteorological Archive</option>
                    <option value="monsoon">Peak Southwest Monsoon (July)</option>
                    <option value="cyclone">Extreme Cyclonic Event (Sept)</option>
                    <option value="winter">Dry Winter Baseline (Dec)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">Forecast Horizon</label>
                  <select
                    value={convFormData.forecast_horizon}
                    onChange={(e) => setConvFormData({ ...convFormData, forecast_horizon: e.target.value })}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-violet-400 focus:outline-none"
                  >
                    <option value="6 hours">6 Hours (Flash Flood Window)</option>
                    <option value="12 hours">12 Hours (Half-Day)</option>
                    <option value="24 hours">24 Hours (Full Day)</option>
                    <option value="48 hours">48 Hours (Synoptic Outlook)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={convStatus === 'loading'}
                className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:from-violet-400 hover:to-purple-500 disabled:opacity-50"
              >
                {convStatus === 'loading' ? (
                  <>
                    <RotateCw size={16} className="animate-spin" />
                    Executing PyTorch ConvLSTM Inference...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    RUN CONVLSTM SPATIAL FORECAST
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result */}
          <div>
            {convResult ? (
              <div className="h-full rounded-2xl border border-violet-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        ConvLSTM Neural Output
                      </span>
                      {convIsDemo && (
                        <span className="rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] px-2 py-0.5 font-bold">
                          DEMO DATA
                        </span>
                      )}
                      {convResult.is_ocean && (
                        <span className="rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[10px] px-2 py-0.5 font-bold">
                          MARITIME POINT
                        </span>
                      )}
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${getRiskBadgeColor(convResult.risk_level)}`}>
                      {convResult.risk_level}
                    </span>
                  </div>

                  <div className="my-5">
                    <div className="text-5xl font-extrabold text-white tracking-tight">
                      {convResult.forecast_rainfall_mm.toFixed(2)}{' '}
                      <span className="text-2xl font-normal text-violet-400">mm</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">
                      {convResult.warning_message}
                    </p>
                  </div>

                  {/* Context Cards */}
                  <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 my-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Target Location:</span>
                      <span className="font-semibold text-white font-mono">
                        {convResult.geographic_coordinates
                          ? `${convResult.geographic_coordinates.lat}°N, ${convResult.geographic_coordinates.lon}°E`
                          : `Index [${convResult.latitude}, ${convResult.longitude}]`}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Forecast Horizon:</span>
                      <span className="font-semibold text-violet-300 font-mono">
                        {convResult.forecast_horizon || '24 hours'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Condition Profile:</span>
                      <span className="font-semibold text-amber-300 capitalize">
                        {convResult.season_profile || convFormData.season}
                      </span>
                    </div>
                    {convResult.climatological_mean_mm !== undefined && (
                      <div className="flex justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                        <span>Climatological Daily Mean:</span>
                        <span className="font-semibold text-cyan-300 font-mono">
                          {convResult.climatological_mean_mm.toFixed(2)} mm/day
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-800/80 pt-3 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Model Architecture:</span>
                    <span className="font-semibold text-white">ConvLSTM 2-Layer (PyTorch CUDA)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Validation Loss:</span>
                    <span className="font-semibold text-violet-300">0.2683 (Epoch 7 Checkpoint)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Station Source:</span>
                    <span className="font-semibold text-slate-300">IMD Gridded 0.25° NetCDF Archive</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full rounded-2xl border border-dashed border-slate-800 p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Sparkles size={28} className="text-slate-600" />
                <p className="text-sm">Configure parameters and click "RUN CONVLSTM SPATIAL FORECAST"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
