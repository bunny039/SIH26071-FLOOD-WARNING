"""
Sentinel-1 SAR Flood Inundation Validation & Case Study Registry
===============================================================
Authoritative validation statistics and real-world disaster case study data:
  1. Sen1Floods11 Benchmark Test Set Metrics (90 scenes, hand-labeled)
  2. September 2024 Vijayawada Flood Disaster Case Study (10 monitored localities)
  3. Ground-truth case bounds and permanent Krishna River water masks
"""

from typing import Dict, Any, List


# ------------------------------------------------------------------------------
# 1. Sen1Floods11 Benchmark Evaluation Metrics (Documented in docs/evaluation.md)
# ------------------------------------------------------------------------------
SEN1FLOODS11_VALIDATION_METRICS: Dict[str, Any] = {
    "benchmark_dataset": "Sen1Floods11 (Sentinel-1 SAR IW GRD 10m)",
    "test_split_size": 90,
    "hand_labeled": True,
    "primary_metrics": {
        "dice_coefficient_f1": 0.7808,
        "iou_jaccard_index": 0.6405,
        "precision": 0.8358,
        "recall_sensitivity": 0.7327,
        "pixel_accuracy": 0.9486,
        "specificity": 0.9794
    },
    "comparison_vs_baseline": {
        "baseline_unet_dice": 0.6500,
        "proposed_unet_dice": 0.7808,
        "dice_gain": "+0.1308 (+20.1%)",
        "baseline_unet_iou": 0.4800,
        "proposed_unet_iou": 0.6405,
        "iou_gain": "+0.1605 (+33.4%)"
    },
    "loss_function": "Weighted Dice + Binary Cross-Entropy (50/50)",
    "flood_class_weight": 8.43,
    "decision_threshold": 0.50
}


