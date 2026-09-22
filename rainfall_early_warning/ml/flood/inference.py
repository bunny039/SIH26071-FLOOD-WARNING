"""
Sentinel-1 SAR Flood Segmentation Inference Engine
==================================================
Production inference manager for the Sentinel-1 SAR Flood Segmentation U-Net.
Provides:
  - Checkpoint discovery and single-load lifecycle management
  - Evaluation mode inference without gradients
  - Sigmoid probability thresholding and spatial metrics calculation
  - Permanent water body exclusion
  - Georeferenced bounding box alignment and base64 transparent PNG overlay generation
  - Honest fail-safe status reporting with zero fabrication
"""

import os
import sys
import io
import base64
import numpy as np
from datetime import datetime
from typing import Dict, Any, Optional, Tuple

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.flood.preprocessing import preprocess_sar_imagery
from ml.flood.postprocessing import threshold_flood_mask, calculate_flood_metrics
from ml.flood.model_builder import (
    weighted_dice_bce_loss,
    dice_coefficient,
    iou_score,
    build_unet
)
from ml.flood.validation_data import SEN1FLOODS11_VALIDATION_METRICS, VIJAYAWADA_CASE_STUDY

_FLOOD_MODEL_DIR = os.path.join(
    _PROJECT_ROOT,
    'Flood-Monitoring-and-Prediction-Using-Satellite-Data-main',
    'model'
)


def mask_to_png_data_uri(
    binary_mask: np.ndarray,
    flood_rgba: Tuple[int, int, int, int] = (239, 68, 68, 175),
    perm_mask: Optional[np.ndarray] = None,
    perm_rgba: Tuple[int, int, int, int] = (59, 130, 246, 150)
) -> str:
    """
    Converts a 2D binary segmentation mask into an RGBA PNG data URI for Leaflet ImageOverlay.
    Non-flooded pixels are 100% transparent.
    """
    try:
        from PIL import Image
        h, w = binary_mask.shape
        rgba = np.zeros((h, w, 4), dtype=np.uint8)

        # Permanent water layer (blue)
        if perm_mask is not None:
            rgba[perm_mask > 0] = perm_rgba

        # Newly flooded layer (red/orange)
        rgba[binary_mask > 0] = flood_rgba

        img = Image.fromarray(rgba, mode='RGBA')
        buffered = io.BytesIO()
        img.save(buffered, format="PNG", optimize=True)
        b64_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        return f"data:image/png;base64,{b64_str}"
    except Exception as e:
        print(f"[InferenceEngine] Warning converting mask to PNG: {e}")
        return ""


