"""
ConvLSTM Inference Engine
==========================
Legitimate inference using the trained ConvLSTM checkpoint.

This module:
  1. Loads the trained ConvLSTM checkpoint (best_convlstm.pth)
  2. Reads real IMD rainfall data from IMD_DailyRainfall_Fixed.nc
  3. Applies the exact training preprocessing pipeline
  4. Runs model forward pass
  5. Applies exact inverse normalization to get mm/day
  6. Returns physically meaningful predictions with provenance

NO FABRICATION. NO RANDOM DATA. NO DEMO VALUES.
"""

import os
import sys
import json
import torch
import numpy as np
from datetime import datetime

# Add project root to path for imports
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.models.convlstm import RainfallForecaster
from ml.climate.preprocessing import preprocess_rainfall_sequence, load_normalization_stats
from ml.climate.postprocessing import denormalize_prediction, classify_rainfall_risk, grid_summary_statistics
from ml.data.imd_loader import IMDDataLoader


class ConvLSTMInference:
    """
    End-to-end ConvLSTM inference engine.
    Loads the trained model and provides predictions from real IMD data.
    """

    def __init__(self):
        self.model = None
        self.device = None
        self.config = None
        self.norm_stats = None
        self.imd_loader = None
        self.checkpoint_path = None
        self.is_loaded = False
        self.load_error = None
        self._cached_grid_result = None
        self._cache_time = 0

    def load(self):
        """
        Load the trained ConvLSTM model and IMD data.
        Call this once at startup.
        """
        try:
            # Determine device
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

            # Load model config
            config_path = os.path.join(_PROJECT_ROOT, 'ml', 'models', 'checkpoints', 'model_config.json')
            if not os.path.exists(config_path):
                # Fall back to yaml config
                import yaml
                yaml_path = os.path.join(_PROJECT_ROOT, 'ml', 'config', 'config.yaml')
                with open(yaml_path, 'r') as f:
                    self.config = yaml.safe_load(f)
            else:
                with open(config_path, 'r') as f:
                    self.config = json.load(f)

            # Load normalization statistics
            self.norm_stats = load_normalization_stats()

            # Initialize model architecture
            self.model = RainfallForecaster(self.config).to(self.device)

            # Load trained checkpoint
            checkpoint_dir = os.path.join(_PROJECT_ROOT, 'ml', 'models', 'checkpoints')
            self.checkpoint_path = os.path.join(checkpoint_dir, 'best_convlstm.pth')

            if not os.path.exists(self.checkpoint_path):
                raise FileNotFoundError(
                    f"No trained checkpoint found at {self.checkpoint_path}. "
                    "Run training first: python ml/training/train_convlstm.py"
                )

            checkpoint = torch.load(self.checkpoint_path, map_location=self.device, weights_only=False)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            self.model.eval()

            # Extract training metadata
            self._training_epoch = checkpoint.get('epoch', 'unknown')
            self._training_val_loss = checkpoint.get('val_loss', 'unknown')

            # Initialize IMD data loader
            self.imd_loader = IMDDataLoader()

            self.is_loaded = True
            self.load_error = None
            print(f"[ConvLSTM] Model loaded successfully from {self.checkpoint_path}")
            print(f"[ConvLSTM] Trained epoch: {self._training_epoch}, Val loss: {self._training_val_loss}")
            print(f"[ConvLSTM] Device: {self.device}")

        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[ConvLSTM] Failed to load: {e}")

    def predict_full_grid(self, season: str = 'live') -> dict:
        """
        Generate a 1-day rainfall forecast for the entire India grid.

        Parameters
        ----------
        season : str
            'live' (latest available archive slice),
            'monsoon' (July peak monsoon),
            'cyclone' (September 2021 storm event),
            'winter' (December dry baseline)

        Returns
        -------
        dict with:
            - prediction_grid: np.ndarray (129, 135), rainfall in mm/day
            - grid_stats: dict with summary statistics
            - data_timestamp: str, timestamp of the last day of input data
            - model_info: dict with model provenance
        """
        if not self.is_loaded:
            return {
                'status': 'error',
                'message': f'Model not loaded: {self.load_error}',
                'prediction_grid': None
            }

        import time
        now = time.time()
        season_key = (season or 'live').lower()
        if not hasattr(self, '_season_grid_cache'):
            self._season_grid_cache = {}

        if season_key in self._season_grid_cache:
            cached_time, cached_res = self._season_grid_cache[season_key]
            if now - cached_time < 600:
                return cached_res

        seq_len = self.config['model']['sequence_length']  # 7

        # Step 1: Get 7 days of real IMD rainfall data for requested season
        raw_sequence = self.imd_loader.get_seasonal_sequence(season=season_key, n_days=seq_len)
        # raw_sequence shape: (7, 129, 135), physical mm/day

        # Step 2: Apply exact training preprocessing
        model_input = preprocess_rainfall_sequence(
            raw_sequence,
            mean=self.norm_stats['mean'],
            std=self.norm_stats['std']
        )
        # model_input shape: (1, 7, 1, 129, 135), normalized

        # Step 3: Run model inference
        input_tensor = torch.from_numpy(model_input).to(self.device)
        with torch.no_grad():
            output = self.model(input_tensor)
        # output shape: (1, 1, 1, 129, 135)

        # Step 4: Denormalize to physical mm/day
        pred_normalized = output[0, 0, 0].cpu().numpy()  # (129, 135)
        raw_prediction_grid = denormalize_prediction(
            pred_normalized,
            mean=self.norm_stats['mean'],
            std=self.norm_stats['std']
        )

        # Apply IMD land station mask (maritime/ocean points set to NaN)
        land_mask = self.imd_loader.get_land_mask()
        prediction_grid = np.where(land_mask, raw_prediction_grid, np.nan)

        # Step 5: Compute grid statistics across legitimate land points
        grid_stats = grid_summary_statistics(prediction_grid)

        res = {
            'status': 'success',
            'prediction_grid': prediction_grid,
            'raw_prediction_grid': raw_prediction_grid,
            'grid_stats': grid_stats,
            'data_source': 'IMD_DailyRainfall_Fixed.nc',
            'season_profile': season_key,
            'input_sequence_days': seq_len,
            'forecast_horizon': '1 day',
            'model_info': self.get_model_info(),
            'timestamp': datetime.now().isoformat()
        }
        self._season_grid_cache[season_key] = (now, res)
        return res

    def predict_at_point(self, lat: float, lon: float, season: str = 'live') -> dict:
        """
        Generate a 1-day rainfall forecast for a specific lat/lon point.

        Parameters
        ----------
        lat : float
            Latitude (must be within 6.5 to 38.5)
        lon : float
            Longitude (must be within 66.5 to 100.0)
        season : str
            'live', 'monsoon', 'cyclone', 'winter'

        Returns
        -------
        dict with prediction, risk assessment, and provenance.
        """
        if not self.is_loaded:
            return {
                'status': 'error',
                'message': f'Model not loaded: {self.load_error}'
            }

        try:
            # Validate coordinates
            lat_idx, lon_idx = self.imd_loader.latlon_to_index(lat, lon)
        except ValueError as e:
            return {
                'status': 'error',
                'message': str(e)
            }

        # Run full grid prediction (cached per season)
        full_result = self.predict_full_grid(season=season)
        if full_result['status'] != 'success':
            return full_result

        prediction_grid = full_result['prediction_grid']
        point_rainfall = float(prediction_grid[lat_idx, lon_idx])

        # Check if prediction is NaN (ocean pixel or outside IMD terrestrial stations)
        if np.isnan(point_rainfall):
            return {
                'status': 'warning',
                'message': f'Grid point ({round(lat, 2)}°N, {round(lon, 2)}°E) is a maritime/ocean pixel outside IMD land station coverage.',
                'predicted_rainfall_mm': 0.0,
                'risk_level': 'NORMAL',
                'risk_color': '#10b981',
                'warning_message': 'Maritime point outside IMD terrestrial station boundary.',
                'imd_category': 'No rain / Sea surface',
                'latitude': lat,
                'longitude': lon,
                'is_ocean': True,
                'grid_index': {'lat_idx': lat_idx, 'lon_idx': lon_idx}
            }

        # Risk classification
        risk = classify_rainfall_risk(point_rainfall)

        # Get season-appropriate climatological reference month
        s_lower = (season or 'live').lower()
        if s_lower in ('monsoon', 'monsoon_peak', 'july'):
            ref_month = 7
        elif s_lower in ('cyclone', 'flood', 'storm', 'depression'):
            ref_month = 9
        elif s_lower in ('winter', 'dry'):
            ref_month = 12
        else:
            ref_month = datetime.now().month

        historical = self.imd_loader.get_historical_stats(lat, lon, month=ref_month)
        recent_accum = self.imd_loader.get_recent_accumulation(lat, lon, n_days=7)

        # Compute anomaly
        anomaly_mm, anomaly_ratio = self.imd_loader.compute_anomaly(
            lat, lon, point_rainfall, month=ref_month
        )

        mean_mm = 0.0 if np.isnan(historical.get('mean', float('nan'))) else round(historical['mean'], 2)

        return {
            'status': 'success',
            'latitude': lat,
            'longitude': lon,
            'is_ocean': False,
            'grid_index': {'lat_idx': lat_idx, 'lon_idx': lon_idx},
            'predicted_rainfall_mm': round(point_rainfall, 2),
            'risk_level': risk['risk_level'],
            'risk_color': risk['risk_color'],
            'warning_message': risk['warning_message'],
            'imd_category': risk['imd_category'],
            'forecast_horizon': '1 day',
            'unit': 'mm/day',
            'historical_context': {
                'month': ref_month,
                'climatological_mean_mm': mean_mm,
                'anomaly_mm': round(anomaly_mm, 2),
                'anomaly_ratio': round(anomaly_ratio, 3),
                'recent_7day_total_mm': round(recent_accum, 2)
            },
            'grid_stats': full_result['grid_stats'],
            'model_info': full_result['model_info'],
            'data_source': 'IMD_DailyRainfall_Fixed.nc',
            'timestamp': datetime.now().isoformat()
        }

    def get_model_info(self) -> dict:
        """Return model provenance information."""
        info = {
            'model_name': 'ConvLSTM Rainfall Forecaster',
            'architecture': '2-layer ConvLSTM (hidden=[32,64], kernel=3)',
            'framework': 'PyTorch',
            'checkpoint': self.checkpoint_path or 'not loaded',
            'device': str(self.device) if self.device else 'not loaded',
            'input_description': 'IMD daily rainfall, 7-day sequence, 129x135 grid',
            'output_description': '1-day rainfall forecast, 129x135 grid, mm/day',
            'normalization': 'log1p + Z-score (mean=0.566, std=1.058)',
            'training_dataset': 'IMD_DailyRainfall_Fixed.nc (last 1000 days)',
            'is_loaded': self.is_loaded,
            'disclaimer': (
                'Prototype model trained for 2 epochs on 1000 days of IMD data. '
                'Predictions should be treated as research-grade, not operational forecasts.'
            )
        }
        if self.is_loaded:
            info['training_epoch'] = self._training_epoch
            info['training_val_loss'] = (
                round(self._training_val_loss, 6)
                if isinstance(self._training_val_loss, (int, float))
                else self._training_val_loss
            )
            info['total_parameters'] = sum(p.numel() for p in self.model.parameters())
        return info


# Singleton instance for the application
_inference_engine = None


def get_convlstm_engine() -> ConvLSTMInference:
    """Get or create the singleton ConvLSTM inference engine."""
    global _inference_engine
    if _inference_engine is None:
        _inference_engine = ConvLSTMInference()
        _inference_engine.load()
    return _inference_engine
