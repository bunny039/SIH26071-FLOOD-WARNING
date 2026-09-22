import numpy as np


def completeness_score(
    rainfall,
    temperature
):
    score = 0

    if not np.isnan(rainfall):
        score += 0.5

    if not np.isnan(temperature):
        score += 0.5

    return score


def anomaly_score(
    rainfall,
    rainfall_mean,
    rainfall_std
):
    z = abs(
        rainfall - rainfall_mean
    ) / rainfall_std

    return z