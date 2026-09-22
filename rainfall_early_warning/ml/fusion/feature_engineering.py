"""
Meteorological and Inundation Feature Engineering
=================================================
Calculates antecedent moisture conditions, precipitation persistence,
and multi-sensor anomalies.
"""

import numpy as np
from typing import Dict, Any, List


def calculate_antecedent_precipitation_index(rainfall_history_mm: List[float], decay_factor: float = 0.85) -> float:
    """
    Computes Antecedent Precipitation Index (API):
      API = sum_{t=1}^k (k_decay^t * P_t)
    Represents soil moisture memory and saturation prior to the forecast day.
    """
    if not rainfall_history_mm:
        return 0.0

    api = 0.0
    # Reverse so most recent day is t=1
    reversed_history = list(reversed(rainfall_history_mm))
    for t, p in enumerate(reversed_history, start=1):
        if not np.isnan(p) and p > 0:
            api += (decay_factor ** t) * p

    return round(float(api), 2)


def calculate_atmospheric_saturation_index(relative_humidity: float, temperature_c: float) -> float:
    """
    Computes an atmospheric saturation score [0 - 100].
    High humidity + warm tropical temperatures indicate high convective potential.
    """
    if relative_humidity is None:
        return 50.0

    rh_clamped = max(0.0, min(100.0, float(relative_humidity)))
    # If RH > 85%, saturation accelerates
    if rh_clamped >= 85.0:
        saturation_score = 80.0 + (rh_clamped - 85.0) * (20.0 / 15.0)
    else:
        saturation_score = (rh_clamped / 85.0) * 80.0

    return round(float(saturation_score), 2)


def calculate_persistence_index(recent_rainfall_days: List[float], threshold_mm: float = 2.5) -> int:
    """
    Returns the number of consecutive days with rainfall >= threshold_mm immediately preceding today.
    """
    consecutive = 0
    for val in reversed(recent_rainfall_days):
        if not np.isnan(val) and val >= threshold_mm:
            consecutive += 1
        else:
            break
    return consecutive
