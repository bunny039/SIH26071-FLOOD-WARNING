import type {
  CurrentConditions,
  AlertRecord,
  DataSource,
  ElevationFeature,
  FloodRiskData,
  ForecastPoint,
  LocationInfo,
  RainfallCell,
  RadarSite,
  RiskZone,
  SystemStatus,
  InfluenceFactor,
} from '../types'

/**
 * Single mock-data boundary for the UI.
 * Every value here is a DEMONSTRATION value. Pages consume data from
 * this file so the ML backend (FastAPI) can replace it later.
 */

/* ------------------------------------------------------------------ */
/* Shell                                                               */
/* ------------------------------------------------------------------ */

export const locations: LocationInfo[] = [
  { id: 'guwahati', name: 'Guwahati', state: 'Assam', country: 'India', latitude: 26.1445, longitude: 91.7362 },
  { id: 'dispur', name: 'Dispur', state: 'Assam', country: 'India', latitude: 26.1433, longitude: 91.7898 },
  { id: 'nalbari', name: 'Nalbari', state: 'Assam', country: 'India', latitude: 26.4438, longitude: 91.4404 },
  { id: 'tezpur', name: 'Tezpur', state: 'Assam', country: 'India', latitude: 26.6523, longitude: 92.7925 },
  { id: 'bongaigaon', name: 'Bongaigaon', state: 'Assam', country: 'India', latitude: 26.4765, longitude: 90.5585 },
  { id: 'jorhat', name: 'Jorhat', state: 'Assam', country: 'India', latitude: 26.7512, longitude: 94.2068 },
]

export const currentLocationId = 'guwahati'

export const systemStatus: SystemStatus = {
  state: 'operational',
  label: 'All systems operational',
  detail: '5 data feeds · nominal',
}

/**
 * Deterministic mock-clock anchor (IST). The header clock ticks forward
 * from this fixed anchor so the demo stays stable regardless of when it
 * is presented.
 */
export const demoClockAnchor = '2026-09-12T10:15:00+05:30'

/* ------------------------------------------------------------------ */
/* Current conditions + forecast                                        */
/* ------------------------------------------------------------------ */

export const weatherData: CurrentConditions = {
  rainfall: 82,
  peakIntensity: 31,
  rainfallPrediction: 82.4,
  heavyRainProbability: 0.87,
  floodProbability: 0.74,
  affectedArea: 12.4,
  riskLevel: 'HIGH',
  forecastHorizon: 6,
  temperatureC: 27.4,
  humidity: 88,
  windSpeedKph: 11,
  updatedAt: '2026-09-12T10:15:00+05:30',
}

/** Hourly forecast across the next 6 hours (sums to 82.4 mm). */
export const forecastData: ForecastPoint[] = [
  { timestamp: '2026-09-12T10:00:00+05:30', hourLabel: '10 AM', rainfall: 4.2, intensity: 12, probability: 0.45, riskLevel: 'MODERATE', riskScore: 38 },
  { timestamp: '2026-09-12T11:00:00+05:30', hourLabel: '11 AM', rainfall: 12.6, intensity: 22, probability: 0.62, riskLevel: 'HIGH', riskScore: 61 },
  { timestamp: '2026-09-12T12:00:00+05:30', hourLabel: '12 PM', rainfall: 21.4, intensity: 31, probability: 0.87, riskLevel: 'HIGH', riskScore: 78 },
  { timestamp: '2026-09-12T13:00:00+05:30', hourLabel: '1 PM', rainfall: 18.8, intensity: 29, probability: 0.84, riskLevel: 'HIGH', riskScore: 74 },
  { timestamp: '2026-09-12T14:00:00+05:30', hourLabel: '2 PM', rainfall: 14.2, intensity: 20, probability: 0.7, riskLevel: 'MODERATE', riskScore: 55 },
  { timestamp: '2026-09-12T15:00:00+05:30', hourLabel: '3 PM', rainfall: 11.2, intensity: 16, probability: 0.58, riskLevel: 'MODERATE', riskScore: 43 },
]

export const riskZones: RiskZone[] = [
  {
    id: 'A',
    name: 'Guwahati City Core',
    riskLevel: 'HIGH',
    floodProbability: 0.91,
    affectedArea: 12.4,
    coordinates: [
      [26.134, 91.7],
      [26.156, 91.704],
      [26.154, 91.752],
      [26.136, 91.748],
      [26.134, 91.7],
    ],
  },
  {
    id: 'B',
    name: 'North Guwahati Riverine',
    riskLevel: 'SEVERE',
    floodProbability: 0.94,
    affectedArea: 8.7,
    coordinates: [
      [26.216, 91.724],
      [26.248, 91.728],
      [26.244, 91.788],
      [26.22, 91.79],
      [26.216, 91.724],
    ],
  },
  {
    id: 'C',
    name: 'Bharalu South Belt',
    riskLevel: 'MODERATE',
    floodProbability: 0.52,
    affectedArea: 5.2,
    coordinates: [
      [26.082, 91.732],
      [26.111, 91.736],
      [26.108, 91.79],
      [26.081, 91.786],
      [26.082, 91.732],
    ],
  },
]

/* __PART2__ */

