"""
AquaSentinel Meteorological and Hydrological Thresholds
======================================================
Threshold standards defined by India Meteorological Department (IMD)
and Central Water Commission (CWC).
"""

# IMD 24-Hour Rainfall Classification Standards (mm/day)
IMD_RAINFALL_CATEGORIES = {
    "NO_RAIN": {"min": 0.0, "max": 0.0, "label": "No Rain", "severity": 0},
    "VERY_LIGHT": {"min": 0.1, "max": 2.4, "label": "Very Light Rain", "severity": 1},
    "LIGHT": {"min": 2.5, "max": 7.5, "label": "Light Rain", "severity": 1},
    "MODERATE": {"min": 7.6, "max": 35.5, "label": "Moderate Rain", "severity": 2},
    "RATHER_HEAVY": {"min": 35.6, "max": 64.4, "label": "Rather Heavy Rain", "severity": 3},
    "HEAVY": {"min": 64.5, "max": 115.5, "label": "Heavy Rain", "severity": 4},
    "VERY_HEAVY": {"min": 115.6, "max": 204.4, "label": "Very Heavy Rain", "severity": 5},
    "EXTREMELY_HEAVY": {"min": 204.5, "max": float("inf"), "label": "Extremely Heavy Rain", "severity": 6},
}

# Early Warning Color Codes (IMD / NDMA Standard)
EARLY_WARNING_LEVELS = {
    "GREEN": {
        "level": "NORMAL",
        "action": "No warning. Normal activities permitted.",
        "color": "#10b981",
        "composite_score_range": (0, 30)
    },
    "YELLOW": {
        "level": "WATCH",
        "action": "Be updated. Watch weather updates.",
        "color": "#f59e0b",
        "composite_score_range": (31, 55)
    },
    "ORANGE": {
        "level": "ALERT",
        "action": "Be prepared. Waterlogging and minor flooding likely in low-lying zones.",
        "color": "#f97316",
        "composite_score_range": (56, 75)
    },
    "RED": {
        "level": "WARNING",
        "action": "Take action! Severe inundation and flash flood threat imminent. Evacuate vulnerable areas.",
        "color": "#ef4444",
        "composite_score_range": (76, 100)
    }
}
