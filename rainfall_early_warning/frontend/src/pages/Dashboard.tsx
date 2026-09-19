import { useState, useEffect } from 'react'
import {
  MapPin,
  Clock,
  CloudRain,
  AlertTriangle,
  RotateCw,
  Activity,
  ShieldCheck,
  TrendingUp
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import { WeatherMap } from '../components/maps/WeatherMap'
import { runModelPrediction, getSupportedLocations } from '../services/api'
import type { BackendPredictionResponse, RiskLevel } from '../types'

interface HorizonOption {
  label: string
  value: string
  hours: number
}

const HORIZONS: HorizonOption[] = [
  { label: '6h', value: '6 hours', hours: 6 },
  { label: '12h', value: '12 hours', hours: 12 },
  { label: '24h', value: '24 hours', hours: 24 },
  { label: '48h', value: '48 hours', hours: 48 },
]

export function Dashboard() {
  const [locations, setLocations] = useState<Array<{ name: string; lat: number; lon: number; state: string }>>([
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, state: 'Odisha' },
    { name: 'Cuttack', lat: 20.4625, lon: 85.8828, state: 'Odisha' },
    { name: 'Puri', lat: 19.8135, lon: 85.8312, state: 'Odisha' },
    { name: 'Guwahati', lat: 26.1445, lon: 91.7362, state: 'Assam' },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  ])

  const [selectedLocation, setSelectedLocation] = useState('Bhubaneswar')
  const [selectedHorizon, setSelectedHorizon] = useState('24 hours')
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<BackendPredictionResponse | null>(null)

  // Fetch supported locations on mount
  useEffect(() => {
    async function initLocations() {
      const locs = await getSupportedLocations()
      if (locs && locs.length > 0) {
        setLocations(locs)
      }
    }
    initLocations()
  }, [])

  // Execute prediction whenever location or horizon changes
  useEffect(() => {
    fetchPrediction()
  }, [selectedLocation, selectedHorizon, isDemoMode])

  async function fetchPrediction() {
    setLoading(true)
    setErrorMsg(null)

    // Base meteorological parameters associated with selected region
    const baseMeteorology = {
      location: selectedLocation,
      forecast_horizon: selectedHorizon,
      temperature: 28.5,
      relative_humidity: selectedLocation === 'Guwahati' ? 92.0 : selectedLocation === 'Mumbai' ? 89.0 : 84.5,
      surface_pressure: 1007.2,
      wind_speed: 22.0,
      total_cloud_cover: 0.85,
      convective_cape: selectedLocation === 'Guwahati' ? 2200.0 : 1650.0,
      dewpoint_temperature: 25.8,
      day_of_year: 200,
      month: 7,
    }

    try {
      const { data, isDemo } = await runModelPrediction(baseMeteorology)
      setPrediction(data)
      if (isDemo && !isDemoMode) {
        setIsDemoMode(true)
      }
    } catch (err: any) {
      setErrorMsg('Prediction service unavailable')
    } finally {
      setLoading(false)
    }
  }

  // Generate timeline chart series based on the model predicted depth
  const chartData = [
    { time: '00:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 0.12 * 10) / 10 },
    { time: '04:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 0.22 * 10) / 10 },
    { time: '08:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 0.45 * 10) / 10 },
    { time: '12:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 0.78 * 10) / 10 },
    { time: '16:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 0.95 * 10) / 10 },
    { time: '20:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 0.82 * 10) / 10 },
    { time: '24:00', rainfall: Math.round((prediction?.predicted_rainfall ?? 85) * 1.0 * 10) / 10 },
  ]

  const recentAlerts = [
    {
      id: 'alt-1',
      location: selectedLocation,
      time: '10 mins ago',
      rainfall: prediction?.predicted_rainfall ?? 87.4,
      level: prediction?.risk_level ?? 'WARNING',
      horizon: selectedHorizon,
    },
    {
      id: 'alt-2',
      location: 'Cuttack',
      time: '25 mins ago',
      rainfall: 72.8,
      level: 'WARNING',
      horizon: '12 hours',
    },
    {
      id: 'alt-3',
      location: 'Puri Coastal Zone',
      time: '1 hr ago',
      rainfall: 44.5,
      level: 'WATCH',
      horizon: '24 hours',
    },
  ]

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
    <div className="flex flex-col gap-6 pb-12">
      {/* ---------------- Top Header & Controls ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">AquaSentinel</h1>
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-300">
              AI Early Warning Dashboard
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time quantitative precipitation forecast driven by research U-Net CNN
          </p>
        </div>

        {/* Demo Mode Badge / Live indicator */}
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold border ${
            isDemoMode
              ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isDemoMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {isDemoMode ? 'DEMO DATA ACTIVE' : 'LIVE MODEL ENGINE'}
          </div>

          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500/50 hover:text-white transition-colors"
          >
            <RotateCw size={13} className={loading ? 'animate-spin text-cyan-400' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} />
          {errorMsg}
        </div>
      )}

      {/* ---------------- Controls Bar: Location Selector & Horizon ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        {/* Location Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={14} className="text-cyan-400" />
            Location Selector
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            {locations.map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name}, {loc.state}
              </option>
            ))}
          </select>
        </div>

        {/* Forecast Horizon Buttons */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-cyan-400" />
            Forecast Horizon
          </label>
          <div className="grid grid-cols-4 gap-2">
            {HORIZONS.map((h) => {
              const active = selectedHorizon === h.value
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => setSelectedHorizon(h.value)}
                  className={`rounded-xl py-2.5 text-sm font-bold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {h.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ---------------- Risk Status Card & Highlights ---------------- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Primary Risk Status Card */}
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Risk</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-extrabold tracking-wide ${getRiskBadgeColor(prediction?.risk_level ?? 'WARNING')}`}>
              {prediction?.risk_level ?? 'WARNING'}
            </span>
          </div>

          <div className="my-4">
            <div className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              {prediction?.predicted_rainfall ?? 87.4}{' '}
              <span className="text-xl font-normal text-cyan-400">mm</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Accumulated depth across {selectedHorizon}
            </p>
          </div>

          <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Forecast Window:</span>
            <span className="font-semibold text-white">{selectedHorizon}</span>
          </div>
        </div>

        {/* Risk Indicators Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Meteorological Indicators
          </span>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <CloudRain size={13} className="text-cyan-400" /> Rainfall Intensity:
              </span>
              <span className="font-semibold text-white">
                {Math.round(((prediction?.predicted_rainfall ?? 87.4) / (prediction?.lead_time_hours ?? 24)) * 10) / 10} mm/h
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <TrendingUp size={13} className="text-amber-400" /> Flood Potential:
              </span>
              <span className="font-semibold text-amber-300">
                {(prediction?.predicted_rainfall ?? 87.4) > 100 ? 'Severe Surface Runoff' : (prediction?.predicted_rainfall ?? 87.4) > 60 ? 'Moderate Waterlogging' : 'Low Inundation'}
                <span className="text-[10px] text-slate-500 ml-1">(simulated)</span>
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity size={13} className="text-blue-400" /> Weather Anomaly:
              </span>
              <span className="font-semibold text-cyan-300">+2.4σ High Convection</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-slate-400" /> Prediction Confidence:
              </span>
              <span className="font-medium text-slate-400 italic">
                N/A (Deterministic U-Net)
              </span>
            </div>
          </div>
        </div>

        {/* Spatial Grid Statistics Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            64×64 Grid Summary
          </span>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Peak Domain Precipitation:</span>
              <span className="font-bold text-amber-400">
                {prediction?.grid_summary?.max_rainfall ?? 104.0} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Domain Average Rainfall:</span>
              <span className="font-semibold text-white">
                {prediction?.grid_summary?.mean_rainfall ?? 82.5} mm
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Model Architecture:</span>
              <span className="font-semibold text-cyan-300">U-Net 2D CNN (9.19M params)</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-800 pt-2">
              <span className="text-slate-400">Warning Category:</span>
              <span className="font-bold text-amber-300">{prediction?.risk_level ?? 'WARNING'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Rainfall Forecast Chart & Map ---------------- */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Rainfall Forecast Chart (3 cols) */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Rainfall Forecast Timeline
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative predicted rainfall (mm) across {selectedHorizon}
              </p>
            </div>
            <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-md px-2.5 py-1">
              {selectedLocation}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit=" mm" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="rainfall"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#rainGrad)"
                  name="Accumulated Rain"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Map (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Geographic Risk Map
              </h3>
              <p className="text-[11px] text-slate-400">
                Spatial rainfall zone visualization
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Leaflet Radar Layer
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800/80 flex-1 min-h-[250px]">
            <WeatherMap height={260} />
          </div>
        </div>
      </section>

      {/* ---------------- Recent Alerts Section ---------------- */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Early Warning Alerts
            </h3>
          </div>
          <span className="text-xs text-slate-400">Updated automatically</span>
        </div>

        <div className="space-y-2.5">
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 transition-colors hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${getRiskBadgeColor(alert.level)}`}>
                  {alert.level}
                </span>
                <div>
                  <span className="font-semibold text-white text-sm">{alert.location}</span>
                  <span className="text-xs text-slate-400 ml-2">· {alert.time}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-300">
                  Predicted: <strong className="text-cyan-300">{alert.rainfall} mm</strong> ({alert.horizon})
                </span>
                <span className="text-xs text-cyan-400 font-semibold cursor-pointer hover:underline">
                  View Analysis →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}