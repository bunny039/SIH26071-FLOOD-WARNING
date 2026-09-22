"""
AquaSentinel Integrated Risk Fusion Engine
==========================================
Combines outputs from:
  1. ConvLSTM Spatio-temporal Deep Learning rainfall forecast
  2. Live Numerical Weather Prediction (NWP) precipitation & atmospheric observations
  3. Historical IMD Climatological Anomalies and soil saturation memory (API)
  4. Satellite SAR Flood Inundation status (when available)

Produces an explainable Composite Risk Score (0-100) and IMD/NDMA standard color alerts.
"""

from typing import Dict, Any, List
from ml.fusion.thresholds import EARLY_WARNING_LEVELS
from ml.fusion.feature_engineering import (
    calculate_antecedent_precipitation_index,
    calculate_atmospheric_saturation_index,
    calculate_persistence_index
)


class RiskFusionEngine:
    """
    Multi-sensor meteorological & hydrological risk synthesis engine.
    """

    @classmethod
    def synthesize_risk(
        cls,
        convlstm_mm: float,
        nwp_data: Dict[str, Any],
        historical_context: Dict[str, Any],
        rainfall_history_7d: List[float] = None,
        flood_data: Dict[str, Any] = None,
        convective_potential_mm: float = 0.0,
        horizon_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Synthesize multi-modal risk score and actionable warnings,
        calibrated for the specified forecast horizon (6h, 12h, 24h, 48h).
        """
        # Horizon threshold scaling based on IMD sub-daily precipitation intensity standards
        if horizon_hours <= 6:
            thresh_mod = 5.0
            thresh_heavy = 18.0
            thresh_vheavy = 40.0
            horizon_nwp_key = "expected_6h_precipitation_mm"
        elif horizon_hours <= 12:
            thresh_mod = 10.0
            thresh_heavy = 35.0
            thresh_vheavy = 70.0
            horizon_nwp_key = "expected_12h_precipitation_mm"
        elif horizon_hours >= 48:
            thresh_mod = 30.0
            thresh_heavy = 100.0
            thresh_vheavy = 180.0
            horizon_nwp_key = "expected_48h_precipitation_mm"
        else:
            thresh_mod = 15.6
            thresh_heavy = 64.5
            thresh_vheavy = 115.5
            horizon_nwp_key = "expected_24h_precipitation_mm"

        # 1. ConvLSTM Contribution (0 - 45 points)
        convlstm_safe = max(0.0, float(convlstm_mm))
        if convlstm_safe < (thresh_mod * 0.2):
            convlstm_score = (convlstm_safe / max(0.1, thresh_mod * 0.2)) * 5.0
        elif convlstm_safe < thresh_mod:
            convlstm_score = 5.0 + ((convlstm_safe - thresh_mod * 0.2) / max(0.1, thresh_mod * 0.8)) * 15.0
        elif convlstm_safe < thresh_heavy:
            convlstm_score = 20.0 + ((convlstm_safe - thresh_mod) / max(0.1, thresh_heavy - thresh_mod)) * 10.0
        elif convlstm_safe < thresh_vheavy:
            convlstm_score = 30.0 + ((convlstm_safe - thresh_heavy) / max(0.1, thresh_vheavy - thresh_heavy)) * 10.0
        else:
            convlstm_score = min(45.0, 40.0 + ((convlstm_safe - thresh_vheavy) / max(0.1, thresh_vheavy * 0.8)) * 5.0)

        # 2. NWP & Live Weather / Convective Contribution (0 - 30 points)
        nwp_precip = 0.0
        nwp_prob = 0.0
        humidity = 50.0
        if nwp_data and nwp_data.get("status") == "success":
            summary = nwp_data.get("nwp_forecast_summary", {})
            nwp_precip = summary.get(horizon_nwp_key, 0.0) or 0.0
            if nwp_precip == 0.0 and summary.get("expected_24h_precipitation_mm"):
                nwp_precip = summary.get("expected_24h_precipitation_mm", 0.0) * (horizon_hours / 24.0)
            nwp_prob = summary.get("max_precip_probability_today_pct", 0.0) or 0.0
            humidity = nwp_data.get("current", {}).get("relative_humidity_pct", 50.0) or 50.0

        # Convective enhancement for the horizon
        effective_atmos_rain = max(nwp_precip, convective_potential_mm)

        # NWP / Convective Precip points (up to 20 pts)
        nwp_precip_score = min(20.0, (effective_atmos_rain / max(1.0, thresh_heavy)) * 20.0)
        # Probability & Humidity points (up to 10 pts, only if live NWP data is present)
        prob_humidity_score = ((nwp_prob / 100.0) * 5.0 + (humidity / 100.0) * 5.0) if nwp_data else 0.0
        nwp_total_score = min(30.0, nwp_precip_score + prob_humidity_score)

        # 3. Antecedent Moisture & Hydrological Memory (0 - 25 points)
        history = rainfall_history_7d or []
        api = calculate_antecedent_precipitation_index(history)
        persistence_days = calculate_persistence_index(history)
        anomaly_ratio = historical_context.get("anomaly_ratio", 0.0) if historical_context else 0.0

        api_score = min(15.0, (api / 100.0) * 15.0)
        persistence_score = min(5.0, persistence_days * 1.5)
        anomaly_score = min(5.0, max(0.0, anomaly_ratio) * 2.5)
        hydro_score = min(25.0, api_score + persistence_score + anomaly_score)

        # Total Composite Risk Score (0 - 100)
        composite_score = round(min(100.0, convlstm_score + nwp_total_score + hydro_score), 1)

        # Enforce physical rainfall floors so severe local signals are never masked
        max_rain_signal = max(convlstm_safe, effective_atmos_rain)
        if max_rain_signal >= thresh_vheavy:
            composite_score = max(composite_score, 78.0)
        elif max_rain_signal >= thresh_heavy:
            composite_score = max(composite_score, 58.0)
        elif max_rain_signal >= thresh_mod:
            composite_score = max(composite_score, 36.0)

        # Determine Early Warning Level
        if composite_score <= 30.0:
            level_key = "GREEN"
        elif composite_score <= 55.0:
            level_key = "YELLOW"
        elif composite_score <= 75.0:
            level_key = "ORANGE"
        else:
            level_key = "RED"

        warning_info = EARLY_WARNING_LEVELS[level_key]

        # Determine Primary Risk Driver
        atmos_label = "NWP Weather Forecast & Atmosphere" if nwp_data else "Thermodynamic Convective Instability (CAPE)"
        scores = {
            "Deep Learning Forecast (ConvLSTM)": convlstm_score,
            atmos_label: nwp_total_score,
            "Soil Moisture & Antecedent Accumulation": hydro_score
        }
        primary_driver = max(scores, key=scores.get)

        # Generate Actionable Advisories for the specific horizon
        advisories = cls._generate_advisories(level_key, convlstm_safe, api, nwp_precip, horizon_hours)

        return {
            "composite_risk_score": composite_score,
            "alert_level": warning_info["level"],
            "alert_code": level_key,
            "alert_color": warning_info["color"],
            "recommended_action": warning_info["action"],
            "primary_driver": primary_driver,
            "horizon_hours": horizon_hours,
            "subscores": {
                "convlstm_score": round(convlstm_score, 1),
                "nwp_score": round(nwp_total_score, 1),
                "hydrological_memory_score": round(hydro_score, 1)
            },
            "hydrological_indicators": {
                "antecedent_precipitation_index": api,
                "consecutive_rain_days": persistence_days,
                "atmospheric_saturation_index": calculate_atmospheric_saturation_index(humidity, 30.0)
            },
            "advisories": advisories
        }

    @staticmethod
    def _generate_advisories(level_key: str, convlstm_mm: float, api: float, nwp_precip: float, horizon_hours: int = 24) -> List[str]:
        h_str = f"{horizon_hours}h"
        advisories = []
        if level_key == "RED":
            advisories.append(f"EMERGENCY ALERT: Extremely heavy rainfall and severe flood risk over next {h_str}. Mobilize NDRF/SDRF units.")
            advisories.append("Issue immediate evacuation warnings for low-lying and riverine settlements.")
            advisories.append("Close flood-prone underpasses and suspend vehicular traffic in waterlogged corridors.")
        elif level_key == "ORANGE":
            advisories.append(f"PREPAREDNESS ALERT: Heavy rainfall expected over next {h_str}. Water supply and drainage teams on high standby.")
            advisories.append("Clear stormwater catch basins and inspect culverts in vulnerable urban zones.")
            advisories.append("Advise citizens to avoid travel through known water accumulation spots.")
        elif level_key == "YELLOW":
            advisories.append(f"WATCH: Moderate rainfall activity expected over next {h_str}. Keep disaster management channels open.")
            advisories.append("Monitor localized weather radar and river discharge gauges.")
        else:
            advisories.append(f"NORMAL: Routine meteorological conditions across next {h_str}. Normal operational protocol.")

        if api > 60.0:
            advisories.append(f"High antecedent soil saturation (API: {api}mm). Runoff coefficient is elevated.")

        return advisories
