"""
Sentinel-1 SAR Preprocessing for Flood Segmentation
==================================================
Preprocessing pipeline matching Sen1Floods11 U-Net specifications:
  - Input: 2 SAR bands (VV and VH backscatter in decibels)
  - Clipping: VV [-30.0, 0.0] dB, VH [-35.0, 0.0] dB
  - Min-Max normalization to [0.0, 1.0] range
  - Spatial resizing/cropping to (512, 512, 2)
"""

import numpy as np


def normalize_sar_band(band_db: np.ndarray, min_db: float, max_db: float) -> np.ndarray:
    """
    Min-max normalize SAR backscatter in dB to [0, 1].
    """
    clipped = np.clip(band_db, min_db, max_db)
    normalized = (clipped - min_db) / (max_db - min_db)
    return np.nan_to_num(normalized, nan=0.0)


def preprocess_sar_imagery(vv_band: np.ndarray, vh_band: np.ndarray, target_size: tuple = (512, 512)) -> np.ndarray:
    """
    Preprocesses Sentinel-1 SAR VV and VH bands for U-Net flood segmentation.

    Parameters
    ----------
    vv_band : np.ndarray
        VV polarization backscatter array (2D) in dB.
    vh_band : np.ndarray
        VH polarization backscatter array (2D) in dB.
    target_size : tuple
        Target spatial dimensions (height, width), default (512, 512).

    Returns
    -------
    np.ndarray
        Shape (1, 512, 512, 2) normalized float32 tensor in range [0, 1].
    """
    # Standard Sen1Floods11 clipping ranges
    vv_norm = normalize_sar_band(vv_band, min_db=-30.0, max_db=0.0)
    vh_norm = normalize_sar_band(vh_band, min_db=-35.0, max_db=0.0)

    # Stack to (H, W, 2)
    stacked = np.stack([vv_norm, vh_norm], axis=-1)

    # Spatial resize if dimensions differ from target
    if stacked.shape[:2] != target_size:
        # Resize using bilinear interpolation or center crop
        from scipy.ndimage import zoom
        zoom_factors = (target_size[0] / stacked.shape[0], target_size[1] / stacked.shape[1], 1.0)
        stacked = zoom(stacked, zoom_factors, order=1)

    # Add batch dimension: (1, 512, 512, 2)
    tensor = np.expand_dims(stacked, axis=0).astype(np.float32)
    return tensor
