from src.climate_state import ClimateState
import numpy as np


def create_climate_state(
    date,
    latitude,
    longitude,
    rainfall,
    temperature,
    completeness_score,
    anomaly_score
):
    return ClimateState(
        date=date,
        latitude=latitude,
        longitude=longitude,
        rainfall_mm=rainfall,
        max_temperature_c=temperature,
        completeness_score=completeness_score,
        anomaly_score=anomaly_score
    )