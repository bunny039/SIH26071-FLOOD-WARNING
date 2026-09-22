import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Beaker,
  ArrowRight,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  RefreshCw,
  AlertTriangle,
  CloudRain,
  ShieldCheck,
  Gauge,
  Zap,
  CheckCircle2,
  CloudLightning,
  Sun,
  Layers,
  MapPin,
  Clock,
  ExternalLink
} from 'lucide-react'
import { runSimulation, runModelPrediction, getSupportedLocations } from '../services/api'
import type { BackendPredictionResponse } from '../types'

interface SimParams {
  temperature: number
  relative_humidity: number
  surface_pressure: number
  wind_speed: number
  convective_cape: number
  total_cloud_cover: number
}

interface ScenarioPreset {
  id: string
  name: string
  icon: React.ReactNode
  tag: string
  description: string
  color: string
  params: SimParams
  season: string
}

const PRESETS: ScenarioPreset[] = [
  {
    id: 'cloudburst',
    name: 'Severe Convective Cloudburst',
    icon: <CloudLightning className="w-4 h-4 text-purple-400" />,
    tag: 'Extreme Convection',
    description: 'Very high CAPE and saturated troposphere generating violent localized downpours.',
    color: 'border-purple-500/40 bg-purple-950/20 hover:border-purple-400',
    season: 'monsoon',
    params: {
      temperature: 32.5,
      relative_humidity: 95.0,
      surface_pressure: 1002.0,
      wind_speed: 48.0,
      convective_cape: 3400.0,
      total_cloud_cover: 0.98
    }
  },
  {
    id: 'monsoon_surge',
    name: 'Monsoon Low-Pressure Surge',
    icon: <CloudRain className="w-4 h-4 text-blue-400" />,
    tag: 'Heavy Rainfall',
    description: 'Active Bay of Bengal monsoon depression with sustained moisture flux.',
    color: 'border-blue-500/40 bg-blue-950/20 hover:border-blue-400',
    season: 'monsoon',
    params: {
      temperature: 28.0,
      relative_humidity: 92.0,
      surface_pressure: 996.0,
      wind_speed: 38.0,
      convective_cape: 2100.0,
      total_cloud_cover: 0.92
    }
  },
  {
    id: 'cyclonic_storm',
    name: 'Tropical Cyclone Inflow',
    icon: <Wind className="w-4 h-4 text-rose-400" />,
    tag: 'Gale & Deluge',
    description: 'Severe cyclonic storm system with extreme gale winds and deep pressure drop.',
    color: 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400',
    season: 'cyclone',
    params: {
      temperature: 27.0,
      relative_humidity: 98.0,
      surface_pressure: 982.0,
      wind_speed: 92.0,
      convective_cape: 2800.0,
      total_cloud_cover: 1.0
    }
  },
  {
    id: 'dry_stable',
    name: 'Dry Winter / Anticyclone',
    icon: <Sun className="w-4 h-4 text-amber-400" />,
    tag: 'Fair Weather',
    description: 'High atmospheric pressure, low relative humidity, and negligible convective instability.',
    color: 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400',
    season: 'winter',
    params: {
      temperature: 22.0,
      relative_humidity: 38.0,
      surface_pressure: 1018.5,
      wind_speed: 12.0,
      convective_cape: 120.0,
      total_cloud_cover: 0.15
    }
  }
]

const HORIZONS = [
  { label: '6 Hours (Flash Flood Window)', value: '6 hours', hours: 6 },
  { label: '12 Hours (Operational Warning)', value: '12 hours', hours: 12 },
  { label: '24 Hours (Standard Daily Horizon)', value: '24 hours', hours: 24 },
  { label: '48 Hours (Extended Advisory)', value: '48 hours', hours: 48 }
]

