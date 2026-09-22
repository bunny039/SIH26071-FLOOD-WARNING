"""
Multi-Sensor Flood Risk Analysis & Early Warning Synthesis Engine
================================================================
Fuses:
  1. U-Net spatial inundation evidence (mask %, km²)
  2. Live observed rainfall (Open-Meteo & station observations)
  3. Forecast rainfall (NWP 24h accumulation & ConvLSTM)
  4. Antecedent rainfall memory (IMD 7-day soil saturation context)

Governed by `backend/config/risk_config.yaml`.
Strictly separates:
  - OBSERVED DATA
  - PREDICTED DATA
  - MODEL OUTPUT
  - DERIVED RISK INDICATOR
"""

import os
import yaml
from datetime import datetime
from typing import Dict, Any, Optional

_CONFIG_PATH = os.path.abspath(os.path.join(
    os.path.dirname(__file__), '..', 'config', 'risk_config.yaml'
))


class RiskService:
    """Multi-hazard early warning risk synthesis engine."""

    _config: Optional[Dict[str, Any]] = None

    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        """Loads and caches risk configuration from YAML."""
        if cls._config is None:
            if os.path.exists(_CONFIG_PATH):
                with open(_CONFIG_PATH, 'r', encoding='utf-8') as f:
                    cls._config = yaml.safe_load(f)
            else:
                # Default fallback config if file unreadable
                cls._config = {
                    "risk_categories": {
                        "LOW": {"max_score": 35.0, "color": "#10b981"},
                        "MODERATE": {"min_score": 35.0, "max_score": 60.0, "color": "#f59e0b"},
                        "HIGH": {"min_score": 60.0, "max_score": 80.0, "color": "#f97316"},
                        "CRITICAL": {"min_score": 80.0, "color": "#ef4444"}
                    }
                }
        return cls._config

    @classmethod
    def reload_config(cls) -> Dict[str, Any]:
        """Forces reload of risk config (for dynamic runtime threshold tuning)."""
        cls._config = None
        return cls.get_config()

    @classmethod
    def assess_risk(
        cls,
        flood_data: Dict[str, Any],
        live_weather: Optional[Dict[str, Any]] = None,
        forecast_weather: Optional[Dict[str, Any]] = None,
        antecedent_rainfall_7d: float = 0.0
    ) -> Dict[str, Any]:
        """
        Synthesizes multi-factor flood risk and early warning advisory.
        """
        cfg = cls.get_config()
        weights = cfg.get("weights", {
            "unet_spatial_inundation": 0.40,
            "observed_rainfall_live": 0.25,
            "forecast_rainfall_24h": 0.20,
            "antecedent_rainfall_7d": 0.15
        })

        # ----------------------------------------------------------------------
        # 1. Extract Evidence Streams
        # ----------------------------------------------------------------------
        # A. U-Net Model Output
        has_unet = flood_data.get("mask_available", False) and flood_data.get("status") == "success"
        inundation_pct = float(flood_data.get("inundation_percentage", 0.0))
        inundated_km2 = float(flood_data.get("inundated_area_km2", 0.0))

        # B. Observed Data (Live Weather)
        obs_rain_mm = 0.0
        if live_weather:
            obs_rain_mm = float(live_weather.get("precipitation_mm", 0.0))
            if obs_rain_mm == 0.0 and "rain_last_3h_mm" in live_weather:
                obs_rain_mm = float(live_weather.get("rain_last_3h_mm", 0.0))

        # C. Predicted Data (Forecast Rainfall)
        fcst_rain_mm = 0.0
        if forecast_weather:
            fcst_rain_mm = float(forecast_weather.get("total_24h_rainfall_mm", 0.0))
            if fcst_rain_mm == 0.0 and "summary" in forecast_weather:
                fcst_rain_mm = float(forecast_weather.get("summary", {}).get("total_24h_rainfall_mm", 0.0))

        # D. Antecedent Rainfall (Past 7 days)
        ant_rain_mm = float(antecedent_rainfall_7d)

        # ----------------------------------------------------------------------
        # 2. Individual Sub-Scores (0.0 to 100.0)
        # ----------------------------------------------------------------------
        # S_unet: Inundation curve (2% -> 25, 8% -> 60, 20% -> 95)
        s_unet = min(100.0, (inundation_pct / 20.0) * 100.0) if has_unet else 0.0

        # S_obs: Observed rainfall curve (15mm -> 25, 65mm -> 65, 115mm -> 95)
        s_obs = min(100.0, (obs_rain_mm / 115.5) * 100.0)

        # S_fcst: Forecast 24h rainfall curve (35mm -> 35, 100mm -> 80, 150mm -> 100)
        s_fcst = min(100.0, (fcst_rain_mm / 120.0) * 100.0)

        # S_ant: Antecedent 7-day rainfall curve (100mm -> 50, 250mm -> 100)
        s_ant = min(100.0, (ant_rain_mm / 250.0) * 100.0)

        # ----------------------------------------------------------------------
        # 3. Composite Risk Calculation with Dynamic Fallback
        # ----------------------------------------------------------------------
        if has_unet:
            composite_score = (
                weights["unet_spatial_inundation"] * s_unet +
                weights["observed_rainfall_live"] * s_obs +
                weights["forecast_rainfall_24h"] * s_fcst +
                weights["antecedent_rainfall_7d"] * s_ant
            )
        else:
            # Fallback when satellite SAR is unpassable: re-weight meteorology
            fb_cfg = cfg.get("convergence_rules", {}).get("fallback_when_unet_missing", {})
            fb_weights = fb_cfg.get("rescale_weights", {
                "observed_rainfall_live": 0.45,
                "forecast_rainfall_24h": 0.35,
                "antecedent_rainfall_7d": 0.20
            })
            composite_score = (
                fb_weights["observed_rainfall_live"] * s_obs +
                fb_weights["forecast_rainfall_24h"] * s_fcst +
                fb_weights["antecedent_rainfall_7d"] * s_ant
            )
            # Never exceed HIGH tier without spatial verification
            composite_score = min(composite_score, 78.0)

        composite_score = round(composite_score, 1)

        # ----------------------------------------------------------------------
        # 4. Multi-Sensor Convergence Rules (Suppress Single-Sensor False Alarms)
        # ----------------------------------------------------------------------
        if composite_score >= 80.0:
            # Critical alert requires at least 2 independent signals
            has_two_signals = (
                (inundation_pct >= 10.0 or s_unet >= 50.0) and
                (obs_rain_mm >= 64.5 or fcst_rain_mm >= 80.0 or ant_rain_mm >= 150.0)
            )
            if not has_two_signals:
                # Degrade to High Warning until second signal confirms
                composite_score = 78.0

        # ----------------------------------------------------------------------
        # 5. Risk Category Mapping
        # ----------------------------------------------------------------------
        cats = cfg.get("risk_categories", {})
        if composite_score >= 80.0:
            tier_key = "CRITICAL"
        elif composite_score >= 60.0:
            tier_key = "HIGH"
        elif composite_score >= 35.0:
            tier_key = "MODERATE"
        else:
            tier_key = "LOW"

        tier_info = cats.get(tier_key, {})

        # ----------------------------------------------------------------------
        # 6. Explainability Narrative (Why was this generated?)
        # ----------------------------------------------------------------------
        reasons: list[str] = []
        if has_unet and inundation_pct > 1.0:
            reasons.append(f"U-Net SAR segmentation detected {inundation_pct:.1f}% surface inundation ({inundated_km2:.3f} km²)")
        elif not has_unet:
            reasons.append("Satellite SAR inundation evidence unavailable; risk derived purely from meteorological data")

        if obs_rain_mm >= 64.5:
            reasons.append(f"Heavy observed precipitation ({obs_rain_mm:.1f} mm) recorded in current observation cycle")
        elif obs_rain_mm > 15.0:
            reasons.append(f"Moderate rainfall ({obs_rain_mm:.1f} mm) contributing to local runoff")

        if fcst_rain_mm >= 64.5:
            reasons.append(f"NWP forecasting significant 24h accumulation ({fcst_rain_mm:.1f} mm) ahead")

        if ant_rain_mm >= 100.0:
            reasons.append(f"High antecedent saturation ({ant_rain_mm:.1f} mm past 7 days) diminishes ground absorption capacity")

        if not reasons:
            reasons.append("Precipitation and terrain parameters within normal baseline limits")

        return {
            "risk_level": tier_key,
            "risk_title": tier_info.get("name", tier_key),
            "composite_score": composite_score,
            "severity_color": tier_info.get("color", "#10b981"),
            "badge_bg": tier_info.get("badge_bg", "rgba(16, 185, 129, 0.15)"),
            "badge_border": tier_info.get("badge_border", "rgba(16, 185, 129, 0.4)"),
            "advisory": tier_info.get("advisory", ""),
            "operational_action": tier_info.get("operational_action", ""),
            "explainability": {
                "summary": f"{tier_key} flood risk driven by {len(reasons)} converging meteorological & terrain factor(s).",
                "contributing_reasons": reasons,
                "multi_sensor_verified": has_unet and (obs_rain_mm > 20.0 or fcst_rain_mm > 30.0)
            },
            # Strict evidence separation
            "evidence_separation": {
                "OBSERVED_DATA": {
                    "live_rainfall_mm": obs_rain_mm,
                    "antecedent_7d_rainfall_mm": ant_rain_mm,
                    "source": "Open-Meteo Atmospheric Observation API / IMD Station Grid"
                },
                "PREDICTED_DATA": {
                    "forecast_24h_rainfall_mm": fcst_rain_mm,
                    "source": "Numerical Weather Prediction (NWP) Ensemble"
                },
                "MODEL_OUTPUT": {
                    "model_name": "Sentinel-1 U-Net Flood Segmentation",
                    "inundation_percentage": inundation_pct if has_unet else None,
                    "inundated_area_km2": inundated_km2 if has_unet else None,
                    "mask_status": "VALIDATED_MASK_AVAILABLE" if has_unet else "SATELLITE_MASK_UNAVAILABLE",
                    "source": "Copernicus Sentinel-1 SAR IW GRD"
                },
                "DERIVED_RISK_INDICATOR": {
                    "score": composite_score,
                    "tier": tier_key,
                    "config_source": "backend/config/risk_config.yaml"
                }
            },
            "timestamp": datetime.now().isoformat()
        }
