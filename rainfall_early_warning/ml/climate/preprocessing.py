"""
ConvLSTM Preprocessing
=======================
Exact reproduction of the training preprocessing pipeline from:
  - ml/data/dataset.py (RainfallDataset.__init__ + __getitem__)
  - ml/preprocessing/rainfall_preprocessing.py

Pipeline:
  1. Replace fill_value (-999.0) with NaN
  2. Clip rainfall >= 0
  3. log1p transform
  4. Z-score normalize using TRAINING statistics (mean=0.5657, std=1.0579)
  5. Replace NaN with 0.0 in input (to prevent NaN poisoning in ConvLSTM)
  6. Add channel dimension: (seq_len, H, W) -> (1, seq_len, 1, H, W)
"""

import numpy as np
import json
import os

# Training normalization statistics (from ml/config/normalization.json)
# These MUST match the values used during training
_DEFAULT_NORM_STATS = {
    'mean': 0.565701425075531,
    'std': 1.0578904151916504,
    'transformation': 'log1p'
}

_CONFIG_DIR = os.path.join(os.path.dirname(__file__), '..', 'config')


def load_normalization_stats(norm_file=None):
    """
    Load normalization statistics from the training config.
    Falls back to hardcoded defaults if file not found.
    """
    if norm_file is None:
        norm_file = os.path.join(_CONFIG_DIR, 'normalization.json')

    if os.path.exists(norm_file):
        with open(norm_file, 'r') as f:
            stats = json.load(f)
        return stats
    else:
        print(f"[WARNING] Normalization file not found at {norm_file}, using hardcoded defaults.")
        return _DEFAULT_NORM_STATS


def preprocess_rainfall_sequence(
    raw_sequence: np.ndarray,
    fill_value: float = -999.0,
    mean: float = None,
    std: float = None
) -> np.ndarray:
    """
    Apply exact training preprocessing to a raw rainfall sequence.

    Parameters
    ----------
    raw_sequence : np.ndarray
        Shape (seq_len, H, W), raw rainfall in mm/day.
    fill_value : float
        Value to treat as missing data.
    mean : float
        Z-score mean from training. If None, loaded from config.
    std : float
        Z-score std from training. If None, loaded from config.

    Returns
    -------
    np.ndarray
        Shape (1, seq_len, 1, H, W), preprocessed and ready for model input.
    """
    if mean is None or std is None:
        stats = load_normalization_stats()
        mean = stats['mean']
        std = stats['std']

    # Step 1: Replace fill values with NaN
    data = np.where(raw_sequence == fill_value, np.nan, raw_sequence)

    # Step 2: Clip rainfall >= 0 (physically, rainfall cannot be negative)
    data = np.clip(data, a_min=0, a_max=None)

    # Step 3: log1p transformation (log(1 + x))
    # This matches ml/data/dataset.py line 41
    data = np.log1p(data)

    # Step 4: Z-score normalization using TRAINING statistics
    # This matches ml/data/dataset.py line 44
    data = (data - mean) / std

    # Step 5: Replace NaN with 0.0 in input to prevent NaN poisoning
    # This matches ml/data/dataset.py line 80
    data = np.nan_to_num(data, nan=0.0)

    # Step 6: Add batch and channel dimensions
    # (seq_len, H, W) -> (1, seq_len, 1, H, W)
    # This matches ml/data/dataset.py lines 76-77
    data = np.expand_dims(data, axis=(0, 2))

    return data.astype(np.float32)
