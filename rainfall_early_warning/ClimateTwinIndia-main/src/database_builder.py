from src.loaders import load_rainfall, load_temperature
from src.coordinates import rainfall_idx_to_latlon
from src.state_engine import create_climate_state

import numpy as np


def build_climate_states(
    year,
    baseline_rainfall
):

    rain = load_rainfall(year)
    temp = load_temperature(year)

    rain_grid = np.nanmean(
        rain,
        axis=0
    )

    temp_grid = np.nanmean(
        temp,
        axis=0
    )

    mean_temp = np.nanmean(temp_grid)

    temp_grid[np.isnan(temp_grid)] = mean_temp

    anomaly_grid = (
        rain_grid -
        baseline_rainfall
    )

    states = []

    for i in range(129):
        for j in range(135):

            if np.isnan(rain_grid[i, j]):
                continue

            temp_i = min(
                int(i * 31 / 129),
                30
            )

            temp_j = min(
                int(j * 31 / 135),
                30
            )

            lat, lon = rainfall_idx_to_latlon(
                i,
                j
            )

            state = create_climate_state(
                date=str(year),
                latitude=lat,
                longitude=lon,
                rainfall=float(rain_grid[i, j]),
                temperature=float(
                    temp_grid[temp_i, temp_j]
                ),
                completeness_score=1.0,
                anomaly_score=float(
                    anomaly_grid[i, j]
                )
            )

            states.append(state)

    return states