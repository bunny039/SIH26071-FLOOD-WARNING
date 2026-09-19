export type RiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'SEVERE' | 'LOW' | 'MODERATE' | 'HIGH'

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

export interface SpatialGridSummary {
  grid_shape: [number, number]
  min_rainfall: number
  max_rainfall: number
  mean_rainfall: number
  high_risk_pixel_count: number
}

export interface MeteorologicalInputs {
  temperature_c: number
  relative_humidity_pct: number
  surface_pressure_hpa: number
  wind_speed_kmh: number
  total_cloud_cover: number
  convective_cape_jkg: number
  dewpoint_c: number
  day_of_year: number
  month: number
}

/** Prediction response directly from backend /predict or /sample-prediction */
export interface BackendPredictionResponse {
  location: string
  forecast_horizon: string
  predicted_rainfall: number
  risk_level: RiskLevel
  confidence: number | null
  unit: string
  model_name: string
  lead_time_hours: number
  risk_color: string
  warning_message: string
  timestamp: string
  grid_summary: SpatialGridSummary
  meteorological_inputs: MeteorologicalInputs
}

export interface BackendPredictionRequest {
  location: string
  forecast_horizon: string
  temperature: number
  relative_humidity: number
  surface_pressure: number
  wind_speed: number
  total_cloud_cover: number
  convective_cape: number
  dewpoint_temperature?: number
  day_of_year?: number
  month?: number
}

export interface BackendModelInfo {
  model_name: string
  architecture: string
  parameters: number
  input_channels: number
  spatial_resolution: string
  prediction_type: string
  target_metric: string
  source_repository: string
  data_sources: string[]
  weights_status: string
}

export interface BackendHealth {
  status: string
  version: string
  device: string
  model_loaded: boolean
  weights_path: string | null
}

/** Snapshot of current conditions shown on the Command Center */
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

/** Hourly forecast marker across the rolling horizon */
export interface ForecastPoint {
  timestamp: string
  hourLabel: string
  rainfall: number
  intensity: number
  probability: number
  riskLevel: RiskLevel
  riskScore: number
}

/** Mock risk zone polygon drawn on map overlays */
export interface RiskZone {
  id: string
  name: string
  riskLevel: RiskLevel
  floodProbability: number
  affectedArea: number
  coordinates: [number, number][]
}

export interface ElevationFeature {
  id: string
  elevation: number
  position: [number, number]
  contour: [number, number][]
}

export interface InfluenceFactor {
  label: string
  influence: 'High' | 'Moderate' | 'Low'
  score: number
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
  modelConfidence: number | null
  timestamp: string
}

export interface AlertRecord {
  id: string
  time: string
  location: string
  message: string
  severity: RiskLevel
  window: string
  status: 'Active' | 'Monitoring' | 'Resolved'
  predicted_rainfall?: number
  forecast_period?: string
  acknowledged?: boolean
}