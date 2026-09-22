import { useState, useEffect, useCallback } from 'react'
import {
  CloudRain,
  Radio,
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react'
import { IndiaWeatherMap } from '../components/map/IndiaWeatherMap'
import { LocationSearchBar } from '../components/map/LocationSearchBar'
import { WeatherInfoPanel } from '../components/map/WeatherInfoPanel'
import { getCurrentWeather, reverseGeocode, getRadarTimestamp } from '../services/api'
import type {
  CurrentWeatherConditions,
  LocationSearchResult,
  StationWeatherMarker
} from '../types'

export function WeatherMapPage() {
  const [selectedPoint, setSelectedPoint] = useState<{
    lat: number
    lon: number
    name: string
    district?: string
    state?: string
  }>({
    lat: 20.2961,
    lon: 85.8245,
    name: 'Bhubaneswar',
    district: 'Khordha',
    state: 'Odisha'
  })

  const [weather, setWeather] = useState<CurrentWeatherConditions | null>(null)
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const [radarTileUrl, setRadarTileUrl] = useState<string | null>(null)
  const [radarTimestamp, setRadarTimestamp] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true)

  // Fetch Weather Handler
  const fetchWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoadingWeather(true)
    setWeatherError(null)
    try {
      const data = await getCurrentWeather(lat, lon, name)
      setWeather(data)
    } catch (err: any) {
      console.error('Weather fetch error:', err)
      setWeatherError(err.message || 'Live weather data temporarily unavailable.')
    } finally {
      setLoadingWeather(false)
    }
  }, [])

  // Initial Weather & Radar Fetch
  useEffect(() => {
    fetchWeather(selectedPoint.lat, selectedPoint.lon, selectedPoint.name)

    getRadarTimestamp().then((data) => {
      if (data && data.tile_url) {
        setRadarTileUrl(data.tile_url)
        setRadarTimestamp(data.time_iso ? new Date(data.time_iso).toLocaleTimeString() : 'Live')
      }
    })
  }, [fetchWeather])

  // Handle Map Click
  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    setIsPanelOpen(true)
    setSelectedPoint((prev) => ({
      ...prev,
      lat,
      lon,
      name: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
      district: undefined,
      state: undefined
    }))

    // Reverse geocode to resolve administrative hierarchy
    try {
      const rev = await reverseGeocode(lat, lon)
      if (rev) {
        setSelectedPoint({
          lat,
          lon,
          name: rev.name,
          district: rev.district || undefined,
          state: rev.state || undefined
        })
        fetchWeather(lat, lon, rev.name)
      } else {
        fetchWeather(lat, lon, `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`)
      }
    } catch {
      fetchWeather(lat, lon, `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`)
    }
  }, [fetchWeather])

  // Handle Search Result Selection
  const handleSelectLocation = useCallback((loc: LocationSearchResult) => {
    setIsPanelOpen(true)
    setSelectedPoint({
      lat: loc.latitude,
      lon: loc.longitude,
      name: loc.name,
      district: loc.district || undefined,
      state: loc.state || undefined
    })
    fetchWeather(loc.latitude, loc.longitude, loc.name)
  }, [fetchWeather])

  // Handle Station Click
  const handleSelectStation = useCallback((st: StationWeatherMarker) => {
    setIsPanelOpen(true)
    setSelectedPoint({
      lat: st.lat,
      lon: st.lon,
      name: st.name,
      state: st.state
    })
    fetchWeather(st.lat, st.lon, st.name)
  }, [fetchWeather])

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] overflow-hidden bg-slate-950">
      
      {/* Top Bar with Title, Search, and Status */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0 z-20">
        
        {/* Title & Badge */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                India Weather Intelligence Map
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live NWP Online
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive high-resolution meteorological radar and current conditions across India
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-80 md:w-96">
          <LocationSearchBar onSelectLocation={handleSelectLocation} />
        </div>

        {/* Quick Legend & Toggle Button */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Radar: <strong className="text-slate-200">{radarTimestamp || 'Live'}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>ML ConvLSTM: <strong className="text-slate-200">Active</strong></span>
          </div>
          {!isPanelOpen && (
            <button
              onClick={() => setIsPanelOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg transition-colors flex items-center gap-1"
            >
              Open Weather Panel
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Map & Panel Container */}
      <div className="flex-1 relative flex overflow-hidden">
        
        {/* Interactive India Map */}
        <div className="flex-1 h-full relative">
          <IndiaWeatherMap
            selectedLocation={
              selectedPoint
                ? {
                    lat: selectedPoint.lat,
                    lon: selectedPoint.lon,
                    name: selectedPoint.name,
                    temperature_c: weather?.temperature_c,
                    condition_text: weather?.condition_text,
                    icon: weather?.icon
                  }
                : null
            }
            radarTileUrl={radarTileUrl}
            radarTimestamp={radarTimestamp}
            onMapClick={handleMapClick}
            onSelectStation={handleSelectStation}
          />
        </div>

        {/* Side Panel (Desktop slide-over, Mobile overlay) */}
        {isPanelOpen && (
          <div className="absolute right-0 top-0 bottom-0 z-30 w-full sm:w-96 md:w-[410px] shadow-2xl transition-all">
            <WeatherInfoPanel
              weather={weather}
              loading={loadingWeather}
              error={weatherError}
              locationName={selectedPoint.name}
              districtName={selectedPoint.district}
              stateName={selectedPoint.state}
              lat={selectedPoint.lat}
              lon={selectedPoint.lon}
              onClose={() => setIsPanelOpen(false)}
              onRefresh={() => fetchWeather(selectedPoint.lat, selectedPoint.lon, selectedPoint.name)}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="px-5 py-2 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click anywhere on the India map to inspect live weather and compute ConvLSTM flood risk.</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 font-mono text-slate-400">
          <span>Lat: {selectedPoint.lat.toFixed(4)}°N</span>
          <span>Lon: {selectedPoint.lon.toFixed(4)}°E</span>
        </div>
      </div>
    </div>
  )
}
