import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import {
  RotateCcw,
  Navigation,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  CloudRain
} from 'lucide-react'
import type { MapTileProvider, StationWeatherMarker } from '../../types'

interface IndiaWeatherMapProps {
  selectedLocation: {
    lat: number
    lon: number
    name?: string
    temperature_c?: number | null
    condition_text?: string
    icon?: string
  } | null
  radarTileUrl: string | null
  radarTimestamp?: string | null
  onMapClick: (lat: number, lon: number) => void
  onSelectStation: (station: StationWeatherMarker) => void
}

// Major Regional Stations across India
const MAJOR_REGIONAL_STATIONS: StationWeatherMarker[] = [
  { id: 'bhubaneswar', name: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lon: 85.8245, temp_c: 25.1, condition: 'Light Drizzle', icon: 'drizzle' },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, temp_c: 25.9, condition: 'Light Drizzle', icon: 'drizzle' },
  { id: 'delhi', name: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.2090, temp_c: 26.0, condition: 'Clear Sky', icon: 'clear' },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, temp_c: 26.7, condition: 'Mainly Clear', icon: 'partly-cloudy' },
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362, temp_c: 25.9, condition: 'Clear Sky', icon: 'clear' },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, temp_c: 26.1, condition: 'Overcast', icon: 'cloudy' },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, temp_c: 25.4, condition: 'Partly Cloudy', icon: 'partly-cloudy' },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, temp_c: 22.8, condition: 'Mainly Clear', icon: 'partly-cloudy' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, temp_c: 27.5, condition: 'Clear Sky', icon: 'clear' },
  { id: 'patna', name: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376, temp_c: 26.8, condition: 'Clear Sky', icon: 'clear' },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, temp_c: 26.5, condition: 'Scattered Showers', icon: 'rain' },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lon: 74.7973, temp_c: 16.2, condition: 'Overcast', icon: 'cloudy' }
]

const INDIA_CENTER: [number, number] = [22.5, 82.0]
const INITIAL_ZOOM = 5