export const extraRiskZones: RiskZone[] = [
  {
    id: 'D',
    name: 'Goreshwar–Khanapara',
    riskLevel: 'MODERATE',
    floodProbability: 0.48,
    affectedArea: 4.1,
    coordinates: [
      [26.11, 91.802],
      [26.137, 91.806],
      [26.134, 91.854],
      [26.109, 91.85],
      [26.11, 91.802],
    ],
  },
  {
    id: 'E',
    name: 'Amgopara Riverine',
    riskLevel: 'HIGH',
    floodProbability: 0.83,
    affectedArea: 9.6,
    coordinates: [
      [26.198, 91.81],
      [26.227, 91.814],
      [26.224, 91.866],
      [26.199, 91.862],
      [26.198, 91.81],
    ],
  },
  {
    id: 'F',
    name: 'Azara–Palaibari',
    riskLevel: 'LOW',
    floodProbability: 0.22,
    affectedArea: 2.3,
    coordinates: [
      [26.106, 91.602],
      [26.137, 91.606],
      [26.134, 91.646],
      [26.107, 91.642],
      [26.106, 91.602],
    ],
  },
]

/** Combine all six mock zones into the single riskZones export. */
riskZones.push(...extraRiskZones)

export const rainfallCells: RainfallCell[] = [
  { id: 'R1', position: [26.147, 91.741], radius: 2600, intensity: 31 },
  { id: 'R2', position: [26.196, 91.752], radius: 2200, intensity: 22 },
  { id: 'R3', position: [26.116, 91.704], radius: 2000, intensity: 18 },
  { id: 'R4', position: [26.132, 91.822], radius: 1800, intensity: 12 },
  { id: 'R5', position: [26.168, 91.79], radius: 1600, intensity: 26 },
]

export const radarSites: RadarSite[] = [
  { id: 'RAD-01', position: [26.182, 91.812], range: 16000, label: 'Gauhati Radar' },
]

export const elevationFeatures: ElevationFeature[] = [
  {
    id: 'EL-1',
    elevation: 55,
    position: [26.172, 91.702],
    contour: [
      [26.15, 91.694],
      [26.166, 91.694],
      [26.168, 91.71],
      [26.152, 91.712],
      [26.15, 91.694],
    ],
  },
  {
    id: 'EL-2',
    elevation: 74,
    position: [26.162, 91.702],
    contour: [
      [26.154, 91.698],
      [26.162, 91.698],
      [26.163, 91.706],
      [26.155, 91.707],
      [26.154, 91.698],
    ],
  },
  {
    id: 'EL-3',
    elevation: 92,
    position: [26.158, 91.703],
    contour: [
      [26.156, 91.7],
      [26.16, 91.701],
      [26.161, 91.705],
      [26.157, 91.705],
      [26.156, 91.7],
    ],
  },
]

/* ------------------------------------------------------------------ */
/* Data sources                                                         */
/* ------------------------------------------------------------------ */

export const dataSources: DataSource[] = [
  { id: 'imd', code: 'IMD', name: 'IMD', description: 'Weather observations', tone: 'cyan', status: 'available' },
  { id: 'era5', code: 'ERA5', name: 'ERA5', description: 'Atmospheric conditions', tone: 'violet', status: 'available' },
  { id: 'gpm', code: 'GPM', name: 'GPM', description: 'Satellite precipitation', tone: 'green', status: 'available' },
  { id: 'gfs', code: 'GFS', name: 'GFS', description: 'Numerical forecast', tone: 'amber', status: 'available' },
  { id: 'radar', code: 'RADAR', name: 'RADAR', description: 'Precipitation structure', tone: 'rose', status: 'available' },
]

export const floodRiskData: FloodRiskData = {
  topRiskZone: 'Guwahati City Core',
  topZoneFloodProbability: 0.91,
  topZoneAffectedArea: 12.4,
  zones: riskZones,
  timestamp: '2026-09-12T10:15:00+05:30',
}

export const rainfallFactors: InfluenceFactor[] = [
  { label: 'Satellite precipitation', influence: 'High', score: 88 },
  { label: 'Atmospheric humidity', influence: 'High', score: 81 },
  { label: 'NWP forecast', influence: 'Moderate', score: 64 },
  { label: 'Pressure pattern', influence: 'Moderate', score: 57 },
]

export const alertData: AlertRecord[] = [
  { id: 'ALT-241', time: '10:15 IST', location: 'Guwahati', message: 'Heavy rainfall + elevated flood probability', severity: 'SEVERE', window: 'Next 2–3 hours', status: 'Active' },
  { id: 'ALT-240', time: '09:42 IST', location: 'North Guwahati', message: 'Riverine inundation risk increasing', severity: 'HIGH', window: 'Next 4 hours', status: 'Active' },
  { id: 'ALT-239', time: '08:30 IST', location: 'Bharalu South Belt', message: 'Drainage surcharge under rainfall load', severity: 'MODERATE', window: 'Next 6 hours', status: 'Monitoring' },
  { id: 'ALT-238', time: '07:10 IST', location: 'Azara–Palaibari', message: 'Rainfall threshold crossed', severity: 'LOW', window: 'Past event', status: 'Resolved' },
]