"""
ConvLSTM Postprocessing
========================
Inverse of the training preprocessing pipeline.

Inverse pipeline:
  1. Z-score inverse: x = x * std + mean
  2. expm1: x = exp(x) - 1  (inverse of log1p)
  3. Clip >= 0 (physically, rainfall cannot be negative)

Result is in physical mm/day units.
"""

import numpy as np
import json
import os

_CONFIG_DIR = os.path.join(os.path.dirname(__file__), '..', 'config')


def denormalize_prediction(
    normalized_output: np.ndarray,
    mean: float = None,
    std: float = None
) -> np.ndarray:
    """
    Convert model output back to physical rainfall in mm/day.

    Parameters
    ----------
    normalized_output : np.ndarray
        Model output in normalized space. Any shape.
    mean : float
        Z-score mean from training.
    std : float
        Z-score std from training.

    Returns
    -------
    np.ndarray
        Rainfall in mm/day, same shape as input.
    """
    if mean is None or std is None:
        norm_file = os.path.join(_CONFIG_DIR, 'normalization.json')
        if os.path.exists(norm_file):
            with open(norm_file, 'r') as f:
                stats = json.load(f)
            mean = stats['mean']
            std = stats['std']
        else:
            mean = 0.565701425075531
            std = 1.0578904151916504

    # Step 1: Inverse Z-score
    data = normalized_output * std + mean

    # Step 2: Inverse log1p -> expm1
    data = np.expm1(data)

    # Step 3: Clip to physical range (rainfall >= 0)
    data = np.clip(data, 0, None)

    return data


# IMD standard rainfall thresholds (mm/24h)
# Source: India Meteorological Department / WMO
IMD_THRESHOLDS = {
    'no_rain': 0.0,
    'very_light': 2.5,     # 0.1 - 2.4 mm
    'light': 7.5,          # 2.5 - 7.5 mm (light rain)
    'moderate': 35.5,      # 7.6 - 35.5 mm
    'rather_heavy': 64.4,  # 35.6 - 64.4 mm
    'heavy': 115.5,        # 64.5 - 115.5 mm
    'very_heavy': 204.4,   # 115.6 - 204.4 mm
    'extremely_heavy': float('inf')  # >= 204.5 mm
}


def classify_rainfall_risk(rainfall_mm: float, horizon_hours: int = 24) -> dict:
    """
    Classify rainfall into IMD standard risk categories, scaled dynamically
    for the specific forecast horizon (6h, 12h, 24h, 48h).

    Parameters
    ----------
    rainfall_mm : float
        Forecast rainfall accumulation in mm.
    horizon_hours : int, optional
        Forecast accumulation window in hours (default 24).

    Returns
    -------
    dict with keys: risk_level, risk_color, warning_message, imd_category
    """
    if rainfall_mm is None or np.isnan(rainfall_mm):
        rainfall_mm = 0.0

    # Dynamic scaling for non-24h horizons (sub-daily precipitation intensity scaling)
    if horizon_hours and horizon_hours != 24:
        # Intensity scaling factor based on IDF relationship
        scale = max(0.2, (float(horizon_hours) / 24.0) ** 0.65)
    else:
        scale = 1.0

    t_vlight = 2.5 * scale
    t_light = 7.6 * scale
    t_mod = 35.6 * scale
    t_heavy_watch = 64.5 * scale
    t_vheavy_warn = 115.6 * scale
    t_extreme = 204.5 * scale

    if rainfall_mm < t_vlight:
        return {
            'risk_level': 'NORMAL',
            'risk_color': '#10b981',
            'warning_message': 'No significant rainfall expected.',
            'imd_category': 'No rain / Very light'
        }
    elif rainfall_mm < t_light:
        return {
            'risk_level': 'NORMAL',
            'risk_color': '#10b981',
            'warning_message': 'Light rainfall expected. No weather hazards.',
            'imd_category': 'Light'
        }
    elif rainfall_mm < t_mod:
        return {
            'risk_level': 'NORMAL',
            'risk_color': '#22c55e',
            'warning_message': 'Moderate rainfall expected. Normal monsoon activity.',
            'imd_category': 'Moderate'
        }
    elif rainfall_mm < t_heavy_watch:
        return {
            'risk_level': 'WATCH',
            'risk_color': '#f59e0b',
            'warning_message': 'Rather heavy rainfall expected. Stay updated with weather advisories.',
            'imd_category': 'Rather heavy'
        }
    elif rainfall_mm < t_vheavy_warn:
        return {
            'risk_level': 'WARNING',
            'risk_color': '#f97316',
            'warning_message': 'Heavy rainfall warning. Waterlogging and localized flooding likely.',
            'imd_category': 'Heavy'
        }
    elif rainfall_mm < t_extreme:
        return {
            'risk_level': 'SEVERE',
            'risk_color': '#ef4444',
            'warning_message': 'Very heavy rainfall! High risk of flash floods and inundation.',
            'imd_category': 'Very heavy'
        }
    else:
        return {
            'risk_level': 'EXTREME',
            'risk_color': '#dc2626',
            'warning_message': 'EXTREMELY heavy rainfall! Catastrophic flooding possible. Evacuate low-lying areas.',
            'imd_category': 'Extremely heavy'
        }


def grid_summary_statistics(rainfall_grid: np.ndarray) -> dict:
    """
    Compute summary statistics for a 2D rainfall prediction grid.

    Parameters
    ----------
    rainfall_grid : np.ndarray
        2D array of rainfall in mm/day.

    Returns
    -------
    dict with grid statistics.
    """
    valid = rainfall_grid[~np.isnan(rainfall_grid)]
    if len(valid) == 0:
        return {
            'min_rainfall': 0.0,
            'max_rainfall': 0.0,
            'mean_rainfall': 0.0,
            'median_rainfall': 0.0,
            'std_rainfall': 0.0,
            'heavy_rain_pixel_count': 0,
            'very_heavy_pixel_count': 0,
            'total_valid_pixels': 0
        }

    return {
        'min_rainfall': round(float(np.min(valid)), 2),
        'max_rainfall': round(float(np.max(valid)), 2),
        'mean_rainfall': round(float(np.mean(valid)), 2),
        'median_rainfall': round(float(np.median(valid)), 2),
        'std_rainfall': round(float(np.std(valid)), 2),
        'heavy_rain_pixel_count': int(np.sum(valid >= 64.5)),
        'very_heavy_pixel_count': int(np.sum(valid >= 115.6)),
        'total_valid_pixels': int(len(valid))
    }
