import type {
  AlertRecord,
  CurrentConditions,
  FloodRiskData,
  ForecastPoint,
  RainfallPrediction,
  BackendPredictionRequest,
  BackendPredictionResponse,
  BackendModelInfo,
  BackendHealth
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
    const res = await fetch(`${API_BASE_URL}/api/system-status`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Retrieves metadata for the research model from RainfallForecasting-main.
 */
export async function getModelInfo(): Promise<BackendModelInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/model-info`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Runs inference on the U-Net model via FastAPI POST /api/predict.
 * Falls back to demo response if backend is offline.
 */
export async function runModelPrediction(
  params: BackendPredictionRequest
): Promise<{ data: BackendPredictionResponse; isDemo: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`)
    }

    const data: BackendPredictionResponse = await res.json()
    return { data, isDemo: false }
  } catch (err) {
    console.warn('[AquaSentinel] Backend prediction call failed or timed out. Falling back to calibrated DEMO mode.', err)
    
    // Calibrated demo response matching model architecture
    const horizonHours = params.forecast_horizon.includes('6') ? 6 :
      params.forecast_horizon.includes('12') ? 12 :
      params.forecast_horizon.includes('48') ? 48 : 24

    const simRainfall = Math.round((params.relative_humidity / 100) * (params.convective_cape / 20) * (horizonHours / 24) * 10) / 10
    const riskLevel = simRainfall > 115.5 ? 'SEVERE' : simRainfall > 64.5 ? 'WARNING' : simRainfall > 15.5 ? 'WATCH' : 'NORMAL'
    const riskColor = riskLevel === 'SEVERE' ? '#ef4444' : riskLevel === 'WARNING' ? '#f97316' : riskLevel === 'WATCH' ? '#f59e0b' : '#10b981'

    const demoResp: BackendPredictionResponse = {
      location: params.location,
      forecast_horizon: params.forecast_horizon,
      predicted_rainfall: simRainfall,
      risk_level: riskLevel,
      confidence: null, // As required: no fabricated confidence
      unit: 'mm',
      model_name: 'U-Net 2D CNN (DEMO Mode)',
      lead_time_hours: horizonHours,
      risk_color: riskColor,
      warning_message: riskLevel === 'SEVERE'
        ? 'Extremely heavy rainfall predicted! High flash inundation risk.'
        : riskLevel === 'WARNING'
        ? 'Heavy rainfall warning. Localized waterlogging likely.'
        : 'Moderate rainfall expected. Keep monitored.',
      timestamp: new Date().toISOString(),
      grid_summary: {
        grid_shape: [64, 64],
        min_rainfall: Math.max(0, Math.round((simRainfall * 0.8) * 10) / 10),
        max_rainfall: Math.round((simRainfall * 1.25) * 10) / 10,
        mean_rainfall: simRainfall,
        high_risk_pixel_count: simRainfall > 64.5 ? 420 : 0,
      },
      meteorological_inputs: {
        temperature_c: params.temperature,
        relative_humidity_pct: params.relative_humidity,
        surface_pressure_hpa: params.surface_pressure,
        wind_speed_kmh: params.wind_speed,
        total_cloud_cover: params.total_cloud_cover,
        convective_cape_jkg: params.convective_cape,
        dewpoint_c: params.dewpoint_temperature ?? 25.0,
        day_of_year: params.day_of_year ?? 200,
        month: params.month ?? 7,
      },
    }

    return { data: demoResp, isDemo: true }
  }
}

/**
 * Runs a what-if scenario simulation.
 */
export async function runSimulation(
  params: BackendPredictionRequest
): Promise<{ data: BackendPredictionResponse; isDemo: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`)
    }

    const data: BackendPredictionResponse = await res.json()
    return { data, isDemo: false }
  } catch (err) {
    // If backend is offline, just use the demo fallback from runModelPrediction
    return runModelPrediction(params)
  }
}

/**
 * Gets a sample prediction from the FastAPI backend.
 */
export async function getSamplePrediction(): Promise<BackendPredictionResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sample-prediction`, { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Predefined monitoring locations supported by the platform */
export async function getSupportedLocations(): Promise<Array<{ name: string; lat: number; lon: number; state: string }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/locations`, { signal: AbortSignal.timeout(3000) })
    if (res.ok) {
      const data = await res.json()
      return data.locations
    }
  } catch {
    // fallback
  }
  return [
    { name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245, state: 'Odisha' },
    { name: 'Cuttack', lat: 20.4625, lon: 85.8828, state: 'Odisha' },
    { name: 'Puri', lat: 19.8135, lon: 85.8312, state: 'Odisha' },
    { name: 'Guwahati', lat: 26.1445, lon: 91.7362, state: 'Assam' },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  ]
}

/** Current multi-source conditions snapshot */
export async function getWeatherData(): Promise<CurrentConditions> {
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

/** Active early-warning alerts */
export async function getAlerts(): Promise<AlertRecord[]> {
  return alertData
}