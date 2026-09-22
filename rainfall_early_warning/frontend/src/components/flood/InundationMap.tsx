import { useEffect, useMemo, useState } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ImageOverlay,
  Rectangle,
  Polyline,
  useMap
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Layers,
  ShieldCheck,
  TriangleAlert,
  Navigation,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react'
import type { ShelterInfo, EvacuationRouteResponse } from '../../types'

interface InundationMapProps {
  center: [number, number]
  zoom?: number
  overlayUri?: string | null
  bounds?: [[number, number], [number, number]] | null
  shelters?: ShelterInfo[]
  route?: EvacuationRouteResponse | null
  selectedShelterId?: string | null
  onSelectShelter?: (shelter: ShelterInfo) => void
  userLocationName?: string
}

// Controller component to smoothly pan/zoom map on center or bounds changes
function MapViewController({
  center,
  bounds,
  route
}: {
  center: [number, number]
  bounds?: [[number, number], [number, number]] | null
  route?: EvacuationRouteResponse | null
}) {
  const map = useMap()

  useEffect(() => {
    if (route && route.route_coordinates && route.route_coordinates.length > 1) {
      const latLngs = route.route_coordinates.map((c) => [c[0], c[1]] as [number, number])
      const routeBounds = L.latLngBounds(latLngs)
      map.fitBounds(routeBounds, { padding: [40, 40], maxZoom: 15, animate: true })
    } else if (bounds && bounds.length === 2) {
      const leafBounds = L.latLngBounds(bounds[0], bounds[1])
      map.fitBounds(leafBounds, { padding: [30, 30], maxZoom: 14, animate: true })
    } else if (center) {
      map.flyTo(center, 13, { duration: 1.2 })
    }
  }, [center, bounds, route, map])

  return null
}

const BASE_MAPS = {
  satellite: {
    name: 'Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Earthstar Geographics'
  },
  dark: {
    name: 'CartoDB Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap contributors'
  },
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
}

