import { useState, useEffect } from 'react'
import {
  Sun,
  CloudSun,
  Cloud,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  CloudFog,
  Snowflake,
  Wind,
  Droplets,
  Gauge,
  Eye,
  MapPin,
  RotateCw,
  AlertCircle,
  Compass,
  Radio
} from 'lucide-react'
import { getCurrentWeather } from '../../services/api'
import type { CurrentWeatherConditions } from '../../types'

interface CurrentWeatherCardProps {
  location: {
    name: string
    lat: number
    lon: number
    state?: string
  }
}

/** Helper to render appropriate weather icon based on semantic token */
function renderWeatherIcon(iconName: string, size = 36) {
  switch (iconName) {
    case 'clear':
      return <Sun size={size} className="text-amber-400 animate-pulse" />
    case 'partly-cloudy':
      return <CloudSun size={size} className="text-amber-300" />
    case 'cloudy':
      return <Cloud size={size} className="text-slate-400" />
    case 'drizzle':
      return <CloudDrizzle size={size} className="text-cyan-400" />
    case 'rain':
      return <CloudRain size={size} className="text-blue-400" />
    case 'heavy-rain':
      return <CloudRain size={size} className="text-indigo-400 font-bold" />
    case 'thunderstorm':
      return <CloudLightning size={size} className="text-yellow-400 animate-bounce" />
    case 'fog':
      return <CloudFog size={size} className="text-slate-400" />
    case 'snow':
      return <Snowflake size={size} className="text-blue-200" />
    default:
      return <CloudSun size={size} className="text-cyan-400" />
  }
}

/** Formats ISO observation time into relative "Updated X mins ago" */
function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Just now'
  try {
    const obsDate = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - obsDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return 'Updated 1 min ago'
    if (diffMins < 60) return `Updated ${diffMins} mins ago`
    const diffHours = Math.floor(diffMins / 60)
    return `Updated ${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
  } catch {
    return 'Recently'
  }
}

export function CurrentWeatherCard({ location }: CurrentWeatherCardProps) {
  const [weather, setWeather] = useState<CurrentWeatherConditions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchWeather = async (isManual = false) => {
    if (isManual) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await getCurrentWeather(location.lat, location.lon, location.name)
      setWeather(data)
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve current atmospheric weather observations.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchWeather(false)
  }, [location.lat, location.lon, location.name])

  // --- Loading Skeleton ---
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="h-4 w-44 bg-slate-800 rounded" />
          <div className="h-4 w-28 bg-slate-800 rounded" />
        </div>
        <div className="my-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-slate-800 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-8 w-28 bg-slate-800 rounded" />
              <div className="h-4 w-36 bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-10 w-24 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-950/60 rounded-xl border border-slate-800/80" />
          ))}
        </div>
      </div>
    )
  }

  // --- Error State ---
  if (error || !weather) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-6 backdrop-blur-md shadow-xl text-rose-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={20} className="text-rose-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">Current Weather Service Offline</h4>
              <p className="text-xs text-rose-300/80 mt-0.5">{error ?? 'Unable to connect to weather observations.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchWeather(true)}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-all"
          >
            <RotateCw size={13} />
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 backdrop-blur-md shadow-xl flex flex-col gap-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            Live Observed Weather
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <MapPin size={13} className="text-cyan-400" />
            <span className="text-white font-semibold">{weather.location}</span>
            {location.state && <span className="text-slate-400">({location.state})</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span title={weather.observed_at ? `Observed: ${weather.observed_at}` : undefined}>
            {formatRelativeTime(weather.observed_at)}
          </span>
          <button
            type="button"
            onClick={() => fetchWeather(true)}
            disabled={refreshing}
            title="Refresh live weather observations"
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-slate-300 hover:border-cyan-400 hover:text-white transition-all disabled:opacity-50"
          >
            <RotateCw size={13} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
            <span className="text-[11px] font-semibold">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Hero Weather Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Temperature & Condition Hero */}
        <div className="flex items-center gap-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl border border-slate-800 bg-slate-950/80 shadow-inner">
            {renderWeatherIcon(weather.icon, 38)}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black text-white tracking-tight">
                {weather.temperature_c !== null ? Math.round(weather.temperature_c) : 'N/A'}
              </span>
              <span className="text-2xl font-normal text-cyan-400">°C</span>
              {weather.feels_like_c !== null && (
                <span className="text-xs text-slate-400 ml-2 font-medium">
                  Feels like <span className="text-slate-200 font-semibold">{Math.round(weather.feels_like_c)}°C</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-white capitalize">{weather.condition_text}</span>
              <span className="text-xs text-slate-500 font-mono">WMO {weather.weather_code}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Flood Context Note */}
        <div className="text-xs text-slate-400 md:text-right max-w-sm leading-relaxed border-l md:border-l-0 md:border-r border-slate-800/80 pl-3 md:pl-0 md:pr-3">
          <p className="font-semibold text-slate-300">Observation vs. Model Forecast</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Current atmospheric state serves as the boundary condition for our multi-hazard flood risk engine.
          </p>
        </div>
      </div>

      {/* Compact Secondary Metrics Grid (6 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
        {/* 1. Humidity */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Droplets size={12} className="text-blue-400" /> Humidity
          </span>
          <div className="mt-2 text-base font-extrabold text-white">
            {weather.relative_humidity_pct !== null ? `${weather.relative_humidity_pct}%` : 'N/A'}
          </div>
        </div>

        {/* 2. Wind */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Wind size={12} className="text-cyan-400" /> Wind
          </span>
          <div className="mt-2 text-base font-extrabold text-white truncate" title={`${weather.wind_speed_kmh} km/h ${weather.wind_direction_cardinal}`}>
            {weather.wind_speed_kmh !== null ? `${weather.wind_speed_kmh} km/h` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
            <Compass size={10} className="text-slate-500" />
            {weather.wind_direction_cardinal} ({weather.wind_direction_deg ?? '—'}°)
          </span>
        </div>

        {/* 3. Surface Pressure */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Gauge size={12} className="text-amber-400" /> Pressure
          </span>
          <div className="mt-2 text-base font-extrabold text-white">
            {weather.surface_pressure_hpa !== null ? `${weather.surface_pressure_hpa} hPa` : 'N/A'}
          </div>
        </div>

        {/* 4. Visibility */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Eye size={12} className="text-emerald-400" /> Visibility
          </span>
          <div className="mt-2 text-base font-extrabold text-white">
            {weather.visibility_km !== null ? `${weather.visibility_km} km` : 'N/A'}
          </div>
        </div>

        {/* 5. Observed Precipitation */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <CloudRain size={12} className="text-blue-400" /> Rain Rate
          </span>
          <div className="mt-2 text-base font-extrabold text-cyan-300">
            {weather.precipitation_mm !== null ? `${weather.precipitation_mm} mm` : '0.0 mm'}
          </div>
        </div>

        {/* 6. Cloud Cover */}
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Cloud size={12} className="text-slate-400" /> Cloud Cover
          </span>
          <div className="mt-2 text-base font-extrabold text-white">
            {weather.cloud_cover_pct !== null ? `${weather.cloud_cover_pct}%` : 'N/A'}
          </div>
        </div>
      </div>
    </section>
  )
}
