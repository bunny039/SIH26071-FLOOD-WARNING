import numpy as np

def annual_mean_grid(data):
    return np.nanmean(data, axis=0)

def build_climatology(grids):
    return np.nanmean(np.stack(grids), axis=0)

def compute_anomaly(current, climatology):
    return current - climatology