export function InundationMap({
  center,
  zoom = 13,
  overlayUri,
  bounds,
  shelters = [],
  route = null,
  selectedShelterId,
  onSelectShelter,
  userLocationName = 'Selected Analysis Site'
}: InundationMapProps) {
  const [baseMapKey, setBaseMapKey] = useState<'satellite' | 'dark' | 'osm'>('satellite')
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.75)
  const [showOverlay, setShowOverlay] = useState<boolean>(true)
  const [showShelters, setShowShelters] = useState<boolean>(true)

  // Custom User Location Icon
  const userIcon = useMemo(() => {
    return L.divIcon({
      className: 'user-loc-marker',
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 32px; height: 32px; background: rgba(59, 130, 246, 0.35); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 18px; height: 18px; background: #2563eb; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
  }, [])

  // Custom Shelter Icon (Safe vs Flooded)
  const createShelterIcon = (shelter: ShelterInfo, isSelected: boolean) => {
    const isSafe = shelter.is_clear_of_flood
    const bg = isSafe ? '#10b981' : '#ef4444'
    const border = isSelected ? '#ffffff' : (isSafe ? '#047857' : '#991b1b')
    const shadow = isSelected ? '0 0 14px rgba(255,255,255,0.8)' : '0 2px 6px rgba(0,0,0,0.4)'
    const iconChar = isSafe ? '🛡️' : '⚠️'

    return L.divIcon({
      className: `shelter-marker-${shelter.id}`,
      html: `
        <div style="
          width: ${isSelected ? 34 : 28}px;
          height: ${isSelected ? 34 : 28}px;
          background: ${bg};
          border: 2px solid ${border};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${isSelected ? 16 : 13}px;
          box-shadow: ${shadow};
          cursor: pointer;
          transition: transform 0.2s ease;
        ">
          ${iconChar}
        </div>
      `,
      iconSize: [isSelected ? 34 : 28, isSelected ? 34 : 28],
      iconAnchor: [isSelected ? 17 : 14, isSelected ? 17 : 14]
    })
  }

  // Route Coordinates
  const routePolyline = useMemo(() => {
    if (!route || !route.route_coordinates || route.route_coordinates.length === 0) return null
    return route.route_coordinates.map((coord) => [coord[0], coord[1]] as [number, number])
  }, [route])

  return (
    <div className="relative w-full h-[580px] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapViewController center={center} bounds={bounds} route={route} />

        <TileLayer
          url={BASE_MAPS[baseMapKey].url}
          attribution={BASE_MAPS[baseMapKey].attribution}
          maxZoom={19}
        />

        {/* Bounding box of analyzed satellite coverage */}
        {bounds && bounds.length === 2 && (
          <Rectangle
            bounds={bounds}
            pathOptions={{
              color: '#38bdf8',
              weight: 1.5,
              dashArray: '5, 5',
              fillColor: '#0284c7',
              fillOpacity: 0.04
            }}
          />
        )}

        {/* U-Net Flood Inundation Segmentation Overlay */}
        {showOverlay && overlayUri && bounds && bounds.length === 2 && (
          <ImageOverlay
            url={overlayUri}
            bounds={bounds}
            opacity={overlayOpacity}
            zIndex={200}
          />
        )}

        {/* User Analysis Location Marker */}
        <Marker position={center} icon={userIcon}>
          <Popup className="flood-popup">
            <div className="text-slate-900 p-1 font-sans">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Analysis Coordinates
              </div>
              <div className="font-bold text-sm text-slate-800 mt-0.5">{userLocationName}</div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                {center[0].toFixed(5)}° N, {center[1].toFixed(5)}° E
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Safe/Flooded Shelters */}
        {showShelters &&
          shelters.map((shelter) => {
            const isSelected = selectedShelterId === shelter.id
            return (
              <Marker
                key={shelter.id}
                position={[shelter.lat, shelter.lon]}
                icon={createShelterIcon(shelter, isSelected)}
                eventHandlers={{
                  click: () => onSelectShelter?.(shelter)
                }}
              >
                <Popup className="flood-popup">
                  <div className="text-slate-900 p-1 min-w-[210px] font-sans">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-1.5">
                      <span className="font-bold text-sm text-slate-900 leading-tight">
                        {shelter.name}
                      </span>
                    </div>

                    <div className="mb-2">
                      {shelter.is_clear_of_flood ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <ShieldCheck size={12} /> CLEAR OF FLOOD ZONE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                          <TriangleAlert size={12} /> UNSAFE IN FLOODWAY
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-600 mb-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Distance:</span>
                        <span className="font-semibold text-slate-800">{shelter.distance_km} km ({shelter.direction})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Elevation:</span>
                        <span className="font-semibold text-slate-800">{shelter.elevation_m} m MSL</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Capacity:</span>
                        <span className="font-semibold text-slate-800">{shelter.capacity} people</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Drive Time:</span>
                        <span className="font-semibold text-slate-800">~{shelter.estimated_travel_time.driving_minutes} min</span>
                      </div>
                    </div>

                    {onSelectShelter && (
                      <button
                        type="button"
                        onClick={() => onSelectShelter(shelter)}
                        className={`w-full py-1 px-2 rounded text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                          shelter.is_clear_of_flood
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        <Navigation size={12} />
                        Calculate Route to Shelter
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

        {/* Evacuation Route Polyline */}
        {routePolyline && route && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: route.is_safe ? '#10b981' : '#ef4444',
              weight: 5,
              opacity: 0.9,
              dashArray: route.is_safe ? undefined : '8, 8',
              lineJoin: 'round',
              lineCap: 'round'
            }}
          />
        )}
      </MapContainer>

      {/* Map Control Bar Overlay (Top Left) */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 shadow-lg text-xs text-slate-200">
        {/* Basemap Switcher */}
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
          {(['satellite', 'dark', 'osm'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setBaseMapKey(key)}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                baseMapKey === key
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {key === 'satellite' ? 'Satellite' : key === 'dark' ? 'Dark' : 'Roads'}
            </button>
          ))}
        </div>

        {/* Flood Mask Layer Toggle */}
        {overlayUri && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <button
              type="button"
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                showOverlay
                  ? 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400'
              }`}
            >
              {showOverlay ? <Eye size={12} /> : <EyeOff size={12} />}
              Flood Mask
            </button>

            {/* Opacity Slider */}
            {showOverlay && (
              <div className="flex items-center gap-1.5">
                <Sliders size={11} className="text-slate-400" />
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-16 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  title="Flood Layer Opacity"
                />
                <span className="text-[10px] font-mono text-slate-400 w-6">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Shelter Toggle */}
        {shelters.length > 0 && (
          <button
            type="button"
            onClick={() => setShowShelters(!showShelters)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium border transition ${
              showShelters
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          >
            <ShieldCheck size={12} />
            Shelters ({shelters.length})
          </button>
        )}
      </div>

      {/* Map Legend Overlay (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700/80 shadow-xl max-w-[240px] text-xs text-slate-200">
        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Layers size={13} className="text-blue-400" />
          Map Legend
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-sm shrink-0"></span>
            <span className="text-slate-300">Monitored Location</span>
          </div>
          {overlayUri && (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-cyan-400/80 border border-cyan-300 shadow-sm shrink-0"></span>
              <span className="text-slate-300">U-Net Flood Inundation</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400 flex items-center justify-center text-[9px] text-white shrink-0">
              🛡️
            </span>
            <span className="text-slate-300">Safe Relief Shelter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-500 border border-red-400 flex items-center justify-center text-[9px] text-white shrink-0">
              ⚠️
            </span>
            <span className="text-slate-300">Flooded Shelter (Unsafe)</span>
          </div>
          {route && (
            <div className="flex items-center gap-2">
              <span
                className={`w-4 h-1 rounded shrink-0 ${
                  route.is_safe ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              ></span>
              <span className="text-slate-300">
                {route.is_safe ? 'Safe Evac Route' : 'Corridor in Floodway'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