# ------------------------------------------------------------------------------
# 2. September 2024 Vijayawada Flood Disaster Case Study Data
# Source: notebook/Flood_Monitoring_and_Prediction_Using_Satellite_Data.ipynb (Cell 40-48)
# ------------------------------------------------------------------------------
VIJAYAWADA_CASE_STUDY: Dict[str, Any] = {
    "event_name": "September 2024 Andhra Pradesh / Budameru River Floods",
    "region_name": "Vijayawada Urban & Floodplain Corridor",
    "state": "Andhra Pradesh",
    "country": "India",
    "full_aoi_bounds": {
        "min_lon": 80.50,
        "min_lat": 16.42,
        "max_lon": 80.75,
        "max_lat": 16.62
    },
    "krishna_river_permanent_water": {
        "description": "JRC Permanent Water body excluded so rivers are not counted as new flood",
        "approx_water_area_km2": 4.12
    },
    "localities": {
        "Budameru Floodplain": {
            "bounds": [80.58, 16.52, 80.64, 16.57],
            "center": [16.545, 80.61],
            "total_area_km2": 3.73,
            "pre_flood_km2": 0.012,
            "during_flood_peak_km2": 0.385,
            "during_flood_pct": 10.32,
            "post_flood_km2": 0.045,
            "drainage_profile": "Rapid recession through floodplain channels"
        },
        "Ajit Singh Nagar": {
            "bounds": [80.62, 16.50, 80.66, 16.53],
            "center": [16.515, 80.64],
            "total_area_km2": 1.48,
            "pre_flood_km2": 0.008,
            "during_flood_peak_km2": 0.284,
            "during_flood_pct": 19.19,
            "post_flood_km2": 0.082,
            "drainage_profile": "Dense urban settlement; severe prolonged waterlogging"
        },
        "Vijayawada City Core": {
            "bounds": [80.60, 16.50, 80.68, 16.56],
            "center": [16.53, 80.64],
            "total_area_km2": 5.92,
            "pre_flood_km2": 0.015,
            "during_flood_peak_km2": 0.312,
            "during_flood_pct": 5.27,
            "post_flood_km2": 0.095,
            "drainage_profile": "Commercial ward; slow storm-drain outflow"
        },
        "Nunna": {
            "bounds": [80.67, 16.52, 80.72, 16.56],
            "center": [16.54, 80.695],
            "total_area_km2": 2.46,
            "pre_flood_km2": 0.005,
            "during_flood_peak_km2": 0.168,
            "during_flood_pct": 6.83,
            "post_flood_km2": 0.022,
            "drainage_profile": "Peri-urban agricultural fringe"
        },
        "Kundavari Kandrika": {
            "bounds": [80.66, 16.55, 80.72, 16.60],
            "center": [16.575, 80.69],
            "total_area_km2": 3.69,
            "pre_flood_km2": 0.010,
            "during_flood_peak_km2": 0.215,
            "during_flood_pct": 5.83,
            "post_flood_km2": 0.038,
            "drainage_profile": "Low-lying agrarian basin"
        },
        "Ambapuram": {
            "bounds": [80.60, 16.56, 80.66, 16.60],
            "center": [16.58, 80.63],
            "total_area_km2": 2.95,
            "pre_flood_km2": 0.006,
            "during_flood_peak_km2": 0.142,
            "during_flood_pct": 4.81,
            "post_flood_km2": 0.018,
            "drainage_profile": "Moderate elevation buffer"
        },
        "Jakkampudi": {
            "bounds": [80.58, 16.56, 80.63, 16.60],
            "center": [16.58, 80.605],
            "total_area_km2": 2.46,
            "pre_flood_km2": 0.004,
            "during_flood_peak_km2": 0.125,
            "during_flood_pct": 5.08,
            "post_flood_km2": 0.014,
            "drainage_profile": "Housing colony catchment"
        },
        "Gollapudi": {
            "bounds": [80.52, 16.52, 80.58, 16.56],
            "center": [16.54, 80.55],
            "total_area_km2": 2.95,
            "pre_flood_km2": 0.007,
            "during_flood_peak_km2": 0.098,
            "during_flood_pct": 3.32,
            "post_flood_km2": 0.012,
            "drainage_profile": "River embankment buffer"
        },
        "Undavalli": {
            "bounds": [80.60, 16.46, 80.66, 16.50],
            "center": [16.48, 80.63],
            "total_area_km2": 2.95,
            "pre_flood_km2": 0.009,
            "during_flood_peak_km2": 0.085,
            "during_flood_pct": 2.88,
            "post_flood_km2": 0.011,
            "drainage_profile": "Southern Krishna bank buffer"
        },
        "Tadepalli": {
            "bounds": [80.60, 16.43, 80.66, 16.47],
            "center": [16.45, 80.63],
            "total_area_km2": 2.95,
            "pre_flood_km2": 0.005,
            "during_flood_peak_km2": 0.056,
            "during_flood_pct": 1.90,
            "post_flood_km2": 0.008,
            "drainage_profile": "Elevated southern ridge"
        }
    }
}


def get_case_study_for_location(lat: float, lon: float) -> Dict[str, Any]:
    """
    Checks if given coordinates fall inside or near known case study areas
    such as Vijayawada/Budameru or other regional floodplains.
    """
    aoi = VIJAYAWADA_CASE_STUDY["full_aoi_bounds"]
    if aoi["min_lat"] - 0.05 <= lat <= aoi["max_lat"] + 0.05 and \
       aoi["min_lon"] - 0.05 <= lon <= aoi["max_lon"] + 0.05:
        # Find closest locality
        closest_name = "Vijayawada City Core"
        min_dist = float('inf')
        for name, data in VIJAYAWADA_CASE_STUDY["localities"].items():
            clat, clon = data["center"]
            dist = (lat - clat) ** 2 + (lon - clon) ** 2
            if dist < min_dist:
                min_dist = dist
                closest_name = name

        return {
            "matched": True,
            "case_study": VIJAYAWADA_CASE_STUDY["event_name"],
            "locality_name": closest_name,
            "locality_data": VIJAYAWADA_CASE_STUDY["localities"][closest_name],
            "aoi_bounds": aoi
        }

    return {"matched": False}
