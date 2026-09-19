import { Fragment, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CloudRain, Layers, Radar, Waves } from 'lucide-react'
import L from 'leaflet'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapLayerKey, RiskZone } from '../../types'
import { elevationFeatures, radarSites, rainfallCells, riskZones } from '../../data/mockData'
import { RISK_HEX, fractionToPercent, riskColor } from '../../utils/risk'

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const CENTER: [number, number] = [26.1445, 91.7362]

/**
 * Seamless self-generated command-center grid, drawn as a data-URI SVG.
 * No external tile providers — the demo works fully offline.
 */
const GRID_TILE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <defs><pattern id="g" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M0 .6H256M.6 0V256" fill="none" stroke="#7ec4ec" stroke-opacity="0.06" stroke-width="1"/>
      </pattern></defs>
      <rect width="256" height="256" fill="#071726"/>
      <rect width="256" height="256" fill="url(#g)"/>
      <circle cx="0" cy="256" r="200" fill="#0c2a45" fill-opacity="0.16"/>
      <circle cx="256" cy="0" r="220" fill="#09233c" fill-opacity="0.12"/>
    </svg>`,
  )

/** Approximate Brahmaputra alignment — purely illustrative. */
const RIVER: [number, number][] = [
  [26.245, 91.56],
  [26.238, 91.62],
  [26.232, 91.68],
  [26.227, 91.72],
  [26.222, 91.76],
  [26.216, 91.81],
  [26.21, 91.86],
  [26.204, 91.9],
]

const layerButtons: { key: MapLayerKey; label: string; hint: string; icon: LucideIcon }[] = [
  { key: 'flood', label: 'Flood Risk', hint: 'Zone inundation probability', icon: Waves },
  { key: 'rainfall', label: 'Rainfall', hint: 'Precipitation field', icon: CloudRain },
  { key: 'radar', label: 'Radar', hint: 'Doppler reflectivity', icon: Radar },
  { key: 'elevation', label: 'Elevation', hint: 'DEM contour bands', icon: Layers },
]

const LEGENDS: Record<MapLayerKey, { label: string; color: string }[]> = {
  flood: [
    { label: 'LOW', color: RISK_HEX.LOW },
    { label: 'MODERATE', color: RISK_HEX.MODERATE },
    { label: 'HIGH', color: RISK_HEX.HIGH },
    { label: 'SEVERE', color: RISK_HEX.SEVERE },
  ],
  rainfall: [
    { label: '< 10 mm/h', color: '#79d0ff' },
    { label: '10–20 mm/h', color: '#3ba3e6' },
    { label: '20–30 mm/h', color: '#1b6fc9' },
    { label: '> 30 mm/h', color: '#0f3f8c' },
  ],
  radar: [
    { label: 'Reflectivity', color: '#45c9fb' },
    { label: 'Active core', color: '#ffd166' },
  ],
  elevation: [
    { label: '~48 m', color: '#4d7f9e' },
    { label: '55–74 m', color: '#7fb8d9' },
    { label: '90 m+', color: '#c9e7f7' },
  ],
}

/* ------------------------------------------------------------------ */
/* Marker icons (pure CSS, no external assets)                         */
/* ------------------------------------------------------------------ */

const cityIcon = L.divIcon({
  className: 'map-city-icon',
  html: '<span class="map-hub-dot"></span><span class="map-city-label">Guwahati</span>',
  iconSize: [110, 34],
  iconAnchor: [11, 11],
})

const radarBlipIcon = L.divIcon({
  className: 'map-blip',
  html: '<span class="map-blip-ring"></span><span class="map-blip-core"></span>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

const elevationTagIcon = (meters: number) =>
  L.divIcon({
    className: 'map-elev-tag',
    html: `<span class="map-elev-text">${meters} m</span>`,
    iconSize: [48, 20],
    iconAnchor: [24, 10],
  })

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function rainColor(intensity: number): string {
  if (intensity >= 30) return '#0f3f8c'
  if (intensity >= 20) return '#1b6fc9'
  if (intensity >= 10) return '#3ba3e6'
  return '#79d0ff'
}

const radarEchoes: [number, number][] = [
  [26.154, 91.762],
  [26.178, 91.778],
  [26.144, 91.804],
]

/* __MAP_2__ */

function ZoneTip({ zone }: { zone: RiskZone }) {
  return (
    <div className="map-tip">
      <b>{zone.name}</b>
      <span>
        Zone {zone.id} · {zone.riskLevel} ·{' '}
        {fractionToPercent(zone.floodProbability)} flood probability
      </span>
      <span>{zone.affectedArea.toFixed(1)} km² potentially affected</span>
    </div>
  )
}

/** Renders the active thematic overlay for the map. */
function LayerContent({ layer }: { layer: MapLayerKey }) {
  if (layer === 'flood') {
    return (
      <>
        {riskZones.map((zone) => (
          <Polygon
            key={zone.id}
            positions={zone.coordinates}
            pathOptions={{
              color: riskColor(zone.riskLevel, 0.9),
              weight: 1.6,
              fillColor: riskColor(zone.riskLevel, 1),
              fillOpacity: 0.26,
            }}
          >
            <Tooltip>
              <ZoneTip zone={zone} />
            </Tooltip>
          </Polygon>
        ))}
      </>
    )
  }

  if (layer === 'rainfall') {
    return (
      <>
        {rainfallCells.map((cell) => (
          <Circle
            key={cell.id}
            center={cell.position}
            radius={cell.radius}
            pathOptions={{
              color: rainColor(cell.intensity),
              weight: 1.3,
              opacity: 0.85,
              fillColor: rainColor(cell.intensity),
              fillOpacity: 0.24,
            }}
          >
            <Tooltip>
              <div className="map-tip">
                <b>{cell.intensity} mm/hr</b>
                <span>Estimated rainfall rate</span>
              </div>
            </Tooltip>
          </Circle>
        ))}
        {rainfallCells
          .filter((cell) => cell.intensity >= 25)
          .map((cell) => (
            <Circle
              key={`${cell.id}-core`}
              center={cell.position}
              radius={380}
              pathOptions={{
                color: '#ffd166',
                weight: 1.6,
                fillColor: '#ffd166',
                fillOpacity: 0.3,
              }}
            />
          ))}
      </>
    )
  }

  if (layer === 'radar') {
    return (
      <>
        {radarSites.map((site) => (
          <Fragment key={site.id}>
            <Circle
              center={site.position}
              radius={site.range}
              pathOptions={{ color: '#45c9fb', weight: 1.2, opacity: 0.5, fillColor: '#45c9fb', fillOpacity: 0.04 }}
            />
            <Circle
              center={site.position}
              radius={site.range * 0.55}
              pathOptions={{ color: '#9fe0ff', weight: 1, opacity: 0.55, fillColor: '#45c9fb', fillOpacity: 0.05 }}
            />
            <Circle
              center={site.position}
              radius={site.range * 0.2}
              pathOptions={{ color: '#cdf1ff', weight: 1, opacity: 0.8, fillColor: '#45c9fb', fillOpacity: 0.1 }}
            />
            <Marker position={site.position} icon={radarBlipIcon} zIndexOffset={300}>
              <Tooltip direction="top" offset={[0, -16]}>
                <div className="map-tip">
                  <b>{site.label}</b>
                  <span>Operational · C-band</span>
                </div>
              </Tooltip>
            </Marker>
          </Fragment>
        ))}
        {radarEchoes.map((position, index) => (
          <CircleMarker
            key={index}
            center={position}
            radius={4}
            pathOptions={{ color: '#ffd166', weight: 1.5, fillColor: '#ffd166', fillOpacity: 0.6 }}
          />
        ))}
      </>
    )
  }

  return (
    <>
      {elevationFeatures.map((feature) => (
        <Polygon
          key={feature.id}
          positions={feature.contour}
          pathOptions={{ color: '#9fe0ff', weight: 1.1, opacity: 0.7, fillColor: '#2c6b8f', fillOpacity: 0.08 }}
        />
      ))}
      {elevationFeatures.map((feature) => (
        <Marker
          key={`${feature.id}-tag`}
          position={feature.position}
          icon={elevationTagIcon(feature.elevation)}
          zIndexOffset={200}
        />
      ))}
    </>
  )
}

/* __MAP_3__ */

interface WeatherMapProps {
  height?: number
  className?: string
}

/**
 * Interactive Leaflet risk map centered on Guwahati.
 * All overlays are DEMONSTRATION zones — they are NOT real predictions.
 */
export function WeatherMap({ height = 560, className = '' }: WeatherMapProps) {
  const [active, setActive] = useState<MapLayerKey>('flood')

  return (
    <div className={`map-stage ${className}`} style={{ height }} aria-label="Interactive Guwahati demonstration risk map">
      <MapContainer
        center={CENTER}
        zoom={12}
        minZoom={9}
        maxZoom={15}
        scrollWheelZoom={false}
        zoomControl
        className="map-container"
      >
        <TileLayer
          url={GRID_TILE}
          tileSize={256}
          attribution="AquaSentinel · NEXORA — mock data"
        />

        {/* Ambience — Brahmaputra corridor + selected city */}
        <Polyline positions={RIVER} pathOptions={{ color: '#6ec8ff', weight: 9, opacity: 0.14 }} />
        <Polyline positions={RIVER} pathOptions={{ color: '#9fe0ff', weight: 3, opacity: 0.26 }} />
        <Marker position={CENTER} icon={cityIcon} zIndexOffset={500} />

        <LayerContent layer={active} />
      </MapContainer>

      <div className="map-demo-label"><span className="status-dot is-accent" /> DEMONSTRATION DATA</div>

      <div className="map-controls">
        <p className="map-controls-title">Map layers</p>
        <div className="map-layer-list">
          {layerButtons.map(({ key, label, hint, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={active === key ? 'map-layer-btn is-active' : 'map-layer-btn'}
              onClick={() => setActive(key)}
              aria-pressed={active === key}
            >
              <Icon size={15} aria-hidden="true" />
              <span className="map-layer-txt">
                <span className="map-layer-name">{label}</span>
                <span className="map-layer-hint">{hint}</span>
              </span>
              <span className="map-layer-check" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="map-legend">
          {LEGENDS[active].map((item) => (
            <span key={item.label} className="map-legend-item">
              <span className="map-legend-chip" style={{ background: item.color }} aria-hidden="true" />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}