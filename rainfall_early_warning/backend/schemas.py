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
