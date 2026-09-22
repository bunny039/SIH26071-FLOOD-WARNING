"""
IMD Daily Rainfall Data Loader
===============================
Loads and queries the IMD_DailyRainfall_Fixed.nc dataset.

Grid: 129 lat x 135 lon (0.25 degree resolution)
Lat:  6.5 to 38.5 (India)
Lon:  66.5 to 100.0 (India)
Time: 1901-01-01 to 2023-12-31 (44,925 days)
Variable: 'rainfall' (mm/day)
Fill value: -999.0 (already fixed to valid values in _Fixed.nc)
"""

import os
import threading
import numpy as np
import xarray as xr
from datetime import datetime, timedelta


# Resolve dataset path relative to project root
_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
_DEFAULT_DATASET_PATH = os.path.join(_PROJECT_ROOT, 'IMD_DailyRainfall_Fixed.nc')

# Grid constants (verified from dataset inspection)
IMD_LAT_MIN = 6.5
IMD_LAT_MAX = 38.5
IMD_LON_MIN = 66.5
IMD_LON_MAX = 100.0
IMD_RESOLUTION = 0.25  # degrees
IMD_LAT_SIZE = 129
IMD_LON_SIZE = 135
IMD_FILL_VALUE = -999.0


class IMDDataLoader:
    """
    Loader for IMD Daily Rainfall gridded dataset.
    Caches the dataset handle for efficient repeated queries.
    """

    def __init__(self, dataset_path=None):
        self.dataset_path = dataset_path or _DEFAULT_DATASET_PATH
        self._lock = threading.Lock()
        self._ds = None
        self._lat_values = None
        self._lon_values = None
        self._month_indices = None
        self._historical_cache = {}

    def _ensure_loaded(self):
        """Lazy-load the dataset on first access."""
        with self._lock:
            if self._ds is None:
                if not os.path.exists(self.dataset_path):
                    raise FileNotFoundError(
                        f"IMD dataset not found at: {self.dataset_path}"
                    )
                self._ds = xr.open_dataset(self.dataset_path)
                self._lat_values = self._ds['latitude'].values
                self._lon_values = self._ds['longitude'].values
                try:
                    times = self._ds['time'].values
                    months = np.array([int(str(t)[5:7]) for t in times], dtype=np.int8)
                    self._month_indices = {m: np.where(months == m)[0] for m in range(1, 13)}
                except Exception:
                    self._month_indices = None

    def close(self):
        """Release the dataset handle."""
        with self._lock:
            if self._ds is not None:
                try:
                    self._ds.close()
                except Exception:
                    pass
                self._ds = None

    @property
    def lat_values(self):
        self._ensure_loaded()
        return self._lat_values

    @property
    def lon_values(self):
        self._ensure_loaded()
        return self._lon_values

    def get_land_mask(self) -> np.ndarray:
        """
        Returns boolean 2D array of shape (129, 135) where True indicates
        valid IMD terrestrial land station grid points.
        """
        self._ensure_loaded()
        with self._lock:
            if not hasattr(self, '_land_mask') or self._land_mask is None:
                sample = self._ds['rainfall'].isel(time=-1).values
                self._land_mask = (sample != IMD_FILL_VALUE) & (~np.isnan(sample))
            return self._land_mask

    def index_to_latlon(self, lat_idx: int, lon_idx: int):
        """
        Convert grid indices (0-128, 0-134) to physical latitude and longitude.
        """
        self._ensure_loaded()
        lat_idx = max(0, min(IMD_LAT_SIZE - 1, int(lat_idx)))
        lon_idx = max(0, min(IMD_LON_SIZE - 1, int(lon_idx)))
        return float(self._lat_values[lat_idx]), float(self._lon_values[lon_idx])

    def latlon_to_index(self, lat: float, lon: float):
        """
        Convert geographic coordinates to nearest grid indices.
        Returns (lat_idx, lon_idx) or raises ValueError if out of bounds.
        """
        # Small tolerance (0.05 deg) for floating-point inaccuracies
        if lat < (IMD_LAT_MIN - 0.05) or lat > (IMD_LAT_MAX + 0.05):
            raise ValueError(
                f"Latitude {lat} out of IMD grid range [{IMD_LAT_MIN}, {IMD_LAT_MAX}]"
            )
        if lon < (IMD_LON_MIN - 0.05) or lon > (IMD_LON_MAX + 0.05):
            raise ValueError(
                f"Longitude {lon} out of IMD grid range [{IMD_LON_MIN}, {IMD_LON_MAX}]"
            )

        self._ensure_loaded()
        lat_clamped = max(IMD_LAT_MIN, min(IMD_LAT_MAX, float(lat)))
        lon_clamped = max(IMD_LON_MIN, min(IMD_LON_MAX, float(lon)))
        lat_idx = int(np.argmin(np.abs(self._lat_values - lat_clamped)))
        lon_idx = int(np.argmin(np.abs(self._lon_values - lon_clamped)))
        return lat_idx, lon_idx

    def get_recent_sequence(self, n_days: int = 7) -> np.ndarray:
        """
        Extract the last n_days of rainfall from the dataset.
        Returns shape (n_days, 129, 135) in physical mm/day.
        NaN/fill values preserved as NaN.
        """
        self._ensure_loaded()
        with self._lock:
            data = self._ds['rainfall'].isel(time=slice(-n_days, None)).values  # (n_days, 129, 135)
        # Replace fill values with NaN
        data = np.where(data == IMD_FILL_VALUE, np.nan, data)
        return data.astype(np.float32)

    def get_seasonal_sequence(self, season: str = 'live', n_days: int = 7) -> np.ndarray:
        """
        Extract representative historical seasonal sequences:
          - 'monsoon': Peak Southwest Monsoon (July 2023, index 44755)
          - 'cyclone' / 'flood': Severe Cyclonic Event (Sept 13, 2021 Odisha Flood, index 44085)
          - 'winter' / 'dry': Dry winter baseline (December 2023, end of archive)
          - 'live': Latest available archive slice
        """
        self._ensure_loaded()
        s = (season or 'live').lower()
        if s in ('monsoon', 'monsoon_peak', 'july'):
            t_idx = 44755
        elif s in ('cyclone', 'flood', 'storm', 'depression'):
            t_idx = 44085
        else:
            return self.get_recent_sequence(n_days=n_days)

        with self._lock:
            data = self._ds['rainfall'].isel(time=slice(t_idx - n_days, t_idx)).values
        data = np.where(data == IMD_FILL_VALUE, np.nan, data)
        return data.astype(np.float32)

    def get_rainfall_at_point(self, lat: float, lon: float, n_days: int = 7, season: str = 'live') -> np.ndarray:
        """
        Get time series of rainfall at a specific point for the given season or recent n_days.
        Returns 1D array of shape (n_days,) in mm/day.
        """
        lat_idx, lon_idx = self.latlon_to_index(lat, lon)
        sequence = self.get_seasonal_sequence(season=season, n_days=n_days)
        return sequence[:, lat_idx, lon_idx]

    def get_historical_stats(self, lat: float, lon: float, month: int = None):
        """
        Compute historical statistics for a grid point.
        Returns dict with mean, std, percentiles.
        If month is provided, computes stats for that month only.
        """
        self._ensure_loaded()
        lat_idx, lon_idx = self.latlon_to_index(lat, lon)
        cache_key = (lat_idx, lon_idx, month)
        if cache_key in self._historical_cache:
            return self._historical_cache[cache_key]

        with self._lock:
            data = self._ds['rainfall'][:, lat_idx, lon_idx].values
        data = np.where(data == IMD_FILL_VALUE, np.nan, data)
        data = np.clip(data, 0, None)

        if month is not None:
            if self._month_indices is not None and month in self._month_indices:
                data = data[self._month_indices[month]]
            else:
                with self._lock:
                    times = self._ds['time'].values
                month_mask = np.array([
                    int(str(t)[:7].split('-')[1]) == month
                    for t in times
                ])
                data = data[month_mask]

        valid = data[~np.isnan(data)]
        if len(valid) == 0:
            res = {
                'mean': float('nan'),
                'std': float('nan'),
                'p50': float('nan'),
                'p90': float('nan'),
                'p95': float('nan'),
                'p99': float('nan'),
                'count': 0
            }
        else:
            res = {
                'mean': float(np.mean(valid)),
                'std': float(np.std(valid)),
                'p50': float(np.percentile(valid, 50)),
                'p90': float(np.percentile(valid, 90)),
                'p95': float(np.percentile(valid, 95)),
                'p99': float(np.percentile(valid, 99)),
                'count': int(len(valid))
            }

        self._historical_cache[cache_key] = res
        return res

    def get_recent_accumulation(self, lat: float, lon: float, n_days: int = 7) -> float:
        """
        Get total accumulated rainfall at a point over the last n_days.
        Returns total in mm.
        """
        series = self.get_rainfall_at_point(lat, lon, n_days)
        return float(np.nansum(series))

    def compute_anomaly(self, lat: float, lon: float, current_rainfall: float, month: int):
        """
        Compute rainfall anomaly relative to climatological mean for the given month.
        Returns (anomaly_mm, anomaly_ratio).
        """
        stats = self.get_historical_stats(lat, lon, month=month)
        if np.isnan(stats['mean']) or stats['mean'] == 0:
            return 0.0, 0.0

        anomaly_mm = current_rainfall - stats['mean']
        anomaly_ratio = anomaly_mm / stats['mean']
        return float(anomaly_mm), float(anomaly_ratio)
