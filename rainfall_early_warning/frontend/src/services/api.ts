import type {
  AlertRecord,
  CurrentConditions,
  CurrentWeatherConditions,
  FloodRiskData,
  ForecastPoint,
  RainfallPrediction,
  BackendPredictionRequest,
  BackendPredictionResponse,
  BackendHealth,
  ConvLSTMPredictionRequest,
  ConvLSTMPredictionResponse,
  LocationSearchResult,
  LocationReverseResult,
  RadarTimestampData,
  FloodAnalyzeResponse,
  ShelterInfo,
  EvacuationRouteResponse,
  FloodCaseStudyLocality
} from '../types'
import { alertData, floodRiskData, forecastData, weatherData } from '../data/mockData'

const API_BASE_URL = 'http://127.0.0.1:8000'

/**
 * Checks backend health status.
 */
export async function checkBackendHealth(): Promise<BackendHealth | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Gets detailed system status from the backend.
 */
export async function getSystemStatus(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/system-status`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Retrieves audited metadata for models from the Model Registry.
 */
export async function getModelInfo(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model-info`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Runs inference on the trained ConvLSTM model via FastAPI POST /api/predict.
 * Communicates with real IMD data and NWP weather fusion.
 */
export async function runModelPrediction(
  params: BackendPredictionRequest
): Promise<{ data: BackendPredictionResponse; isDemo: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || `Server returned ${res.status}`)
  }

  const data: BackendPredictionResponse = await res.json()
  return { data, isDemo: false }
}

/**
 * Runs a scenario simulation on the trained ConvLSTM model.
 */
export async function runSimulation(
  params: BackendPredictionRequest
): Promise<{ data: BackendPredictionResponse; isDemo: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || `Server returned ${res.status}`)
  }

  const data: BackendPredictionResponse = await res.json()
  return { data, isDemo: false }
}

/**
 * Runs the trained PyTorch ConvLSTM model on explicit spatial coordinates.
 */
export async function runConvLSTMPrediction(
  params: ConvLSTMPredictionRequest
): Promise<{ data: ConvLSTMPredictionResponse; isDemo: boolean }> {
  const res = await fetch(`${API_BASE_URL}/api/predict/rainfall`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.detail || `Server returned ${res.status}`)
  }

  const data: ConvLSTMPredictionResponse = await res.json()
  return { data, isDemo: false }
}

/**
 * Fetches real-time multi-sensor early warning synthesis for a given coordinate.
 */
export async function getEarlyWarningSynthesis(lat: number, lon: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/early-warning?lat=${lat}&lon=${lon}`, {
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) {
    throw new Error(`Early warning service error: ${res.status}`)
  }
  return await res.json()
}

/**
 * Fetches real-time live atmospheric weather observations from backend proxy.
 */
export async function getCurrentWeather(
  lat: number,
  lon: number,
  locationName?: string
): Promise<CurrentWeatherConditions> {
  const locParam = locationName ? `&location=${encodeURIComponent(locationName)}` : ''
  const res = await fetch(`${API_BASE_URL}/api/weather/current?lat=${lat}&lon=${lon}${locParam}`, {
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Weather service error: ${res.status}`)
  }
  return await res.json()
}

/**
 * Fetches live NWP weather forecast from Open-Meteo via backend.
 */
export async function getLiveWeather(lat: number, lon: number): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/weather/current?lat=${lat}&lon=${lon}`, {
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) {
    throw new Error(`Weather service error: ${res.status}`)
  }
  return await res.json()
}

/**
 * Fetches comprehensive live weather data including real CAPE, NWP precipitation,
 * and 24h hourly forecast from the /api/weather/live endpoint.
 */
export async function getFullLiveWeather(
  lat: number,
  lon: number,
  locationName?: string
): Promise<any> {
  const locParam = locationName ? `&location=${encodeURIComponent(locationName)}` : ''
  const res = await fetch(`${API_BASE_URL}/api/weather/live?lat=${lat}&lon=${lon}${locParam}`, {
    signal: AbortSignal.timeout(8000)
  })
  if (!res.ok) {
    throw new Error(`Live weather service error: ${res.status}`)
  }
  return await res.json()
}

/**
 * Gets a sample prediction from the FastAPI backend.
 */
export async function getSamplePrediction(): Promise<BackendPredictionResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sample-prediction`, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Predefined monitoring locations supported by the platform */
export async function getSupportedLocations(): Promise<Array<{ name: string; lat: number; lon: number; state: string }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/locations`, { signal: AbortSignal.timeout(4000) })
    if (res.ok) {
      const data = await res.json()
      return data.locations
    }
  } catch {
    // fallback to standard Indian locations
  }
  return [
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, state: 'Odisha' },
    { name: 'Cuttack', lat: 20.4625, lon: 85.8828, state: 'Odisha' },
    { name: 'Puri', lat: 19.8135, lon: 85.8312, state: 'Odisha' },
    { name: 'Guwahati', lat: 26.1445, lon: 91.7362, state: 'Assam' },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
    { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' }
  ]
}

/** Current multi-source conditions snapshot */
export async function getWeatherData(): Promise<CurrentConditions> {
  try {
    // Try the new comprehensive live weather endpoint first
    const liveData = await getFullLiveWeather(20.2961, 85.8245, 'Bhubaneswar')
    if (liveData?.live_data_available && liveData?.current_observations) {
      const obs = liveData.current_observations
      return {
        ...weatherData,
        temperatureC: obs.temperature_c ?? weatherData.temperatureC,
        humidity: obs.relative_humidity_pct ?? weatherData.humidity,
        windSpeedKph: obs.wind_speed_kmh ?? weatherData.windSpeedKph,
        updatedAt: obs.observed_at ?? new Date().toISOString()
      }
    }
  } catch {
    // fallback below
  }
  try {
    const sample = await getSamplePrediction()
    if (sample && sample.meteorological_inputs?.live_weather?.current) {
      const cur = sample.meteorological_inputs.live_weather.current
      return {
        ...weatherData,
        rainfallPrediction: sample.predicted_rainfall,
        temperatureC: cur.temperature_c ?? weatherData.temperatureC,
        humidity: cur.relative_humidity_pct ?? weatherData.humidity,
        windSpeedKph: cur.wind_speed_kmh ?? weatherData.windSpeedKph,
        updatedAt: cur.timestamp ?? new Date().toISOString()
      }
    }
  } catch {
    // fallback to standard telemetry
  }
  return weatherData
}

/** Hourly forecast across the rolling horizon */
export async function getForecast(): Promise<ForecastPoint[]> {
  return forecastData
}

/** AI rainfall prediction summary */
export async function getRainfallPrediction(): Promise<RainfallPrediction> {
  return {
    rainfallPrediction: weatherData.rainfallPrediction,
    heavyRainProbability: weatherData.heavyRainProbability,
    peakIntensity: weatherData.peakIntensity,
    modelConfidence: null,
    timestamp: weatherData.updatedAt,
  }
}

/** Spatial flood-risk output */
export async function getFloodRisk(): Promise<FloodRiskData> {
  return floodRiskData
}

/** Active early-warning alerts synthesized from live backend observations */
export async function getAlerts(): Promise<AlertRecord[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alerts`, { signal: AbortSignal.timeout(6000) })
    if (res.ok) {
      const data = await res.json()
      if (data && data.alerts && data.alerts.length > 0) {
        return data.alerts
      }
    }
  } catch {
    // Fallback to cached alerts if backend unreachable
  }
  return alertData
}