export function IndiaWeatherMap({
  selectedLocation,
  radarTileUrl,
  radarTimestamp,
  onMapClick,
  onSelectStation
}: IndiaWeatherMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const baseTileLayerRef = useRef<L.TileLayer | null>(null)
  const radarTileLayerRef = useRef<L.TileLayer | null>(null)
  const selectedMarkerRef = useRef<L.Marker | null>(null)
  const stationsLayerRef = useRef<L.LayerGroup | null>(null)

  const [activeTile, setActiveTile] = useState<MapTileProvider>('google-hybrid')
  const [showRadar, setShowRadar] = useState<boolean>(true)
  const [radarOpacity, setRadarOpacity] = useState<number>(0.65)
  const [showStations, setShowStations] = useState<boolean>(true)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false)

  // Map Tile Providers
  const getTileConfig = (provider: MapTileProvider) => {
    switch (provider) {
      case 'google-roadmap':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '© Google Maps'
        }
      case 'google-terrain':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '© Google Maps'
        }
      case 'google-hybrid':
        return {
          url: 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
          attribution: '© Google Maps'
        }
      case 'osm-standard':
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          subdomains: ['a', 'b', 'c'],
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
      attributionControl: false
    })

    // Custom attribution in bottom-left
    L.control
      .attribution({
        position: 'bottomleft',
        prefix: '<span class="text-[10px] text-slate-500">© Google Maps, RainViewer</span>'
      })
      .addTo(map)

    // Base Layer (Default to Photorealistic Satellite with Labels)
    const cfg = getTileConfig('google-hybrid')
    const baseLayer = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains,
      maxZoom: cfg.maxZoom
    }).addTo(map)
    baseTileLayerRef.current = baseLayer

    // Stations Group
    const stationsGroup = L.layerGroup().addTo(map)
    stationsLayerRef.current = stationsGroup

    // Map Click Listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [onMapClick])

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapRef.current) return
    if (baseTileLayerRef.current) {
      mapRef.current.removeLayer(baseTileLayerRef.current)
    }
    const cfg = getTileConfig(activeTile)
    const newBase = L.tileLayer(cfg.url, {
      subdomains: cfg.subdomains,
      maxZoom: cfg.maxZoom
    }).addTo(mapRef.current)
    baseTileLayerRef.current = newBase
    // Ensure base layer is below radar
    if (radarTileLayerRef.current) {
      radarTileLayerRef.current.bringToFront()
    }
  }, [activeTile])

  // Update Radar Layer
  useEffect(() => {
    if (!mapRef.current) return

    if (radarTileLayerRef.current) {
      mapRef.current.removeLayer(radarTileLayerRef.current)
      radarTileLayerRef.current = null
    }

    if (showRadar && radarTileUrl) {
      const radarLayer = L.tileLayer(radarTileUrl, {
        opacity: radarOpacity,
        zIndex: 400
      }).addTo(mapRef.current)
      radarTileLayerRef.current = radarLayer
    }
  }, [radarTileUrl, showRadar, radarOpacity])

  // Helper for dynamic colorful station icons
  const getStationIconHtml = useCallback((st: StationWeatherMarker) => {
    const tempText = st.temp_c !== undefined && st.temp_c !== null ? `${Math.round(st.temp_c)}°` : ''
    const cond = (st.condition || '').toLowerCase()

    let badgeStyle = 'background: linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(6, 182, 212, 0.95)); border: 1.5px solid #38bdf8;'
    let iconEmoji = '🌧️'

    if (cond.includes('clear') || cond.includes('sun')) {
      badgeStyle = 'background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(234, 88, 12, 0.95)); border: 1.5px solid #fbbf24;'
      iconEmoji = '☀️'
    } else if (cond.includes('thunder') || cond.includes('storm')) {
      badgeStyle = 'background: linear-gradient(135deg, rgba(147, 51, 234, 0.95), rgba(126, 34, 206, 0.95)); border: 1.5px solid #c084fc;'
      iconEmoji = '⚡'
    } else if (cond.includes('partly') || cond.includes('mainly')) {
      badgeStyle = 'background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(13, 148, 136, 0.95)); border: 1.5px solid #34d399;'
      iconEmoji = '🌤️'
    } else if (cond.includes('cloud') || cond.includes('overcast')) {
      badgeStyle = 'background: linear-gradient(135deg, rgba(71, 85, 105, 0.95), rgba(30, 41, 59, 0.95)); border: 1.5px solid #94a3b8;'
      iconEmoji = '☁️'
    }

    return `
      <div class="weather-station-pill flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-2xl text-white text-xs font-bold hover:scale-110 hover:shadow-cyan-500/50 transition-all cursor-pointer backdrop-blur-md" style="${badgeStyle}">
        <span class="text-xs filter drop-shadow">${iconEmoji}</span>
        <span class="text-white drop-shadow font-semibold">${st.name}</span>
        ${tempText ? `<span class="bg-black/30 px-1.5 py-0.5 rounded-full text-white font-extrabold text-[11px] ml-0.5">${tempText}</span>` : ''}
      </div>
    `
  }, [])

  // Render Regional Stations
  useEffect(() => {
    if (!mapRef.current || !stationsLayerRef.current) return

    stationsLayerRef.current.clearLayers()

    if (showStations) {
      MAJOR_REGIONAL_STATIONS.forEach((st) => {
        const icon = L.divIcon({
          html: getStationIconHtml(st),
          className: 'custom-weather-station-marker',
          iconSize: [110, 26],
          iconAnchor: [55, 13]
        })

        const marker = L.marker([st.lat, st.lon], { icon })
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e)
          onSelectStation(st)
        })
        marker.addTo(stationsLayerRef.current!)
      })
    }
  }, [showStations, getStationIconHtml, onSelectStation])

  // Update Selected Location Marker & Fly To
  useEffect(() => {
    if (!mapRef.current) return

    if (selectedMarkerRef.current) {
      mapRef.current.removeLayer(selectedMarkerRef.current)
      selectedMarkerRef.current = null
    }

    if (selectedLocation) {
      const { lat, lon, name, temperature_c, condition_text } = selectedLocation
      const tempFormatted = temperature_c !== null && temperature_c !== undefined ? `${Math.round(temperature_c)}°C` : ''
      const condFormatted = condition_text || 'Active Point'

      const customHtml = `
        <div class="selected-pin-container flex flex-col items-center animate-bounce-short">
          <div class="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 text-white shadow-2xl shadow-cyan-500/60 border-2 border-white flex items-center gap-1.5 whitespace-nowrap">
            <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <span class="text-xs font-black tracking-tight">${name || 'Selected'}</span>
            ${tempFormatted ? `<span class="bg-black/35 px-2 py-0.5 rounded-lg text-xs font-black text-amber-300 ml-0.5 shadow-inner">${tempFormatted}</span>` : ''}
          </div>
          <div class="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[9px] border-t-white -mt-[1px] filter drop-shadow"></div>
          <div class="text-[11px] font-bold text-white bg-slate-950/90 px-2 py-0.5 rounded-md mt-0.5 border border-cyan-400/60 shadow-xl">${condFormatted}</div>
        </div>
      `

      const pinIcon = L.divIcon({
        html: customHtml,
        className: 'selected-location-pin',
        iconSize: [140, 50],
        iconAnchor: [70, 48]
      })

      const marker = L.marker([lat, lon], { icon: pinIcon, zIndexOffset: 1000 })
      marker.addTo(mapRef.current)
      selectedMarkerRef.current = marker

      // Fly map smoothly to location if further away
      mapRef.current.flyTo([lat, lon], Math.max(mapRef.current.getZoom(), 8), {
        duration: 1.2,
        easeLinearity: 0.25
      })
    }
  }, [selectedLocation])

  // Controls Handlers
  const handleZoomIn = () => mapRef.current?.zoomIn()
  const handleZoomOut = () => mapRef.current?.zoomOut()
  const handleResetIndia = () => {
    mapRef.current?.flyTo(INDIA_CENTER, INITIAL_ZOOM, { duration: 1.2 })
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        mapRef.current?.flyTo([latitude, longitude], 10, { duration: 1.4 })
        onMapClick(latitude, longitude)
      },
      (err) => {
        console.warn('Geolocation error:', err)
        alert('Could not determine your location. Please check browser permissions.')
      },
      { timeout: 8000 }
    )
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapContainerRef.current?.requestFullscreen?.()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.()
      setIsFullscreen(false)
    }
  }

  return (
    <div className="relative w-full h-full flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Top-Left Style Switcher (Google Maps signature controls) */}
      <div className="absolute top-4 left-4 z-20 flex items-center p-1 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/80">
        <button
          onClick={() => setActiveTile('google-hybrid')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTile === 'google-hybrid'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-teal-900/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Google Satellite imagery with detailed road overlays"
        >
          <span>🛰️</span>
          <span>Satellite</span>
        </button>
        <button
          onClick={() => setActiveTile('google-terrain')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTile === 'google-terrain'
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Google Terrain with elevation relief & rivers"
        >
          <span>🏔️</span>
          <span>Terrain</span>
        </button>
        <button
          onClick={() => setActiveTile('google-roadmap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
            activeTile === 'google-roadmap'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-900/50'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
          }`}
          title="Google Roadmap with streets & city centers"
        >
          <span>🗺️</span>
          <span>Roadmap</span>
        </button>
      </div>

      {/* Floating Top-Right Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        
        {/* Reset to India View */}
        <button
          onClick={handleResetIndia}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-cyan-400 shadow-xl transition-all"
          title="Reset India View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Locate Me */}
        <button
          onClick={handleLocateMe}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-cyan-400 shadow-xl transition-all"
          title="Locate My Position"
        >
          <Navigation className="w-4 h-4" />
        </button>

        {/* Layers Popover Button */}
        <div className="relative">
          <button
            onClick={() => setIsLayersOpen(!isLayersOpen)}
            className={`p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border ${
              isLayersOpen ? 'border-cyan-500 text-cyan-400' : 'border-slate-700/80 text-slate-200'
            } shadow-xl transition-all`}
            title="Weather Map Layers"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Layers Popover Menu */}
          {isLayersOpen && (
            <div className="absolute top-0 right-12 w-64 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-2xl shadow-black/80 space-y-4 animate-in fade-in slide-in-from-right-2 duration-150 text-xs text-slate-200">
              
              {/* Base Map Selector */}
              <div>
                <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                  Map Style (Google Maps)
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setActiveTile('google-roadmap')}
                    className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                      activeTile === 'google-roadmap'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Google Road
                  </button>
                  <button
                    onClick={() => setActiveTile('google-terrain')}
                    className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                      activeTile === 'google-terrain'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Google Terrain
                  </button>
                  <button
                    onClick={() => setActiveTile('google-hybrid')}
                    className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                      activeTile === 'google-hybrid'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    Google Satellite
                  </button>
                  <button
                    onClick={() => setActiveTile('osm-standard')}
                    className={`px-2 py-1.5 rounded-lg border text-center font-medium transition-all ${
                      activeTile === 'osm-standard'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    OpenStreetMap
                  </button>
                </div>
              </div>

              {/* Live Precipitation Radar Toggle */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                    Precipitation Radar
                  </span>
                  <input
                    type="checkbox"
                    checked={showRadar}
                    onChange={(e) => setShowRadar(e.target.checked)}
                    className="accent-cyan-500 rounded cursor-pointer w-4 h-4"
                  />
                </div>
                {showRadar && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Layer Opacity</span>
                      <span>{Math.round(radarOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={radarOpacity}
                      onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    {radarTimestamp && (
                      <div className="text-[10px] text-cyan-400/80 pt-1">
                        RainViewer Radar Sync: {radarTimestamp}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Station Markers Toggle */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-slate-300">Regional Stations</span>
                <input
                  type="checkbox"
                  checked={showStations}
                  onChange={(e) => setShowStations(e.target.checked)}
                  className="accent-cyan-500 rounded cursor-pointer w-4 h-4"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={handleToggleFullscreen}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-cyan-400 shadow-xl transition-all"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Bottom-Right Zoom Controls */}
      <div className="absolute bottom-6 right-4 z-20 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-cyan-400 shadow-xl transition-all"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 text-slate-200 hover:text-cyan-400 shadow-xl transition-all"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Legend (when radar enabled) */}
      {showRadar && (
        <div className="absolute bottom-4 left-4 z-20 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-xl text-[10px] text-slate-300 flex items-center gap-2">
          <span className="font-semibold text-cyan-400">Precipitation Radar:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-blue-400"></span>
            <span>Light</span>
            <span className="w-3 h-2 rounded-sm bg-green-400 ml-1"></span>
            <span>Moderate</span>
            <span className="w-3 h-2 rounded-sm bg-yellow-400 ml-1"></span>
            <span>Heavy</span>
            <span className="w-3 h-2 rounded-sm bg-red-500 ml-1"></span>
            <span>Severe</span>
          </div>
        </div>
      )}
    </div>
  )
}
