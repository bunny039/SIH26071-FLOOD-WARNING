from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class PredictionRequest(BaseModel):
    location: str = Field(default="Bhubaneswar", description="Target geographical location")
    forecast_horizon: str = Field(default="24 hours", description="Forecast lead horizon: 6h, 12h, 24h, 48h")
    temperature: float = Field(default=28.5, description="Surface 2m temperature (°C)")
    relative_humidity: float = Field(default=84.0, description="Relative humidity (%)")
    surface_pressure: float = Field(default=1008.2, description="Surface atmospheric pressure (hPa)")
    wind_speed: float = Field(default=18.5, description="10m wind velocity (km/h)")
    total_cloud_cover: float = Field(default=0.75, ge=0.0, le=1.0, description="Fractional total cloud cover (0.0 - 1.0)")
    convective_cape: float = Field(default=1450.0, description="Convective Available Potential Energy (J/kg)")
    dewpoint_temperature: Optional[float] = Field(default=25.2, description="2m dewpoint temperature (°C)")
    day_of_year: Optional[int] = Field(default=200, ge=1, le=366, description="Day of year (1-366)")
    month: Optional[int] = Field(default=7, ge=1, le=12, description="Month of year (1-12)")
    season: Optional[str] = Field(default="live", description="Season or simulation profile: 'live', 'monsoon', 'cyclone', 'winter'")

class ConvLSTMPredictionRequest(BaseModel):
    latitude: float = Field(..., description="Latitude grid index (0-128) or latitude coordinate (6.5-38.5)")
    longitude: float = Field(..., description="Longitude grid index (0-134) or longitude coordinate (66.5-100.0)")
    forecast_horizon: Optional[str] = Field(default="24 hours", description="Forecast horizon: 6h, 12h, 24h, 48h")
    season: Optional[str] = Field(default="live", description="Condition profile: 'live', 'monsoon', 'cyclone', 'winter'")

class ConvLSTMPredictionResponse(BaseModel):
    latitude: int
    longitude: int
    forecast_rainfall_mm: float
    risk_level: str
    risk_color: Optional[str] = "#10b981"
    warning_message: Optional[str] = "Normal operational status"
    model: str = "ConvLSTM (PyTorch)"
    forecast_horizon: str = "24 hours"
    lead_time_hours: Optional[int] = 24
    geographic_coordinates: Optional[Dict[str, float]] = None
    season_profile: Optional[str] = "live"
    is_ocean: Optional[bool] = False
    climatological_mean_mm: Optional[float] = None
    recent_7day_total_mm: Optional[float] = None
    unit: str = "mm"
    data_source: str = "IMD_DailyRainfall_Fixed.nc"


class SpatialGridSummary(BaseModel):
    grid_shape: List[int]
    min_rainfall: float
    max_rainfall: float
    mean_rainfall: float
    high_risk_pixel_count: int

class PredictionResponse(BaseModel):
    location: str
    forecast_horizon: str
    predicted_rainfall: float
    risk_level: str  # NORMAL, WATCH, WARNING, SEVERE
    confidence: Optional[float] = None
    unit: str = "mm"
    model_name: str
    lead_time_hours: int
    risk_color: str
    warning_message: str
    timestamp: str
    grid_summary: SpatialGridSummary
    meteorological_inputs: Dict[str, Any]
    convective_potential_mm: Optional[float] = None
    convlstm_baseline_mm: Optional[float] = None
    hourly_timeline: Optional[List[Dict[str, Any]]] = None
    rate_mm_per_hour: Optional[float] = None
    live_weather_source: Optional[str] = None

class ModelInfoResponse(BaseModel):
    model_name: str
    architecture: str
    parameters: int
    input_channels: int
    spatial_resolution: str
    prediction_type: str
    target_metric: str
    source_repository: str
    data_sources: List[str]
    weights_status: str

class HealthResponse(BaseModel):
    status: str
    version: str
    device: str
    model_loaded: bool
    weights_path: Optional[str]

class CurrentWeatherResponse(BaseModel):
    status: str
    location: str
    latitude: float
    longitude: float
    timezone: str
    temperature_c: Optional[float] = None
    feels_like_c: Optional[float] = None
    condition_text: str
    weather_code: int
    icon: str
    relative_humidity_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    wind_direction_cardinal: str
    wind_gusts_kmh: Optional[float] = None
    surface_pressure_hpa: Optional[float] = None
    visibility_km: Optional[float] = None
    precipitation_mm: Optional[float] = None
    rain_mm: Optional[float] = None
    cloud_cover_pct: Optional[float] = None
    cape_j_kg: Optional[float] = None       # Convective Available Potential Energy (J/kg)
    observed_at: Optional[str] = None
    source: str


class LocationSearchResultItem(BaseModel):
    name: str
    display_name: str
    district: Optional[str] = None
    state: Optional[str] = None
    country: str
    latitude: float
    longitude: float
    importance: Optional[float] = 0.0
    type: Optional[str] = None


class LocationSearchResponse(BaseModel):
    status: str
    query: str
    count: int
    results: List[LocationSearchResultItem]


class LocationReverseResponse(BaseModel):
    status: str
    name: str
    display_name: str
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: str
    latitude: float
    longitude: float


class RadarTimestampResponse(BaseModel):
    status: str
    timestamp: Optional[int] = None
    time_iso: Optional[str] = None
    tile_url: Optional[str] = None
    source: Optional[str] = None
    message: Optional[str] = None


# ------------------------------------------------------------------------------
# FLOOD INUNDATION + EARLY WARNING + SHELTER & ROUTING SCHEMAS
# ------------------------------------------------------------------------------

class FloodAnalyzeRequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    region: Optional[str] = Field(None, description="Optional human-readable region or city name")
    scenario_mode: Optional[str] = Field("current", description="Inference mode: 'current', 'pre_flood', 'peak_flood', 'post_flood'")


class ShelterInfo(BaseModel):
    id: str
    name: str
    type: str
    lat: float
    lon: float
    elevation_m: float
    capacity: int
    contact: str
    state: str
    verified: bool
    distance_km: float
    direction: str
    verification_type: str
    is_clear_of_flood: bool
    safety_status: str
    estimated_travel_time: Dict[str, int]


class EvacuationRouteRequest(BaseModel):
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lon: float = Field(..., ge=-180.0, le=180.0)
    dest_lat: float = Field(..., ge=-90.0, le=90.0)
    dest_lon: float = Field(..., ge=-180.0, le=180.0)
    destination_name: Optional[str] = None


class EvacuationRouteResponse(BaseModel):
    status: str
    is_safe: bool
    safety_status: str
    warning_message: str
    distance_km: float
    duration_minutes: float
    waypoints_count: int
    route_coordinates: List[List[float]]
    flood_intersections_count: int
    routing_engine: str
    safety_verification_protocol: str


class FloodAnalyzeResponse(BaseModel):
    status: str
    location: str
    coordinates: Dict[str, float]
    flood_detected: bool
    inundation_percentage: float
    inundated_area_km2: float
    total_area_km2: Optional[float] = None
    flood_severity: str
    severity_color: str
    mask_available: bool
    overlay_data_uri: Optional[str] = None
    geographic_bounds: Optional[List[List[float]]] = None
    confidence: Optional[float] = None
    risk_assessment: Dict[str, Any]
    model_status: Optional[Dict[str, Any]] = None
    case_study_info: Optional[Dict[str, Any]] = None
    data_provenance: Optional[str] = None
    message: Optional[str] = None
    timestamp: str


