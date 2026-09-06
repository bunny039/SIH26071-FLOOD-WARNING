import type { AlertRecord, CurrentConditions, FloodRiskData, ForecastPoint, RainfallPrediction } from '../types'
import { alertData, floodRiskData, forecastData, weatherData } from '../data/mockData'

/**
 * API boundary for the eventual FastAPI backend.
 * Current implementation resolves mock data with simulated latency so
 * the UI can be built, demoed and swapped to real network calls later.
 */

const latency = (ms = 450) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

/** Current multi-source conditions snapshot. */
export async function getWeatherData(): Promise<CurrentConditions> {
  await latency(500)
  return weatherData
}

/** Hourly forecast across the rolling horizon. */
export async function getForecast(): Promise<ForecastPoint[]> {
  await latency(500)
  return forecastData
}

/** AI rainfall prediction summary. */
export async function getRainfallPrediction(): Promise<RainfallPrediction> {
  await latency(500)
  return {
    rainfallPrediction: weatherData.rainfallPrediction,
    heavyRainProbability: weatherData.heavyRainProbability,
    peakIntensity: weatherData.peakIntensity,
    modelConfidence: 0.89,
    timestamp: weatherData.updatedAt,
  }
}

/** Spatial flood-risk output (highest zone + full zone set). */
export async function getFloodRisk(): Promise<FloodRiskData> {
  await latency(500)
  return floodRiskData
}

/** Active early-warning alerts. */
export async function getAlerts(): Promise<AlertRecord[]> {
  await latency(400)
  return alertData
}