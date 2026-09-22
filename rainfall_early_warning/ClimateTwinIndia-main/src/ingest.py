from pathlib import Path
import numpy as np

# Project root directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Dataset paths
RAIN_PATH = BASE_DIR / "data" / "raw" / "Rainfall_ind2024_rfp25.grd"
TEMP_PATH = BASE_DIR / "data" / "raw" / "Maxtemp_MaxT_2024.GRD"


def load_rainfall():
    """Load IMD rainfall dataset."""

    print(f"Loading rainfall from: {RAIN_PATH}")

    rain = np.fromfile(
        RAIN_PATH,
        dtype=np.float32
    )

    rain = rain.reshape(
        366,
        129,
        135
    )

    rain = np.where(
        rain == -999,
        np.nan,
        rain
    )

    return rain


def load_temperature():
    """Load IMD maximum temperature dataset."""

    print(f"Loading temperature from: {TEMP_PATH}")

    temp = np.fromfile(
        TEMP_PATH,
        dtype=np.float32
    )

    temp = temp.reshape(
        366,
        31,
        31
    )

    temp = np.where(
        temp == 99.9,
        np.nan,
        temp
    )

    return temp