const ScenarioLab = () => {
  const navigate = useNavigate()
  const [locations, setLocations] = useState<Array<{ name: string; lat: number; lon: number; state: string }>>([
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, state: 'Odisha' },
    { name: 'Cuttack', lat: 20.4625, lon: 85.8828, state: 'Odisha' },
    { name: 'Puri', lat: 19.8135, lon: 85.8312, state: 'Odisha' },
    { name: 'Guwahati', lat: 26.1445, lon: 91.7362, state: 'Assam' },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
    { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' }
  ])

  const [selectedLocation, setSelectedLocation] = useState('Bhubaneswar')
  const [forecastHorizon, setForecastHorizon] = useState('24 hours')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [simState, setSimState] = useState<'idle' | 'running' | 'done'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  const [baseline, setBaseline] = useState<BackendPredictionResponse | null>(null)
  const [scenario, setScenario] = useState<BackendPredictionResponse | null>(null)
  
  // Simulation parameters
  const [params, setParams] = useState<SimParams>({
    temperature: 28.5,
    relative_humidity: 84.0,
    surface_pressure: 1008.2,
    wind_speed: 18.5,
    convective_cape: 1450.0,
    total_cloud_cover: 0.75
  })

  // Fetch supported locations on mount
  useEffect(() => {
    getSupportedLocations().then(locs => {
      if (locs && locs.length > 0) setLocations(locs)
    })
  }, [])

  // Safely parse baseline from API
  const loadBaseline = async (locName = selectedLocation, horizon = forecastHorizon) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await runModelPrediction({
        location: locName,
        forecast_horizon: horizon,
        temperature: 28.5,
        relative_humidity: 84.0,
        surface_pressure: 1008.2,
        wind_speed: 18.5,
        convective_cape: 1450.0,
        total_cloud_cover: 0.75,
        season: 'live'
      })

      if (res && res.data) {
        const data = res.data
        setBaseline(data)

        // Safe extraction of meteorological parameters
        const m = data.meteorological_inputs || {}
        const live = m.live_weather?.current || {}

        const parsedTemp = Number(m.temperature_c ?? m.temperature ?? live.temperature_c ?? 28.5)
        const parsedRh = Number(m.relative_humidity_pct ?? m.relative_humidity ?? live.relative_humidity_pct ?? 84.0)
        const parsedPress = Number(m.surface_pressure_hpa ?? m.surface_pressure ?? live.surface_pressure_hpa ?? 1008.2)
        const parsedWind = Number(m.wind_speed_kmh ?? m.wind_speed ?? live.wind_speed_kmh ?? 18.5)
        const parsedCape = Number(m.convective_cape_jkg ?? m.convective_cape_j_kg ?? m.convective_cape ?? 1450.0)
        const parsedCloud = Number(m.total_cloud_cover ?? (live.cloud_cover_pct != null ? live.cloud_cover_pct / 100.0 : 0.75))

        setParams({
          temperature: isNaN(parsedTemp) ? 28.5 : parsedTemp,
          relative_humidity: isNaN(parsedRh) ? 84.0 : parsedRh,
          surface_pressure: isNaN(parsedPress) ? 1008.2 : parsedPress,
          wind_speed: isNaN(parsedWind) ? 18.5 : parsedWind,
          convective_cape: isNaN(parsedCape) ? 1450.0 : parsedCape,
          total_cloud_cover: isNaN(parsedCloud) ? 0.75 : parsedCloud
        })
        setActivePreset(null)
      }
    } catch (e: any) {
      console.error('Failed to load baseline:', e)
      setErrorMsg(`Baseline forecast error: ${e.message || 'Unable to contact forecasting server'}`)
    } finally {
      setLoading(false)
    }
  }

  // Load baseline on initial render
  useEffect(() => {
    loadBaseline(selectedLocation, forecastHorizon)
  }, [selectedLocation, forecastHorizon])

  // Apply a scenario preset
  const handleApplyPreset = (preset: ScenarioPreset) => {
    setActivePreset(preset.id)
    setParams(preset.params)
  }

  // Execute What-If simulation
  const handleSimulate = async () => {
    setSimState('running')
    setErrorMsg(null)
    
    try {
      const seasonChoice = activePreset ? (PRESETS.find(p => p.id === activePreset)?.season || 'monsoon') : 'monsoon'

      const res = await runSimulation({
        location: selectedLocation,
        forecast_horizon: forecastHorizon,
        temperature: params.temperature,
        relative_humidity: params.relative_humidity,
        surface_pressure: params.surface_pressure,
        wind_speed: params.wind_speed,
        convective_cape: params.convective_cape,
        total_cloud_cover: params.total_cloud_cover,
        season: seasonChoice
      })

      if (res && res.data) {
        setScenario(res.data)
        setSimState('done')
      } else {
        throw new Error('Simulation returned empty output.')
      }
    } catch (e: any) {
      console.error('Simulation error:', e)
      setErrorMsg(`Simulation failed: ${e.message || 'Model execution error'}`)
      setSimState('idle')
    }
  }

  // CAPE Instability Category
  const getCapeCategory = (cape: number) => {
    if (cape < 300) return { label: 'Stable / Weak', color: 'text-slate-400 bg-slate-800' }
    if (cape < 1000) return { label: 'Marginal Instability', color: 'text-blue-400 bg-blue-950/60' }
    if (cape < 2500) return { label: 'Moderate Convective Energy', color: 'text-amber-400 bg-amber-950/60' }
    return { label: 'Severe Convective Potential (>2500 J/kg)', color: 'text-rose-400 bg-rose-950/60' }
  }

  // Pressure Depression Category
  const getPressureCategory = (press: number) => {
    if (press < 990) return { label: 'Deep Cyclonic Depression', color: 'text-rose-400' }
    if (press < 1002) return { label: 'Monsoon Low Pressure', color: 'text-amber-400' }
    return { label: 'Standard Surface Pressure', color: 'text-emerald-400' }
  }

  const capeCat = getCapeCategory(params.convective_cape)
  const pressCat = getPressureCategory(params.surface_pressure)

  // Deltas calculation
  const rainfallDelta = scenario && baseline ? scenario.predicted_rainfall - baseline.predicted_rainfall : 0
  const rainfallDeltaPct = baseline && baseline.predicted_rainfall > 0 
    ? (rainfallDelta / baseline.predicted_rainfall) * 100 
    : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Beaker className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
                Atmospheric Scenario Lab
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  WHAT-IF SIMULATOR
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Stress-test the ConvLSTM & thermodynamic rainfall models by modulating kinetic, convective, and barometric inputs.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadBaseline(selectedLocation, forecastHorizon)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Reload live observed weather as baseline"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            Sync Live Baseline
          </button>

          {scenario && (
            <button
              onClick={() => navigate('/flood-risk')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition"
            >
              <Layers className="w-3.5 h-3.5" />
              Inundation Map
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center gap-3 text-rose-300 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Top Controls: Location & Horizon & Presets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Location & Horizon Card */}
        <div className="lg:col-span-4 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 p-4 space-y-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-400" /> Target Station</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Forecast Horizon</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
            >
              {locations.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name}, {loc.state}
                </option>
              ))}
            </select>

            <select
              value={forecastHorizon}
              onChange={(e) => setForecastHorizon(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
            >
              {HORIZONS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.value}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
            <span>Lat: {baseline?.meteorological_inputs?.coordinates?.lat?.toFixed(3) ?? '20.296'}° N</span>
            <span>Lon: {baseline?.meteorological_inputs?.coordinates?.lon?.toFixed(3) ?? '85.824'}° E</span>
            <span className="text-cyan-400">IMD 0.25° Mesh</span>
          </div>
        </div>

        {/* Scenario Presets Quick Bar */}
        <div className="lg:col-span-8 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-800 p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Quick Atmospheric Stress Presets:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {PRESETS.map((preset) => {
              const isActive = activePreset === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${
                    isActive
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-sm shadow-cyan-500/20 ring-1 ring-cyan-500/30'
                      : preset.color
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {preset.icon}
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300">
                      {preset.tag}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white leading-tight line-clamp-1">
                    {preset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    CAPE {preset.params.convective_cape} J/kg
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters + Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Parameter Modulation Sliders */}
        <div className="lg:col-span-5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Atmospheric Parameters</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                Interactive Controls
              </span>
            </div>

            <div className="space-y-5 mt-5">
              
              {/* Convective CAPE */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-purple-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Convective CAPE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-bold text-purple-300 bg-purple-950 border border-purple-800">
                      {params.convective_cape.toFixed(0)} J/kg
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="4500"
                  step="50"
                  value={params.convective_cape}
                  onChange={(e) => {
                    setActivePreset(null)
                    setParams({ ...params, convective_cape: parseFloat(e.target.value) })
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">0 J/kg</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${capeCat.color}`}>
                    {capeCat.label}
                  </span>
                  <span className="text-slate-500">4500 J/kg</span>
                </div>
              </div>

              {/* Relative Humidity */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-blue-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-400" />
                    Relative Humidity (2m)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold text-blue-300 bg-blue-950 border border-blue-800">
                    {params.relative_humidity.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="0.5"
                  value={params.relative_humidity}
                  onChange={(e) => {
                    setActivePreset(null)
                    setParams({ ...params, relative_humidity: parseFloat(e.target.value) })
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>20% (Arid)</span>
                  <span className={params.relative_humidity >= 85 ? 'text-blue-300 font-semibold' : ''}>
                    {params.relative_humidity >= 85 ? 'Near Saturation' : 'Tropospheric Moisture'}
                  </span>
                  <span>100% (Saturated)</span>
                </div>
              </div>

              {/* Surface Temperature */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-amber-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-amber-400" />
                    Surface Temperature (2m)
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold text-amber-300 bg-amber-950 border border-amber-800">
                    {params.temperature.toFixed(1)} °C
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="48"
                  step="0.1"
                  value={params.temperature}
                  onChange={(e) => {
                    setActivePreset(null)
                    setParams({ ...params, temperature: parseFloat(e.target.value) })
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>15.0 °C</span>
                  <span>Thermal Energy Factor</span>
                  <span>48.0 °C</span>
                </div>
              </div>

              {/* Surface Pressure */}
              <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-emerald-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Surface Atmospheric Pressure
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono font-bold text-emerald-300 bg-emerald-950 border border-emerald-800">
                    {params.surface_pressure.toFixed(1)} hPa
                  </span>
                </div>
                <input
                  type="range"
                  min="960"
                  max="1030"
                  step="0.5"
                  value={params.surface_pressure}
                  onChange={(e) => {
                    setActivePreset(null)
                    setParams({ ...params, surface_pressure: parseFloat(e.target.value) })
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">960 hPa (Depression)</span>
                  <span className={`text-[10px] font-semibold ${pressCat.color}`}>
                    {pressCat.label}
                  </span>
                  <span className="text-slate-500">1030 hPa</span>
                </div>
              </div>

              {/* Wind Speed & Cloud Cover in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Wind Speed */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      Wind Speed
                    </span>
                    <span className="text-xs font-mono font-bold text-teal-300">
                      {params.wind_speed.toFixed(0)} km/h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="140"
                    step="1"
                    value={params.wind_speed}
                    onChange={(e) => {
                      setActivePreset(null)
                      setParams({ ...params, wind_speed: parseFloat(e.target.value) })
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                </div>

                {/* Cloud Cover */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                      Cloud Cover
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-300">
                      {Math.round(params.total_cloud_cover * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.02"
                    value={params.total_cloud_cover}
                    onChange={(e) => {
                      setActivePreset(null)
                      setParams({ ...params, total_cloud_cover: parseFloat(e.target.value) })
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                  />
                </div>
              </div>

            </div>
          </div>

          <button
            onClick={handleSimulate}
            disabled={simState === 'running' || loading}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold tracking-wide shadow-lg shadow-cyan-900/40 transition disabled:opacity-50 flex items-center justify-center gap-2.5 text-sm"
          >
            {simState === 'running' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                <span>Simulating Deep Learning Model...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Execute Scenario Simulation</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Comparative Analysis & Diagnostic Cards */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Side by Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Baseline Card */}
            <div className="bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-800 p-5 flex flex-col justify-between relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 px-3 py-1 bg-slate-800/90 text-[11px] font-mono font-bold text-slate-300 rounded-bl-xl border-l border-b border-slate-700">
                OBSERVED BASELINE
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Live Meteorological State
                </div>
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  {selectedLocation} ({forecastHorizon})
                </div>

                {loading || !baseline ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
                    <span>Loading baseline telemetry...</span>
                  </div>
                ) : (
                  <div className="my-6 text-center space-y-3">
                    <div className="flex items-baseline justify-center gap-2">
                      <span
                        className="text-5xl font-black tracking-tight"
                        style={{ color: baseline.risk_color || '#10b981' }}
                      >
                        {(baseline.predicted_rainfall ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xl text-slate-400 font-medium">mm</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                      style={{
                        borderColor: baseline.risk_color,
                        color: baseline.risk_color,
                        backgroundColor: `${baseline.risk_color}18`
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: baseline.risk_color }} />
                      IMD {baseline.risk_level} ALERT
                    </div>
                  </div>
                )}
              </div>

              {baseline && (
                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">
                    Intensity: <span className="text-white font-mono">{baseline.rate_mm_per_hour ?? (baseline.predicted_rainfall / (baseline.lead_time_hours || 24)).toFixed(1)} mm/h</span>
                  </div>
                  <div className="text-slate-400 text-right">
                    Lead: <span className="text-white font-mono">{baseline.lead_time_hours ?? 24}h</span>
                  </div>
                </div>
              )}
            </div>

            {/* Scenario Result Card */}
            <div className={`backdrop-blur-md rounded-2xl border p-5 flex flex-col justify-between relative overflow-hidden shadow-lg transition ${
              scenario 
                ? 'bg-slate-900/90 border-cyan-500/40 shadow-cyan-950/30 ring-1 ring-cyan-500/20' 
                : 'bg-slate-900/40 border-slate-800'
            }`}>
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950 text-[11px] font-mono font-bold text-cyan-300 rounded-bl-xl border-l border-b border-cyan-800">
                WHAT-IF SIMULATION
              </div>

              <div>
                <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
                  Model Response Output
                </div>
                <div className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  {activePreset ? (PRESETS.find(p => p.id === activePreset)?.name || 'Custom Parameter Profile') : 'Custom Parameter Profile'}
                </div>

                {simState === 'idle' && !scenario ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-sm gap-2 text-center px-4">
                    <Beaker className="w-8 h-8 text-slate-600 mb-1" />
                    <span>Adjust parameters or select a preset and click <strong className="text-cyan-400">Execute Scenario Simulation</strong></span>
                  </div>
                ) : simState === 'running' ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                    <span className="text-cyan-400 text-xs font-mono tracking-wider animate-pulse">
                      PROCESSING MULTI-SENSOR INFERENCE...
                    </span>
                  </div>
                ) : scenario ? (
                  <div className="my-6 text-center space-y-3">
                    <div className="flex items-baseline justify-center gap-2">
                      <span
                        className="text-5xl font-black tracking-tight"
                        style={{ color: scenario.risk_color || '#10b981' }}
                      >
                        {(scenario.predicted_rainfall ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xl text-slate-400 font-medium">mm</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                      style={{
                        borderColor: scenario.risk_color,
                        color: scenario.risk_color,
                        backgroundColor: `${scenario.risk_color}22`
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scenario.risk_color }} />
                      IMD {scenario.risk_level} ALERT
                    </div>
                  </div>
                ) : null}
              </div>

              {scenario && (
                <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div className="text-slate-400">
                    Intensity: <span className="text-white font-mono">{scenario.rate_mm_per_hour ?? (scenario.predicted_rainfall / (scenario.lead_time_hours || 24)).toFixed(1)} mm/h</span>
                  </div>
                  <div className="text-slate-400 text-right">
                    Convective: <span className="text-purple-300 font-mono">{(scenario.convective_potential_mm ?? 0).toFixed(1)} mm</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Impact Analysis & Delta Dashboard */}
          {scenario && baseline && (
            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Comparative Sensitivity Analysis
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Horizon: {forecastHorizon}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Rainfall Delta */}
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Precipitation Shift (Δ)
                  </div>
                  <div className={`text-2xl font-black ${rainfallDelta > 0 ? 'text-rose-400' : rainfallDelta < 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {rainfallDelta > 0 ? '+' : ''}{rainfallDelta.toFixed(1)} mm
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {rainfallDeltaPct > 0 ? `+${rainfallDeltaPct.toFixed(0)}% increase` : `${rainfallDeltaPct.toFixed(0)}% decrease`}
                  </div>
                </div>

                {/* Risk Transition */}
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Hazard Classification
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold mt-1">
                    <span style={{ color: baseline.risk_color }}>{baseline.risk_level}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span style={{ color: scenario.risk_color }}>{scenario.risk_level}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 truncate">
                    {scenario.warning_message || 'Operational monitoring'}
                  </div>
                </div>

                {/* Convective Trigger */}
                <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Thermodynamic Lift
                  </div>
                  <div className="text-base font-bold text-purple-300">
                    {(scenario.convective_potential_mm ?? 0) > 5.0 ? 'Active Convection' : 'Stratiform / Stable'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {(scenario.convective_potential_mm ?? 0).toFixed(1)} mm convective share
                  </div>
                </div>
              </div>

              {/* Hourly Timeline Bar Distribution */}
              {scenario.hourly_timeline && scenario.hourly_timeline.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                    <span>Simulated Hourly Precipitation Distribution</span>
                    <span className="text-[10px] text-slate-500 font-mono">{scenario.hourly_timeline.length} timesteps</span>
                  </div>

                  <div className="grid grid-flow-col auto-cols-fr gap-1 items-end h-24 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    {scenario.hourly_timeline.map((item, idx) => {
                      const rain = item.rainfall_mm ?? 0
                      const maxRain = Math.max(5, ...scenario.hourly_timeline!.map(t => t.rainfall_mm ?? 0))
                      const heightPct = Math.min(100, Math.max(8, (rain / maxRain) * 100))
                      const isPeak = rain === maxRain && rain > 0

                      return (
                        <div key={idx} className="flex flex-col items-center justify-end h-full group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded shadow z-10 whitespace-nowrap">
                            +{item.hour_offset}h: {rain.toFixed(1)} mm
                          </div>
                          <div
                            className={`w-full rounded-t transition-all ${
                              isPeak 
                                ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                                : rain > 5 
                                  ? 'bg-amber-400' 
                                  : 'bg-cyan-500/70 group-hover:bg-cyan-400'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[9px] text-slate-500 mt-1 font-mono">
                            {item.hour_offset % 6 === 0 ? `${item.hour_offset}h` : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Physical Explainer Box */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-900/40 text-xs text-slate-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-cyan-300">Physics-Grounded Diagnostic: </strong>
                  {params.convective_cape >= 2000 && params.relative_humidity >= 85
                    ? `Elevated CAPE (${params.convective_cape.toFixed(0)} J/kg) coupled with near-saturated tropospheric moisture (${params.relative_humidity.toFixed(0)}%) triggers intense vertical buoyancy updrafts under the Clausius-Clapeyron equation, yielding a high probability of localized convective deluges.`
                    : params.surface_pressure < 1000
                    ? `Low surface pressure (${params.surface_pressure.toFixed(1)} hPa) induces strong cyclonic moisture convergence, intensifying antecedent precipitation accumulation.`
                    : `Thermodynamic stability is maintained with moderate convective buoyancy (${params.convective_cape.toFixed(0)} J/kg). Runoff profile conforms to standard IMD climatology for ${selectedLocation}.`}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  )
}

export default ScenarioLab