class FloodSegmentationInference:
    """
    Inference manager for Sentinel-1 Flood Segmentation U-Net.
    Ensures model is loaded once and operated strictly in evaluation mode.
    """

    def __init__(self):
        self.model = None
        self.is_loaded = False
        self.checkpoint_path = None
        self.load_status = "NOT_LOADED"
        self.load_reason = "Initial state"
        self._find_and_load_checkpoint()

    def _find_and_load_checkpoint(self):
        """Check if any trained weights exist in model directory."""
        possible_paths = [
            os.path.join(_FLOOD_MODEL_DIR, "best_unet_flood.keras"),
            os.path.join(_FLOOD_MODEL_DIR, "flood_unet.keras"),
            os.path.join(_FLOOD_MODEL_DIR, "flood_unet.h5"),
            os.path.join(_FLOOD_MODEL_DIR, "best_flood_model.keras")
        ]

        found_path = None
        for p in possible_paths:
            if os.path.exists(p) and os.path.getsize(p) > 1024:
                found_path = p
                break

        if not found_path:
            self.is_loaded = False
            self.load_status = "NOT_AVAILABLE"
            self.load_reason = (
                "Trained checkpoint (best_unet_flood.keras / flood_unet.keras) not present in repository. "
                "The research model is trained on Sen1Floods11 Sentinel-1 SAR imagery."
            )
            return

        try:
            import tensorflow as tf
            # Load with custom metrics/losses
            custom_objects = {
                'weighted_dice_bce_loss': weighted_dice_bce_loss,
                'dice_coefficient': dice_coefficient,
                'iou_score': iou_score
            }
            self.model = tf.keras.models.load_model(found_path, custom_objects=custom_objects)
            self.checkpoint_path = found_path
            self.is_loaded = True
            self.load_status = "READY"
            self.load_reason = f"Loaded successfully from {os.path.basename(found_path)}"
            print(f"[FloodEngine] U-Net loaded in eval mode from {found_path}")
        except Exception as e:
            self.is_loaded = False
            self.load_status = "ERROR"
            self.load_reason = f"Error loading checkpoint {found_path}: {e}"
            print(f"[FloodEngine] Error loading checkpoint: {e}")

    def get_status(self) -> Dict[str, Any]:
        """Return honest status, architecture specifications, and validation metrics."""
        return {
            "model_name": "Improved Sentinel-1 Flood Segmentation U-Net",
            "architecture": "U-Net 2D CNN (4 Encoders, 1024 Bottleneck, 4 Decoders with Bilinear Upsampling)",
            "framework": "TensorFlow / Keras",
            "training_dataset": "Sen1Floods11 (Sentinel-1 SAR IW GRD)",
            "input_resolution": "512 x 512 x 2 (VV + VH bands in dB)",
            "output_resolution": "512 x 512 x 1 (Sigmoid probability)",
            "checkpoint_found": self.is_loaded,
            "status": self.load_status,
            "details": self.load_reason,
            "checkpoint_path": self.checkpoint_path,
            "validation_metrics": SEN1FLOODS11_VALIDATION_METRICS["primary_metrics"],
            "documentation": "Flood-Monitoring-and-Prediction-Using-Satellite-Data-main/docs/architecture.md"
        }

    def predict_flood_mask(
        self,
        vv_band: np.ndarray,
        vh_band: np.ndarray,
        bounds: Optional[Dict[str, float]] = None,
        perm_water: Optional[np.ndarray] = None,
        threshold: float = 0.5
    ) -> Dict[str, Any]:
        """
        Run legitimate U-Net inference on 2-channel SAR imagery in evaluation mode.
        """
        if not self.is_loaded:
            return {
                "status": "unavailable",
                "flood_detected": False,
                "inundation_percentage": 0.0,
                "inundated_area_km2": 0.0,
                "risk_level": "UNKNOWN",
                "confidence": None,
                "mask_available": False,
                "message": "Flood analysis unavailable — insufficient data (Trained U-Net weights not found in repository).",
                "model_status": self.get_status(),
                "timestamp": datetime.now().isoformat()
            }

        try:
            # 1. Exact Preprocessing pipeline: normalize VV [-30, 0] dB, VH [-35, 0] dB
            input_tensor = preprocess_sar_imagery(vv_band, vh_band, target_size=(512, 512))

            # 2. Evaluation Mode inference: no gradients
            prob_mask = self.model.predict(input_tensor, verbose=0)[0, :, :, 0]

            # 3. Postprocessing thresholding
            binary_mask = threshold_flood_mask(prob_mask, threshold=threshold)

            # 4. Permanent water body exclusion
            cleaned_mask = binary_mask.copy()
            if perm_water is not None and perm_water.shape == binary_mask.shape:
                cleaned_mask[perm_water > 0] = 0

            # 5. Metrics calculation
            metrics = calculate_flood_metrics(cleaned_mask, pixel_resolution_m=10.0)

            # 6. Generate transparent PNG overlay for Leaflet
            overlay_uri = mask_to_png_data_uri(cleaned_mask, perm_mask=perm_water)

            # 7. Geographic bounds format [[south, west], [north, east]]
            geo_bounds = None
            if bounds:
                geo_bounds = [
                    [bounds["min_lat"], bounds["min_lon"]],
                    [bounds["max_lat"], bounds["max_lon"]]
                ]

            return {
                "status": "success",
                "flood_detected": metrics["inundation_percentage"] > 1.0,
                "inundation_percentage": metrics["inundation_percentage"],
                "inundated_area_km2": metrics["inundated_area_km2"],
                "inundated_pixels": metrics["inundated_pixels"],
                "total_pixels": metrics["total_pixels"],
                "flood_severity": metrics["flood_severity"],
                "severity_color": metrics["severity_color"],
                "threshold_used": threshold,
                "mask_available": True,
                "overlay_data_uri": overlay_uri,
                "geographic_bounds": geo_bounds,
                "confidence": None,  # No fabricated confidence; reported as deterministic segmentation
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "flood_detected": False,
                "message": f"Inference execution error: {str(e)}",
                "mask_available": False,
                "confidence": None,
                "timestamp": datetime.now().isoformat()
            }


# Singleton instance
_flood_engine: Optional[FloodSegmentationInference] = None


def get_flood_engine() -> FloodSegmentationInference:
    global _flood_engine
    if _flood_engine is None:
        _flood_engine = FloodSegmentationInference()
    return _flood_engine