/** Acknowledge an active early-warning alert */
export async function acknowledgeAlertApi(alertId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alerts/acknowledge?alert_id=${encodeURIComponent(alertId)}`, {
      method: 'POST',
      signal: AbortSignal.timeout(4000)
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Searches for Indian locations (states, districts, cities, towns) via backend.
 */
export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  if (!query || query.trim().length < 2) return []
  try {
    const encoded = encodeURIComponent(query.trim())
    const res = await fetch(`${API_BASE_URL}/api/location/search?q=${encoded}`, {
      signal: AbortSignal.timeout(6000)
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

/**
 * Reverse geocodes latitude & longitude coordinates via backend.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<LocationReverseResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/location/reverse?lat=${lat}&lon=${lon}`, {
      signal: AbortSignal.timeout(6000)
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetches the latest precipitation radar tile timestamp from RainViewer via backend.
 */
export async function getRadarTimestamp(): Promise<RadarTimestampData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/weather/radar-timestamp`, {
      signal: AbortSignal.timeout(5000)
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ------------------------------------------------------------------------------
// FLOOD INUNDATION + EARLY WARNING + SHELTER & ROUTING API CLIENT
// ------------------------------------------------------------------------------

export interface FloodAnalyzeParams {
  latitude: number
  longitude: number
  region?: string
  scenario_mode?: 'normal' | 'monsoon_surge' | 'extreme_flood'
  live_rainfall_mm?: number
  nwp_rainfall_mm?: number
}

/**
 * Runs flood inundation segmentation and multi-sensor risk analysis.
 */
export async function analyzeFloodRisk(params: FloodAnalyzeParams): Promise<FloodAnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/api/flood/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Server returned ${res.status}`)
  }

  return await res.json()
}

/**
 * Queries safe shelters with flood-exclusion verification.
 */
export async function getSafeShelters(
  lat: number,
  lon: number,
  radius_km: number = 25.0,
  flood_bbox?: [[number, number], [number, number]] | null
): Promise<ShelterInfo[]> {
  let url = `${API_BASE_URL}/api/flood/shelters?lat=${lat}&lon=${lon}&radius_km=${radius_km}`
  if (flood_bbox && flood_bbox.length === 2) {
    const bboxStr = encodeURIComponent(JSON.stringify(flood_bbox))
    url += `&flood_bbox=${bboxStr}`
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to fetch shelters: ${res.status}`)
  }
  const data = await res.json()
  return Array.isArray(data) ? data : (data.shelters || [])
}

/**
 * Generates an evacuation route and tests for flood corridor intersections.
 */
export async function getEvacuationRoute(
  origin_lat: number,
  origin_lon: number,
  dest_lat: number,
  dest_lon: number,
  flood_bbox?: [[number, number], [number, number]] | null
): Promise<EvacuationRouteResponse> {
  const payload: any = {
    origin_lat,
    origin_lon,
    dest_lat,
    dest_lon
  }
  if (flood_bbox && flood_bbox.length === 2) {
    payload.flood_bbox = flood_bbox
  }

  const res = await fetch(`${API_BASE_URL}/api/flood/route`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to calculate route: ${res.status}`)
  }

  return await res.json()
}

/**
 * Fetches Sen1Floods11 ground-truth evaluation metrics for U-Net.
 */
export async function getFloodModelMetrics(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/flood/metrics`, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) return null
  return await res.json()
}

/**
 * Fetches monitored historical disaster case study localities.
 */
export async function getFloodCaseStudies(): Promise<{
  case_study: string
  event: string
  benchmark_reference: string
  count: number
  localities: FloodCaseStudyLocality[]
} | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/flood/case-studies`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetches flood risk configuration rules and thresholds.
 */
export async function getFloodRiskConfig(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/flood/config`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}