"""
AquaSentinel Unified Model Manager
==================================
Central registry and lifecycle manager for all models and analytical engines:
  1. ConvLSTM Spatio-Temporal Rainfall Forecaster (Trained PyTorch Checkpoint)
  2. Sentinel-1 SAR Flood Segmentation U-Net (TensorFlow / Keras)
  3. RainfallForecasting U-Net (Ghana ERA5 Architecture)
  4. ClimateTwinIndia / DARPAN (Statistical State Estimation)
"""

import os
import sys
from typing import Dict, Any

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.climate.inference import get_convlstm_engine
from ml.flood.inference import get_flood_engine
from ml.fusion.risk_engine import RiskFusionEngine
from backend.services.weather_service import WeatherService


class ModelManager:
    """
    Central orchestration point for ML models, meteorological observations,
    and early warning synthesis.
    """

    def __init__(self):
        self.convlstm_engine = get_convlstm_engine()
        self.flood_engine = get_flood_engine()

    def get_system_health_and_models(self) -> Dict[str, Any]:
        """
        Returns an honest, transparent audit of all 4 models in the codebase.
        """
        convlstm_info = self.convlstm_engine.get_model_info()
        flood_info = self.flood_engine.get_status()

        # RainfallForecasting U-Net check
        ghana_models_dir = os.path.join(_PROJECT_ROOT, "RainfallForecasting-main", "Models")
        has_ghana_weights = False
        if os.path.exists(ghana_models_dir):
            for f in os.listdir(ghana_models_dir):
                if f.endswith(('.pth', '.pt', '.bin', '.keras', '.h5')) and os.path.getsize(os.path.join(ghana_models_dir, f)) > 1024:
                    has_ghana_weights = True
                    break

        ghana_info = {
            "model_name": "RainfallForecasting U-Net (Ghana ERA5)",
            "architecture": "U-Net 2D CNN (57 input channels)",
            "framework": "PyTorch",
            "training_region": "Ghana, West Africa (ERA5 + GPM-IMERG)",
            "checkpoint_found": has_ghana_weights,
            "status": "READY" if has_ghana_weights else "UNAVAILABLE",
            "details": "Checkpoint available" if has_ghana_weights else "No trained weights in repository. Model was trained on Ghana, West Africa.",
            "operational_for_india": False
        }

        # ClimateTwinIndia / DARPAN
        darpan_data_dir = os.path.join(_PROJECT_ROOT, "ClimateTwinIndia-main", "data")
        has_darpan_data = os.path.exists(darpan_data_dir)

        darpan_info = {
            "model_name": "ClimateTwinIndia / DARPAN",
            "architecture": "Optimal Interpolation & Statistical Climate State Estimation",
            "framework": "Python / SciPy / NumPy",
            "training_region": "India (IMD Gridded Historical Data)",
            "checkpoint_found": True,  # Statistical model, uses data tables
            "status": "OPERATIONAL" if has_darpan_data else "STANDBY",
            "details": "Statistical assimilation and anomaly framework. Operates directly on historical IMD matrices.",
            "operational_for_india": True
        }

        return {
            "status": "healthy",
            "primary_forecasting_model": "ConvLSTM",
            "models": {
                "convlstm_rainfall": convlstm_info,
                "sentinel1_flood_unet": flood_info,
                "ghana_rainfall_unet": ghana_info,
                "darpan_climatetwin": darpan_info
            }
        }

    def predict_rainfall(self, lat: float, lon: float) -> Dict[str, Any]:
        """
        Run legitimate ConvLSTM forecast for a coordinate.
        """
        return self.convlstm_engine.predict_at_point(lat, lon)

    def predict_full_grid(self) -> Dict[str, Any]:
        """
        Run legitimate ConvLSTM forecast for all of India.
        """
        return self.convlstm_engine.predict_full_grid()

    def get_early_warning_synthesis(
        self,
        lat: float,
        lon: float,
        season: str = 'live',
        convective_potential_mm: float = 0.0,
        horizon_hours: int = 24
    ) -> Dict[str, Any]:
        """
        End-to-end integration:
          1. ConvLSTM Spatio-temporal ML forecast
          2. Live Open-Meteo NWP weather
          3. Antecedent IMD rainfall & climatological anomalies
          4. Fused Risk Score & Warnings for specified horizon
        """
        # Step 1: ConvLSTM ML forecast for requested seasonal footprint
        convlstm_res = self.convlstm_engine.predict_at_point(lat, lon, season=season)
        if convlstm_res.get("status") == "error":
            return convlstm_res

        pred_mm = convlstm_res.get("predicted_rainfall_mm", 0.0)
        hist_context = convlstm_res.get("historical_context", {})

        # Step 2: Live NWP Weather forecast (only for live mode)
        nwp_data = WeatherService.get_weather_forecast(lat, lon) if season == "live" else None

        # Step 3: Recent 7-day rainfall history for the season
        try:
            recent_seq = self.convlstm_engine.imd_loader.get_rainfall_at_point(lat, lon, n_days=7, season=season).tolist()
        except Exception:
            recent_seq = []

        # Scale ConvLSTM baseline to the forecast horizon
        diurnal_fractions = {6: 0.30, 12: 0.55, 24: 1.00, 48: 1.85}
        f_H = diurnal_fractions.get(horizon_hours, horizon_hours / 24.0)
        convlstm_h = round(pred_mm * f_H, 2)

        # Step 4: Multi-sensor Risk Fusion for the specific horizon
        fused = RiskFusionEngine.synthesize_risk(
            convlstm_mm=convlstm_h,
            nwp_data=nwp_data,
            historical_context=hist_context,
            rainfall_history_7d=recent_seq,
            convective_potential_mm=convective_potential_mm,
            horizon_hours=horizon_hours
        )

        return {
            "status": "success",
            "coordinates": {"latitude": lat, "longitude": lon},
            "ml_forecast": {
                "model": "ConvLSTM Rainfall Forecaster (Trained on IMD Gridded Data)",
                "predicted_24h_rainfall_mm": pred_mm,
                "imd_category": convlstm_res.get("imd_category"),
                "forecast_horizon": f"{horizon_hours} Hours",
                "season_profile": season
            },
            "live_weather": nwp_data,
            "historical_context": hist_context,
            "early_warning": fused,
            "data_provenance": {
                "ml_training_data": "IMD_DailyRainfall_Fixed.nc (India Meteorological Department)",
                "nwp_source": "Open-Meteo Numerical Weather Prediction API",
                "risk_standard": "IMD / NDMA Multi-hazard Early Warning Protocol"
            }
        }


# Singleton instance
_model_manager = None


def get_model_manager() -> ModelManager:
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
    return _model_manager
