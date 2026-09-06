export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE'

export type MapLayerKey = 'flood' | 'rainfall' | 'radar' | 'elevation'

export type DataSourceStatus = 'available' | 'degraded' | 'offline'

export type DataSourceTone = 'cyan' | 'green' | 'amber' | 'violet' | 'rose'

export interface LocationInfo {
  id: string
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export interface SystemStatus {
  state: 'operational' | 'degraded' | 'outage'
  label: string
  detail: string
}

/** Snapshot of current conditions shown on the Command Center. */
export interface CurrentConditions {
  rainfall: number
  peakIntensity: number
  rainfallPrediction: number
  heavyRainProbability: number
  floodProbability: number
  affectedArea: number
  riskLevel: RiskLevel
  forecastHorizon: number
  temperatureC: number
  humidity: number
  windSpeedKph: number
  updatedAt: string
}

/** Hourly forecast marker across the rolling horizon. */
export interface ForecastPoint {
  timestamp: string
  hourLabel: string
  rainfall: number
  intensity: number
  probability: number
  riskLevel: RiskLevel
  riskScore: number
}

/** Mock risk zone polygon drawn on the map overlays. */
export interface RiskZone {
  id: string
  name: string
  riskLevel: RiskLevel
  floodProbability: number
  affectedArea: number
  coordinates: [number, number][]
}

export interface RainfallCell {
  id: string
  position: [number, number]
  radius: number
  intensity: number
}

export interface RadarSite {
  id: string
  position: [number, number]
  range: number
  label?: string
}

export interface ElevationFeature {
  id: string
  elevation: number
  position: [number, number]
  contour: [number, number][]
}

export interface DataSource {
  id: string
  code: string
  name: string
  description: string
  tone: DataSourceTone
  status: DataSourceStatus
}

export interface FloodRiskData {
  topRiskZone: string
  topZoneFloodProbability: number
  topZoneAffectedArea: number
  zones: RiskZone[]
  timestamp: string
}

export interface RainfallPrediction {
  rainfallPrediction: number
  heavyRainProbability: number
  peakIntensity: number
  modelConfidence: number
  timestamp: string
}

/** Contract of the future FastAPI `/api/prediction` response. */
export interface ApiPrediction {
  rainfall_prediction: number
  heavy_rain_probability: number
  flood_probability: number
  risk_level: RiskLevel
  forecast_horizon: number
  affected_area: number
  latitude: number
  longitude: number
  timestamp: string
}

export interface InfluenceFactor {
  label: string
  influence: 'High' | 'Moderate' | 'Low'
  score: number
}

export interface AlertRecord {
  id: string
  time: string
  location: string
  message: string
  severity: RiskLevel
  window: string
  status: 'Active' | 'Monitoring' | 'Resolved'
}