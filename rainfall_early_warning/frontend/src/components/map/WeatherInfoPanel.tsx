import { useState } from 'react'
import {
  X,
  RefreshCw,
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Eye,
  CloudRain,
  Cloud,
  Sun,
  CloudSun,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Snowflake,
  ShieldAlert,
  Waves,
  ArrowUpRight,
  Loader2,
  AlertTriangle,
  Compass
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { runModelPrediction } from '../../services/api'
import type { CurrentWeatherConditions, BackendPredictionResponse } from '../../types'

interface WeatherInfoPanelProps {
  weather: CurrentWeatherConditions | null
  loading: boolean
  error: string | null
  locationName?: string
  districtName?: string
  stateName?: string
  lat: number | null
  lon: number | null
  onClose: () => void
  onRefresh: () => void
}

function getWeatherIcon(iconName: string = '', condition: string = '') {
  const code = (iconName || condition).toLowerCase()
  if (code.includes('thunder') || code.includes('lightning')) return CloudLightning
  if (code.includes('heavy') || code.includes('rain') || code.includes('shower')) return CloudRain
  if (code.includes('drizzle')) return CloudDrizzle
  if (code.includes('fog') || code.includes('mist')) return CloudFog
  if (code.includes('snow')) return Snowflake
  if (code.includes('cloud') || code.includes('overcast')) return Cloud
  if (code.includes('partly') || code.includes('mainly')) return CloudSun
  return Sun
}

function getConditionBadge(condition: string = '') {
  const text = condition.toLowerCase()
  if (text.includes('thunder') || text.includes('severe')) {
    return 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  }
  if (text.includes('heavy') || text.includes('torrential')) {
    return 'bg-rose-500/10 text-rose-300 border-rose-500/30'
  }
  if (text.includes('rain') || text.includes('shower') || text.includes('drizzle')) {
    return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
  }
  if (text.includes('fog') || text.includes('mist') || text.includes('cloud')) {
    return 'bg-slate-500/10 text-slate-300 border-slate-500/30'
  }
  return 'bg-amber-500/10 text-amber-300 border-amber-500/30'
}

function getRiskTierBadge(level: string = '') {
  const norm = level.toUpperCase()
  if (norm.includes('SEVERE') || norm.includes('RED')) {
    return {
      bg: 'bg-rose-500/20 border-rose-500/50 text-rose-300',
      label: 'RED ALERT — SEVERE RISK'
    }
  }
  if (norm.includes('WARNING') || norm.includes('ORANGE')) {
    return {
      bg: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
      label: 'ORANGE ALERT — WARNING'
    }
  }
  if (norm.includes('WATCH') || norm.includes('YELLOW')) {
    return {
      bg: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
      label: 'YELLOW ALERT — ADVISORY'
    }
  }
  return {
    bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300',
    label: 'GREEN ALERT — NORMAL'
  }
}

export function WeatherInfoPanel({
  weather,
  loading,
  error,
  locationName,
  districtName,
  stateName,
  lat,
  lon,
  onClose,
  onRefresh
}: WeatherInfoPanelProps) {
  const navigate = useNavigate()
  const [analyzingFlood, setAnalyzingFlood] = useState(false)
  const [floodResult, setFloodResult] = useState<BackendPredictionResponse | null>(null)
  const [floodError, setFloodError] = useState<string | null>(null)

  const handleAnalyzeFlood = async () => {
    if (lat === null || lon === null) return
    setAnalyzingFlood(true)
    setFloodError(null)

    try {
      const { data } = await runModelPrediction({
        location: locationName || `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
        forecast_horizon: '24 hours',
        latitude: lat,
        longitude: lon,
        relative_humidity: weather?.relative_humidity_pct ?? 70,
        temperature: weather?.temperature_c ?? 28,
        surface_pressure: weather?.surface_pressure_hpa ?? 1006
      } as any)
      setFloodResult(data)
    } catch (err: any) {
      console.error('Flood risk analysis failed:', err)
      setFloodError(err.message || 'Failed to compute ML flood risk for coordinates.')
    } finally {
      setAnalyzingFlood(false)
    }
  }

  const handleDeepDive = () => {
    if (lat !== null && lon !== null) {
      navigate(`/predict?lat=${lat}&lon=${lon}&loc=${encodeURIComponent(locationName || 'Selected Location')}`)
    } else {
      navigate('/predict')
    }
  }

  const handleOpenFloodRisk = () => {
    navigate('/flood-risk')
  }

  const IconComponent = weather ? getWeatherIcon(weather.icon, weather.condition_text) : Sun
  const formattedTime = weather?.observed_at
    ? new Date(weather.observed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + ' UTC'
    : 'Live'

  const resolvedTitle = locationName || weather?.location || (lat !== null && lon !== null ? `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E` : 'Selected Location')
  const resolvedSubtitle = [districtName, stateName, 'India'].filter(Boolean).join(', ')

  return (
    <aside className="w-full h-full flex flex-col bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl overflow-y-auto divide-y divide-slate-800 text-slate-100 animate-in slide-in-from-right-3 duration-200">
      
      {/* Top Header */}
      <div className="p-5 flex items-start justify-between gap-3 bg-slate-950/40">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 tracking-wider uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Live Weather Conditions
          </div>
          <h2 className="text-xl font-bold text-white truncate mt-1 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="truncate">{resolvedTitle}</span>
          </h2>
          {resolvedSubtitle && (
            <p className="text-xs text-slate-400 truncate mt-0.5">{resolvedSubtitle}</p>
          )}
          {lat !== null && lon !== null && (
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              {lat.toFixed(4)}°N, {lon.toFixed(4)}°E
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh current weather"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
            title="Close weather panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 space-y-5 flex-1">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            <p className="text-sm font-medium text-slate-300">Fetching live atmospheric observations...</p>
            <p className="text-xs text-slate-500">Querying Open-Meteo Numerical Weather Prediction</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              Weather data temporarily unavailable
            </div>
            <p className="text-xs text-rose-300/80">{error}</p>
            <button
              onClick={onRefresh}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : weather ? (
          <>
            {/* Hero Temperature & Condition Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/60 shadow-inner flex items-center justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {weather.temperature_c !== null ? Math.round(weather.temperature_c) : 'N/A'}
                  </span>
                  <span className="text-2xl font-light text-cyan-400">°C</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-slate-500" />
                  Feels like{' '}
                  <span className="font-semibold text-slate-300">
                    {weather.feels_like_c !== null ? `${weather.feels_like_c}°C` : 'N/A'}
                  </span>
                </div>
                <div className="mt-2.5">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getConditionBadge(
                      weather.condition_text
                    )}`}
                  >
                    {weather.condition_text || 'Clear'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/5">
                <IconComponent className="w-12 h-12" />
              </div>
            </div>

            {/* 6-Metric Atmospheric Parameter Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Humidity */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  Humidity
                </div>
                <div className="text-sm font-bold text-white">
                  {weather.relative_humidity_pct !== null ? `${weather.relative_humidity_pct}%` : 'N/A'}
                </div>
              </div>

              {/* Wind */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  Wind
                </div>
                <div className="text-sm font-bold text-white truncate" title={`${weather.wind_speed_kmh} km/h ${weather.wind_direction_cardinal}`}>
                  {weather.wind_speed_kmh !== null ? `${weather.wind_speed_kmh} km/h` : 'N/A'}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    {weather.wind_direction_cardinal || ''}
                  </span>
                </div>
              </div>

              {/* Pressure */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  Pressure
                </div>
                <div className="text-sm font-bold text-white">
                  {weather.surface_pressure_hpa !== null ? `${weather.surface_pressure_hpa} hPa` : 'N/A'}
                </div>
              </div>

              {/* Visibility */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Visibility
                </div>
                <div className="text-sm font-bold text-white">
                  {weather.visibility_km !== null ? `${weather.visibility_km} km` : 'N/A'}
                </div>
              </div>

              {/* Precipitation */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                  Rainfall
                </div>
                <div className="text-sm font-bold text-cyan-300">
                  {weather.precipitation_mm !== null ? `${weather.precipitation_mm} mm` : 'N/A'}
                </div>
              </div>

              {/* Cloud Cover */}
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/60 transition-colors">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  Cloud Cover
                </div>
                <div className="text-sm font-bold text-white">
                  {weather.cloud_cover_pct !== null ? `${weather.cloud_cover_pct}%` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Update Info Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Observed: {formattedTime}</span>
              <span className="text-cyan-400/80">Source: Open-Meteo NWP</span>
            </div>

            {/* Flood Intelligence Section */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  Flood Risk Intelligence
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/40">
                  ConvLSTM Model
                </span>
              </div>

              {!floodResult ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleAnalyzeFlood}
                    disabled={analyzingFlood}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-[0.98] text-white font-semibold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {analyzingFlood ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Evaluating ConvLSTM Model...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        Analyze ConvLSTM Rain Risk
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenFloodRisk}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition border border-cyan-800/50 shadow-sm"
                  >
                    <Waves className="w-4 h-4 text-cyan-400" />
                    Open U-Net Flood & Safe Shelters
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-700/80 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        getRiskTierBadge(floodResult.risk_level).bg
                      }`}
                    >
                      {getRiskTierBadge(floodResult.risk_level).label}
                    </span>
                    <button
                      onClick={handleAnalyzeFlood}
                      disabled={analyzingFlood}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${analyzingFlood ? 'animate-spin' : ''}`} />
                      Re-run
                    </button>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400">ConvLSTM Rainfall</div>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {floodResult.predicted_rainfall.toFixed(1)} mm
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <div className="text-slate-400">Risk Assessment</div>
                      <div className="text-sm font-bold text-cyan-300 mt-0.5">
                        {floodResult.risk_level}
                      </div>
                    </div>
                  </div>

                  {/* Warning Message */}
                  <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="font-semibold text-cyan-400">Advisory: </span>
                    {floodResult.warning_message}
                  </div>

                  <button
                    onClick={handleDeepDive}
                    className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
                  >
                    Simulate Scenario in Prediction Lab
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {floodError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {floodError}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-12 text-center text-slate-400 text-sm">
            Click any location on the map or search to view live weather conditions.
          </div>
        )}
      </div>

      {/* Distinction & Provenance Banner */}
      <div className="p-4 bg-slate-950/60 text-[10px] text-slate-400 leading-tight space-y-1">
        <div className="font-semibold text-slate-300 flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          Data Provenance & Integrity
        </div>
        <p>
          <span className="text-cyan-400 font-medium">Live Weather</span> is fetched in real-time from Open-Meteo High-Resolution NWP.
        </p>
        <p>
          <span className="text-rose-400 font-medium">Inundation Risk</span> is computed solely by AquaSentinel&apos;s trained ConvLSTM deep learning neural network.
        </p>
      </div>
    </aside>
  )
}
