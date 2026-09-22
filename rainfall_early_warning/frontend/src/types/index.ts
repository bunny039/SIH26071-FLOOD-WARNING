export type RiskLevel = 'NORMAL' | 'WATCH' | 'WARNING' | 'SEVERE' | 'CRITICAL' | 'ALERT' | 'LOW' | 'MODERATE' | 'HIGH'

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

export interface HourlyTimelinePoint {
  hour_offset: number
  rainfall_mm: number
  timestamp?: string
  intensity_label?: string
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
  risk_level: RiskLevel | string
  confidence: number | null
  unit: string
  model_name: string
  lead_time_hours: number
  risk_color: string
  warning_message: string
  timestamp: string
  grid_summary: SpatialGridSummary
  meteorological_inputs: any
  convective_potential_mm?: number
  convlstm_baseline_mm?: number
  rate_mm_per_hour?: number
  hourly_timeline?: HourlyTimelinePoint[]
}

export interface ConvLSTMPredictionRequest {
  latitude: number
  longitude: number
  forecast_horizon?: string
  season?: string
}

export interface ConvLSTMPredictionResponse {
  latitude: number
  longitude: number
  forecast_rainfall_mm: number
  risk_level: string
  risk_color?: string
  warning_message?: string
  model?: string
  forecast_horizon?: string
  lead_time_hours?: number
  geographic_coordinates?: { lat: number; lon: number }
  season_profile?: string
  is_ocean?: boolean
  climatological_mean_mm?: number
  recent_7day_total_mm?: number
  unit?: string
  data_source?: string
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
  season?: string
  latitude?: number
  longitude?: number
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

/** Live real-time atmospheric observation returned from GET /api/weather/current */
export interface CurrentWeatherConditions {
  status: 'success' | 'error'
  location: string
  latitude: number
  longitude: number
  timezone: string
  temperature_c: number | null
  feels_like_c: number | null
  condition_text: string
  weather_code: number
  icon: string
  relative_humidity_pct: number | null
  wind_speed_kmh: number | null
  wind_direction_deg: number | null
  wind_direction_cardinal: string
  wind_gusts_kmh: number | null
  surface_pressure_hpa: number | null
  visibility_km: number | null
  precipitation_mm: number | null
  rain_mm: number | null
  cloud_cover_pct: number | null
  observed_at: string | null
  source: string
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
  city?: string
  message: string
  severity: RiskLevel | string
  window: string
  status: 'Active' | 'Monitoring' | 'Resolved'
  predicted_rainfall?: number
  forecast_period?: string
  acknowledged?: boolean
}

/** Geographic location search match returned from GET /api/location/search */
export interface LocationSearchResult {
  name: string
  display_name: string
  district?: string | null
  state?: string | null
  country: string
  latitude: number
  longitude: number
  importance?: number
  type?: string | null
}

/** Reverse geocoding response from GET /api/location/reverse */
export interface LocationReverseResult {
  status: string
  name: string
  display_name: string
  city?: string | null
  district?: string | null
  state?: string | null
  country: string
  latitude: number
  longitude: number
}

/** RainViewer live radar timestamp response */
export interface RadarTimestampData {
  status: string
  timestamp?: number | null
  time_iso?: string | null
  tile_url?: string | null
  source?: string | null
  message?: string | null
}

/** Map tile provider options */
export type MapTileProvider = 'google-roadmap' | 'google-terrain' | 'google-hybrid' | 'osm-standard'

/** Weather station marker for map display */
export interface StationWeatherMarker {
  id: string
  name: string
  state: string
  lat: number
  lon: number
  temp_c?: number | null
  condition?: string | null
  icon?: string | null
  precipitation_mm?: number | null
}

// ------------------------------------------------------------------------------
// FLOOD INUNDATION + EARLY WARNING + SHELTER & ROUTING TYPES
// ------------------------------------------------------------------------------

export interface FloodAnalyzeResponse {
  status: 'success' | 'unavailable' | 'error'
  location: string
  coordinates: { latitude: number; longitude: number }
  flood_detected: boolean
  inundation_percentage: number
  inundated_area_km2: number
  total_area_km2?: number | null
  flood_severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
  severity_color: string
  mask_available: boolean
  overlay_data_uri?: string | null
  geographic_bounds?: [[number, number], [number, number]] | null
  confidence?: number | null
  risk_assessment: {
    risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    risk_title: string
    composite_score: number
    severity_color: string
    badge_bg: string
    badge_border: string
    advisory: string
    operational_action: string
    explainability: {
      summary: string
      contributing_reasons: string[]
      multi_sensor_verified: boolean
    }
    evidence_separation: {
      OBSERVED_DATA: {
        live_rainfall_mm: number
        antecedent_7d_rainfall_mm: number
        source: string
      }
      PREDICTED_DATA: {
        forecast_24h_rainfall_mm: number
        source: string
      }
      MODEL_OUTPUT: {
        model_name: string
        inundation_percentage: number | null
        inundated_area_km2: number | null
        mask_status: string
        source: string
      }
      DERIVED_RISK_INDICATOR: {
        score: number
        tier: string
        config_source: string
      }
    }
  }
  model_status?: any
  case_study_info?: any
  data_provenance?: string | null
  message?: string | null
  timestamp: string
}

export interface ShelterInfo {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  elevation_m: number
  capacity: number
  contact: string
  state: string
  verified: boolean
  distance_km: number
  direction: string
  verification_type: string
  is_clear_of_flood: boolean
  safety_status: string
  estimated_travel_time: {
    walking_minutes: number
    driving_minutes: number
  }
}

export interface EvacuationRouteResponse {
  status: string
  is_safe: boolean
  safety_status: string
  warning_message: string
  distance_km: number
  duration_minutes: number
  waypoints_count: number
  route_coordinates: [number, number][]
  flood_intersections_count: number
  routing_engine: string
  safety_verification_protocol: string
}

export interface FloodCaseStudyLocality {
  name: string
  center: { lat: number; lon: number }
  bounds: [number, number, number, number]
  total_area_km2: number
  peak_flood_km2: number
  peak_flood_pct: number
  drainage_profile: string
}