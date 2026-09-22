# src/loaders.py

import numpy as np


def load_rainfall(year):

    path = f"../data/raw/rainfall/Rainfall_ind{year}_rfp25.grd"

    rain = np.fromfile(path, dtype=np.float32)

    days = 366 if year in [2020, 2024] else 365

    rain = rain.reshape(days, 129, 135)

    rain[rain == -999] = np.nan

    return rain


def load_temperature(year):

    path = f"../data/raw/temperature/Maxtemp_MaxT_{year}.GRD"

    temp = np.fromfile(path, dtype=np.float32)

    days = 366 if year in [2020, 2024] else 365

    temp = temp.reshape(days, 31, 31)

    temp[temp == 99.9] = np.nan

    return temp