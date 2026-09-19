import os
import torch

# Base directories
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
MODEL_REPO_DIR = os.path.join(PROJECT_ROOT, "RainfallForecasting-main")
MODELS_WEIGHTS_DIR = os.path.join(MODEL_REPO_DIR, "Models")

# Compute device
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Model architectural configuration
IN_CHANNELS = 57
OUT_CHANNELS = 64
N_CLASS = 1
GRID_SIZE = 64

# Target precipitation de-normalization parameters (from GPM research study)
GPM_MIN = 0.0
GPM_MAX = 150.0  # mm / 24h

# Standard Rainfall Warning Thresholds (IMD / WMO standard criteria in mm/24h)
THRESHOLD_NORMAL_MAX = 15.5    # 0 - 15.5 mm: Very light to light (NORMAL)
THRESHOLD_WATCH_MAX = 64.4     # 15.6 - 64.4 mm: Moderate (WATCH)
THRESHOLD_WARNING_MAX = 115.5  # 64.5 - 115.5 mm: Heavy rainfall (WARNING)
# > 115.5 mm: Very heavy to extremely heavy rainfall (SEVERE)

DEFAULT_LOCATIONS = {
    "Bhubaneswar": {"lat": 20.2961, "lon": 85.8245, "state": "Odisha"},
    "Cuttack": {"lat": 20.4625, "lon": 85.8828, "state": "Odisha"},
    "Puri": {"lat": 19.8135, "lon": 85.8312, "state": "Odisha"},
    "Guwahati": {"lat": 26.1445, "lon": 91.7362, "state": "Assam"},
    "Kolkata": {"lat": 22.5726, "lon": 88.3639, "state": "West Bengal"},
    "Mumbai": {"lat": 19.0760, "lon": 72.8777, "state": "Maharashtra"},
    "Accra": {"lat": 5.6037, "lon": -0.1870, "state": "Greater Accra"},
    "Kumasi": {"lat": 6.6885, "lon": -1.6244, "state": "Ashanti"}
}
