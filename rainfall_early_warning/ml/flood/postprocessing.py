"""
Flood Segmentation Postprocessing
=================================
Postprocessing pipeline for Sentinel-1 flood segmentation outputs:
  - Probability thresholding (default 0.5) to produce binary flood mask
  - Inundated area calculation (sq km)
  - Flood risk / severity classification
"""

import numpy as np


def threshold_flood_mask(prob_mask: np.ndarray, threshold: float = 0.5) -> np.ndarray:
    """
    Convert raw sigmoid probabilities from U-Net to binary flood mask.

    Parameters
    ----------
    prob_mask : np.ndarray
        Predicted probabilities in [0, 1] range.
    threshold : float
        Decision threshold for flood detection (default: 0.5).

    Returns
    -------
    np.ndarray
        Binary mask (0: dry land, 1: inundated / water body).
    """
    return (prob_mask >= threshold).astype(np.uint8)


def calculate_flood_metrics(
    binary_mask: np.ndarray,
    pixel_resolution_m: float = 10.0
) -> dict:
    """
    Compute flood metrics including inundated area in square kilometers.

    Parameters
    ----------
    binary_mask : np.ndarray
        Binary flood mask (H, W).
    pixel_resolution_m : float
        Spatial resolution per pixel in meters (Sentinel-1 SAR GRD is ~10m).

    Returns
    -------
    dict with inundated pixel count, percentage, and estimated area in sq km.
    """
    total_pixels = int(binary_mask.size)
    inundated_pixels = int(np.sum(binary_mask == 1))
    inundation_percentage = float((inundated_pixels / total_pixels) * 100) if total_pixels > 0 else 0.0

    # Area per pixel = resolution^2 (in m^2) -> divide by 1e6 for km^2
    area_per_pixel_km2 = (pixel_resolution_m ** 2) / 1e6
    inundated_area_km2 = float(inundated_pixels * area_per_pixel_km2)

    if inundation_percentage < 1.0:
        severity = "MINIMAL"
        color = "#10b981"
    elif inundation_percentage < 5.0:
        severity = "MODERATE"
        color = "#f59e0b"
    elif inundation_percentage < 15.0:
        severity = "HIGH"
        color = "#f97316"
    else:
        severity = "CRITICAL"
        color = "#ef4444"

    return {
        "inundated_pixels": inundated_pixels,
        "total_pixels": total_pixels,
        "inundation_percentage": round(inundation_percentage, 2),
        "inundated_area_km2": round(inundated_area_km2, 3),
        "flood_severity": severity,
        "severity_color": color
    }
