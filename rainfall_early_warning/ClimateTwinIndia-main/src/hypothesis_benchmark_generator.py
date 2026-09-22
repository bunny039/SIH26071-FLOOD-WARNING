"""
ClimateTwinBench-Hypothesis
===========================

Deterministic scientific hypothesis verification over gridded climate
state data. Every answer is computed from the ClimateTwinIndia processed
dataset and every protocol is printed in the question.

Run from repository root or src/:
    python src/hypothesis_benchmark_generator.py

Outputs:
    benchmark/ClimateTwinBench_Hypothesis.json
    benchmark/ClimateTwinBench_Hypothesis_public.json
"""

from __future__ import annotations

import json
import math
import random
import re
from collections import Counter, defaultdict, deque
from pathlib import Path

import numpy as np
import pandas as pd


YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
N_PER_SUBCATEGORY = 40
RNG_SEED = 20260626

SUBCATEGORIES = [
    "persistent_regional_anomaly_verification",
    "localized_intensification_verification",
    "wet_anomaly_consistency_verification",
    "compound_state_transition_verification",
    "spatial_coherence_verification",
    "reliability_aware_claim_verification",
]

FORBIDDEN_PATTERNS = [
    r"paris agreement",
    r"pre.?industrial",
    r"\benso\b",
    r"el ni.?o",
    r"la ni.?a",
    r"monsoon",
    r"hydrological impact",
    r"water budget",
    r"crop",
    r"agricultur",
    r"public health",
    r"policy",
    r"disaster",
    r"external",
]


def repo_root() -> Path:
    here = Path(__file__).resolve()
    return here.parents[1] if here.parent.name == "src" else here.parent


def to_py(obj):
    if isinstance(obj, dict):
        return {k: to_py(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [to_py(v) for v in obj]
    if isinstance(obj, tuple):
        return [to_py(v) for v in obj]
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.bool_):
        return bool(obj)
    return obj


def r4(x: float) -> float:
    return round(float(x), 4)


def fmt(x: float) -> str:
    return f"{float(x):.4f}"


def fmt_signed(x: float) -> str:
    return f"{float(x):+.4f}"


def stable_seed(*parts) -> int:
    text = "|".join(str(p) for p in parts)
    acc = 2166136261
    for ch in text:
        acc ^= ord(ch)
        acc = (acc * 16777619) & 0xFFFFFFFF
    return acc


def make_options(correct_text: str, distractors: list[str], seed: int):
    unique = []
    for item in [correct_text] + distractors:
        if item not in unique:
            unique.append(item)
    if len(unique) < 3:
        raise ValueError("Need at least three unique answer options")
    pool = unique[:4]
    random.Random(seed & 0xFFFFFFFF).shuffle(pool)
    opts = dict(zip("ABCD"[: len(pool)], pool))
    ans = next(k for k, v in opts.items() if v == correct_text)
    return opts, ans


def load_dataset(root: Path) -> pd.DataFrame:
    frames = []
    for year in YEARS:
        path = root / "data" / "processed" / f"climate_states_{year}.csv"
        df = pd.read_csv(path)
        df["year"] = year
        frames.append(df)
    data = pd.concat(frames, ignore_index=True)
    data["latitude"] = data["latitude"].round(2)
    data["longitude"] = data["longitude"].round(2)
    return data


def build_wide(data: pd.DataFrame) -> pd.DataFrame:
    rows = {}
    for (lat, lon), group in data.groupby(["latitude", "longitude"]):
        if set(group["year"]) != set(YEARS):
            continue
        row = {"latitude": float(lat), "longitude": float(lon)}
        group = group.set_index("year")
        for year in YEARS:
            g = group.loc[year]
            row[f"anomaly_{year}"] = float(g["anomaly_score"])
            row[f"abs_anomaly_{year}"] = abs(float(g["anomaly_score"]))
            row[f"rainfall_{year}"] = float(g["rainfall_mm"])
            row[f"temperature_{year}"] = float(g["max_temperature_c"])
            row[f"completeness_{year}"] = float(g["completeness_score"])
        rows[(round(lat, 2), round(lon, 2))] = row
    return pd.DataFrame(rows.values()).sort_values(["latitude", "longitude"]).reset_index(drop=True)


def percentile(values, q):
    return float(np.percentile(np.asarray(values, dtype=float), q))


def compute_thresholds(data: pd.DataFrame, wide: pd.DataFrame) -> dict:
    thresholds = {
        "yearly_abs_anomaly": {},
        "yearly_signed_anomaly": {},
        "global_completeness": {},
    }
    for year in YEARS:
        y = data[data["year"] == year]
        abs_a = np.abs(y["anomaly_score"].to_numpy(dtype=float))
        signed = y["anomaly_score"].to_numpy(dtype=float)
        thresholds["yearly_abs_anomaly"][str(year)] = {
            "p25": r4(percentile(abs_a, 25)),
            "p50": r4(percentile(abs_a, 50)),
            "p75": r4(percentile(abs_a, 75)),
            "p80": r4(percentile(abs_a, 80)),
            "p85": r4(percentile(abs_a, 85)),
            "p90": r4(percentile(abs_a, 90)),
        }
        thresholds["yearly_signed_anomaly"][str(year)] = {
            "p25": r4(percentile(signed, 25)),
            "p50": r4(percentile(signed, 50)),
            "p75": r4(percentile(signed, 75)),
        }
    comp = data["completeness_score"].to_numpy(dtype=float)
    thresholds["global_completeness"] = {
        "p10": r4(percentile(comp, 10)),
        "p25": r4(percentile(comp, 25)),
        "p50": r4(percentile(comp, 50)),
    }
    thresholds["candidate_distributions"] = {}
    return thresholds


def coord_key(lat: float, lon: float) -> tuple[float, float]:
    return (round(float(lat), 2), round(float(lon), 2))


def build_regions(wide: pd.DataFrame):
    coords = {coord_key(r.latitude, r.longitude) for r in wide.itertuples()}
    regions_3x3 = []
    regions_5x5 = []
    offsets_3 = [(di * 0.25, dj * 0.25) for di in [-1, 0, 1] for dj in [-1, 0, 1]]
    offsets_5 = [(di * 0.25, dj * 0.25) for di in [-2, -1, 0, 1, 2] for dj in [-2, -1, 0, 1, 2]]
    for lat, lon in sorted(coords):
        reg3 = [coord_key(lat + dlat, lon + dlon) for dlat, dlon in offsets_3]
        reg5 = [coord_key(lat + dlat, lon + dlon) for dlat, dlon in offsets_5]
        if all(c in coords for c in reg3):
            border = [c for c in reg5 if c not in set(reg3) and c in coords]
            if len(border) >= 8:
                regions_3x3.append({"center": (lat, lon), "cells": reg3, "border": border})
        if all(c in coords for c in reg5):
            regions_5x5.append({"center": (lat, lon), "cells": reg5})
    return regions_3x3, regions_5x5


class ClimateLookup:
    def __init__(self, wide: pd.DataFrame):
        self.by_coord = {
            coord_key(row["latitude"], row["longitude"]): row.to_dict()
            for _, row in wide.iterrows()
        }

    def values(self, cells, field: str, year: int) -> np.ndarray:
        return np.asarray([self.by_coord[c][f"{field}_{year}"] for c in cells], dtype=float)

    def anomaly(self, cells, year: int) -> np.ndarray:
        return self.values(cells, "anomaly", year)

    def abs_anomaly(self, cells, year: int) -> np.ndarray:
        return np.abs(self.anomaly(cells, year))

    def rainfall(self, cells, year: int) -> np.ndarray:
        return self.values(cells, "rainfall", year)

    def temperature(self, cells, year: int) -> np.ndarray:
        return self.values(cells, "temperature", year)

    def completeness(self, cells, year: int) -> np.ndarray:
        return self.values(cells, "completeness", year)


def region_label(region) -> str:
    lat, lon = region["center"]
    return f"region centered at ({lat:.2f}N, {lon:.2f}E)"


def coords_summary(cells) -> str:
    ordered = sorted(cells)
    return "; ".join(f"({lat:.2f},{lon:.2f})" for lat, lon in ordered)


def classify_with_thresholds(metrics: dict, protocol: dict) -> str:
    sub = protocol["subcategory"]
    t = protocol["thresholds"]

    if sub == "persistent_regional_anomaly_verification":
        support = (
            metrics["min_yearly_mean_abs_anomaly"] >= t["support_mean_abs_p75"]
            and metrics["min_fraction_cells_above_p75"] >= t["support_fraction_above_p75"]
            and metrics["min_yearly_mean_completeness"] >= t["support_completeness_p10"]
        )
        refute = (
            metrics["min_yearly_mean_abs_anomaly"] <= t["refute_mean_abs_p50"]
            or metrics["min_fraction_cells_above_p75"] <= t["refute_fraction_above_p75"]
            or metrics["min_yearly_mean_completeness"] < t["support_completeness_p10"]
        )
    elif sub == "localized_intensification_verification":
        support = (
            metrics["regional_abs_anomaly_change"] >= t["support_regional_change_q60"]
            and metrics["localized_contrast_change"] >= t["support_contrast_change_q75"]
            and metrics["regional_rainfall_change"] >= t["support_rainfall_change_q60"]
        )
        refute = (
            metrics["regional_abs_anomaly_change"] <= t["refute_regional_change_q25"]
            or metrics["localized_contrast_change"] <= t["refute_contrast_change_q25"]
            or metrics["regional_rainfall_change"] <= t["refute_rainfall_change_q25"]
        )
    elif sub == "wet_anomaly_consistency_verification":
        support = (
            metrics["mean_signed_anomaly_later_year"] >= t["support_signed_anomaly_p75"]
            and metrics["regional_rainfall_change"] >= t["support_rainfall_change_q75"]
            and metrics["fraction_cells_rainfall_increased"] >= t["support_fraction_increase_q75"]
        )
        refute = (
            metrics["mean_signed_anomaly_later_year"] <= t["refute_signed_anomaly_p25"]
            or (
                metrics["mean_signed_anomaly_later_year"] >= t["support_signed_anomaly_p75"]
                and (
                    metrics["regional_rainfall_change"] <= t["refute_rainfall_change_q25"]
                    or metrics["fraction_cells_rainfall_increased"] <= t["refute_fraction_increase_q25"]
                )
            )
        )
    elif sub == "compound_state_transition_verification":
        support = (
            metrics["regional_rainfall_change"] >= t["support_rainfall_change_q66"]
            and metrics["regional_temperature_change"] >= t["support_temperature_change_q66"]
        )
        refute = (
            metrics["regional_rainfall_change"] <= t["refute_rainfall_change_q33"]
            or metrics["regional_temperature_change"] <= t["refute_temperature_change_q33"]
        )
    elif sub == "spatial_coherence_verification":
        support = (
            metrics["active_cell_count"] >= t["support_active_count_min"]
            and metrics["largest_component_size"] >= t["support_largest_component_min"]
            and metrics["component_count"] <= t["support_component_count_max"]
        )
        refute = (
            metrics["active_cell_count"] <= t["refute_active_count_max"]
            or metrics["largest_component_size"] <= t["refute_largest_component_max"]
            or metrics["component_count"] >= t["refute_component_count_min"]
        )
    elif sub == "reliability_aware_claim_verification":
        support = (
            metrics["mean_abs_anomaly"] >= t["support_mean_abs_q85"]
            and metrics["mean_completeness"] >= t["support_completeness_p50"]
        )
        refute = metrics["mean_abs_anomaly"] <= t["refute_mean_abs_q50"]
    else:
        raise ValueError(f"Unknown subcategory: {sub}")

    if support and not refute:
        return "SUPPORTED"
    if refute and not support:
        return "REFUTED"
    if support and refute:
        return "AMBIGUOUS"
    return "INSUFFICIENT"


def has_boundary_tie(metrics: dict, protocol: dict) -> bool:
    """Reject examples whose decisive non-degenerate metrics land exactly on a threshold."""
    sub = protocol["subcategory"]
    t = protocol["thresholds"]
    pairs = {
        "persistent_regional_anomaly_verification": [
            ("min_yearly_mean_abs_anomaly", "support_mean_abs_p75"),
            ("min_yearly_mean_abs_anomaly", "refute_mean_abs_p50"),
            ("min_fraction_cells_above_p75", "support_fraction_above_p75"),
        ],
        "localized_intensification_verification": [
            ("regional_abs_anomaly_change", "support_regional_change_q60"),
            ("regional_abs_anomaly_change", "refute_regional_change_q25"),
            ("localized_contrast_change", "support_contrast_change_q75"),
            ("localized_contrast_change", "refute_contrast_change_q25"),
            ("regional_rainfall_change", "support_rainfall_change_q60"),
            ("regional_rainfall_change", "refute_rainfall_change_q25"),
        ],
        "wet_anomaly_consistency_verification": [
            ("mean_signed_anomaly_later_year", "support_signed_anomaly_p75"),
            ("mean_signed_anomaly_later_year", "refute_signed_anomaly_p25"),
            ("regional_rainfall_change", "support_rainfall_change_q75"),
            ("regional_rainfall_change", "refute_rainfall_change_q25"),
            ("fraction_cells_rainfall_increased", "support_fraction_increase_q75"),
            ("fraction_cells_rainfall_increased", "refute_fraction_increase_q25"),
        ],
        "compound_state_transition_verification": [
            ("regional_rainfall_change", "support_rainfall_change_q66"),
            ("regional_rainfall_change", "refute_rainfall_change_q33"),
            ("regional_temperature_change", "support_temperature_change_q66"),
            ("regional_temperature_change", "refute_temperature_change_q33"),
        ],
        "spatial_coherence_verification": [
            ("active_cell_count", "support_active_count_min"),
            ("active_cell_count", "refute_active_count_max"),
            ("largest_component_size", "support_largest_component_min"),
            ("largest_component_size", "refute_largest_component_max"),
            ("component_count", "support_component_count_max"),
            ("component_count", "refute_component_count_min"),
        ],
        "reliability_aware_claim_verification": [
            ("mean_abs_anomaly", "support_mean_abs_q85"),
            ("mean_abs_anomaly", "refute_mean_abs_q50"),
        ],
    }[sub]
    for metric_key, threshold_key in pairs:
        if abs(float(metrics[metric_key]) - float(t[threshold_key])) <= 1e-9:
            return True
    return False


def decision_options(decision: str, reason: str, distractor_reasons: dict, seed: int):
    correct = f"{decision} - {reason}"
    labels = ["SUPPORTED", "REFUTED", "INSUFFICIENT"]
    distractors = []
    for label in labels:
        if label == decision:
            continue
        distractors.append(f"{label} - {distractor_reasons[label]}")
    return make_options(correct, distractors, seed)


def difficulty_for(sub: str, decision: str) -> str:
    if sub in {"localized_intensification_verification", "spatial_coherence_verification"}:
        return "hard"
    if decision == "INSUFFICIENT":
        return "hard"
    return "medium"


def evidence_block(metrics: dict) -> str:
    lines = []
    for key, value in metrics.items():
        lines.append(f"  {key}: {fmt(value)}")
    return "\n".join(lines)


def threshold_block(thresholds: dict) -> str:
    return "\n".join(f"  {k}: {fmt(v)}" for k, v in thresholds.items())


def connected_components(cells, active):
    active_set = {cell for cell, flag in zip(cells, active) if flag}
    remaining = set(active_set)
    comps = []
    while remaining:
        start = remaining.pop()
        comp = {start}
        queue = deque([start])
        while queue:
            lat, lon = queue.popleft()
            neighbors = [
                coord_key(lat + 0.25, lon),
                coord_key(lat - 0.25, lon),
                coord_key(lat, lon + 0.25),
                coord_key(lat, lon - 0.25),
            ]
            for nb in neighbors:
                if nb in remaining:
                    remaining.remove(nb)
                    comp.add(nb)
                    queue.append(nb)
        comps.append(comp)
    return comps


def mask_rows(cells, active):
    by_lat = defaultdict(list)
    for (lat, lon), flag in zip(cells, active):
        by_lat[lat].append((lon, flag))
    rows = []
    for lat in sorted(by_lat.keys(), reverse=True):
        bits = "".join("1" if flag else "0" for _, flag in sorted(by_lat[lat]))
        rows.append(f"  lat {lat:.2f}: {bits}")
    return "\n".join(rows)


def compute_candidate_distributions(lookup, regions_3x3, regions_5x5):
    d = defaultdict(list)
    for reg in regions_3x3:
        cells, border = reg["cells"], reg["border"]
        for y1, y2 in zip(YEARS[:-1], YEARS[1:]):
            reg_delta = float(np.mean(lookup.abs_anomaly(cells, y2)) - np.mean(lookup.abs_anomaly(cells, y1)))
            border_delta = float(np.mean(lookup.abs_anomaly(border, y2)) - np.mean(lookup.abs_anomaly(border, y1)))
            rain_delta = float(np.mean(lookup.rainfall(cells, y2) - lookup.rainfall(cells, y1)))
            temp_delta = float(np.mean(lookup.temperature(cells, y2) - lookup.temperature(cells, y1)))
            frac_rain_inc = float(np.mean((lookup.rainfall(cells, y2) - lookup.rainfall(cells, y1)) > 0))
            d["localized_regional_change"].append(reg_delta)
            d["localized_contrast_change"].append(reg_delta - border_delta)
            d["rainfall_change"].append(rain_delta)
            d["temperature_change"].append(temp_delta)
            d["fraction_rain_increase"].append(frac_rain_inc)
        for year in YEARS:
            d["region_mean_abs"].append(float(np.mean(lookup.abs_anomaly(cells, year))))

    for reg in regions_5x5:
        cells = reg["cells"]
        for year in YEARS:
            abs_vals = lookup.abs_anomaly(cells, year)
            # Placeholder threshold is filled later during item generation.
            d["spatial_mean_abs"].append(float(np.mean(abs_vals)))
    return {k: np.asarray(v, dtype=float) for k, v in d.items()}


def distribution_thresholds(values: np.ndarray, qs: list[int]) -> dict:
    return {f"q{q}": r4(percentile(values, q)) for q in qs}


def make_question(
    qid,
    subcategory,
    hypothesis,
    protocol_text,
    metrics,
    protocol,
    decision,
    reason,
    distractor_reasons,
    context_extra,
):
    opts, ans = decision_options(decision, reason, distractor_reasons, stable_seed(qid, decision))
    question = (
        f"Hypothesis:\n  {hypothesis}\n\n"
        f"Decision protocol (all thresholds are derived from this dataset and printed below):\n"
        f"{protocol_text}\n\n"
        f"Thresholds:\n{threshold_block(protocol['thresholds'])}\n\n"
        f"Computed evidence for the target region:\n{evidence_block(metrics)}\n\n"
        f"Under the protocol, how should the hypothesis be adjudicated?"
    )
    return to_py(
        {
            "id": qid,
            "category": "scientific_hypothesis_verification",
            "subcategory": subcategory,
            "difficulty": difficulty_for(subcategory, decision),
            "question": question,
            "options": opts,
            "answer": ans,
            "explanation": f"Decision={decision}. {reason}. Evidence: "
            + ", ".join(f"{k}={fmt(v)}" for k, v in metrics.items()),
            "context": {
                "decision": decision,
                "metrics": metrics,
                "protocol": protocol,
                **context_extra,
            },
        }
    )


def balanced_select(candidates, per_subcategory):
    candidates = [c for c in candidates if not has_boundary_tie(c["metrics"], c["protocol"])]
    by_decision = defaultdict(list)
    for c in candidates:
        by_decision[c["decision"]].append(c)
    rng = random.Random(RNG_SEED)
    for items in by_decision.values():
        rng.shuffle(items)
    target_each = max(1, per_subcategory // 3)
    selected = []
    for label in ["SUPPORTED", "REFUTED", "INSUFFICIENT"]:
        selected.extend(by_decision[label][:target_each])
    leftovers = []
    for label in ["SUPPORTED", "REFUTED", "INSUFFICIENT"]:
        leftovers.extend(by_decision[label][target_each:])
    rng.shuffle(leftovers)
    selected.extend(leftovers[: max(0, per_subcategory - len(selected))])
    return selected[:per_subcategory]


def generate_persistent(lookup, regions, thresholds):
    sub = "persistent_regional_anomaly_verification"
    candidates = []
    for reg in regions:
        cells = reg["cells"]
        for years in [(2019, 2020, 2021), (2020, 2021, 2022), (2021, 2022, 2023), (2022, 2023, 2024), (2023, 2024, 2025)]:
            yearly_mean_abs = []
            yearly_frac = []
            yearly_comp = []
            p75s = []
            p50s = []
            for year in years:
                p75 = thresholds["yearly_abs_anomaly"][str(year)]["p75"]
                p50 = thresholds["yearly_abs_anomaly"][str(year)]["p50"]
                vals = lookup.abs_anomaly(cells, year)
                yearly_mean_abs.append(float(np.mean(vals)))
                yearly_frac.append(float(np.mean(vals >= p75)))
                yearly_comp.append(float(np.mean(lookup.completeness(cells, year))))
                p75s.append(p75)
                p50s.append(p50)
            protocol = {
                "subcategory": sub,
                "thresholds": {
                    "support_mean_abs_p75": r4(float(np.mean(p75s))),
                    "refute_mean_abs_p50": r4(float(np.mean(p50s))),
                    "support_fraction_above_p75": r4(0.25),
                    "refute_fraction_above_p75": r4(0.0),
                    "support_completeness_p10": thresholds["global_completeness"]["p10"],
                },
            }
            metrics = {
                "min_yearly_mean_abs_anomaly": r4(min(yearly_mean_abs)),
                "min_fraction_cells_above_p75": r4(min(yearly_frac)),
                "min_yearly_mean_completeness": r4(min(yearly_comp)),
            }
            decision = classify_with_thresholds(metrics, protocol)
            if decision == "AMBIGUOUS":
                continue
            hypothesis = (
                f"The 3x3 {region_label(reg)} shows a persistent regional anomaly "
                f"through {years[0]}-{years[-1]}."
            )
            protocol_text = (
                "SUPPORTED if the minimum across the target years of regional mean |anomaly_score| "
                "is at least the mean of the yearly P75 |anomaly_score| thresholds, the minimum "
                "fraction of cells above the yearly P75 threshold is at least the printed "
                "support_fraction_above_p75 threshold, and the minimum yearly mean completeness is at least the "
                "global P10 completeness threshold.\n"
                "REFUTED if the minimum regional mean |anomaly_score| is at or below the mean "
                "yearly P50 threshold, or if no cells exceed a yearly P75 threshold, or if "
                "completeness falls below the reliability threshold.\n"
                "INSUFFICIENT otherwise."
            )
            reasons = {
                "SUPPORTED": "all persistence, regional coverage, and reliability criteria pass",
                "REFUTED": "at least one decisive refutation criterion is triggered",
                "INSUFFICIENT": "the evidence falls between support and refutation thresholds",
            }
            candidates.append(
                {
                    "subcategory": sub,
                    "hypothesis": hypothesis,
                    "protocol_text": protocol_text,
                    "metrics": metrics,
                    "protocol": protocol,
                    "decision": decision,
                    "reason": reasons[decision],
                    "distractor_reasons": reasons,
                    "context_extra": {"region_cells": cells, "years": list(years)},
                }
            )
    return candidates


def generate_localized(lookup, regions, thresholds, dist):
    sub = "localized_intensification_verification"
    candidates = []
    q_reg = distribution_thresholds(dist["localized_regional_change"], [25, 60])
    q_con = distribution_thresholds(dist["localized_contrast_change"], [25, 75])
    q_rain = distribution_thresholds(dist["rainfall_change"], [25, 60])
    for reg in regions:
        cells, border = reg["cells"], reg["border"]
        for y1, y2 in zip(YEARS[:-1], YEARS[1:]):
            reg_delta = float(np.mean(lookup.abs_anomaly(cells, y2)) - np.mean(lookup.abs_anomaly(cells, y1)))
            border_delta = float(np.mean(lookup.abs_anomaly(border, y2)) - np.mean(lookup.abs_anomaly(border, y1)))
            rain_delta = float(np.mean(lookup.rainfall(cells, y2) - lookup.rainfall(cells, y1)))
            metrics = {
                "regional_abs_anomaly_change": r4(reg_delta),
                "border_abs_anomaly_change": r4(border_delta),
                "localized_contrast_change": r4(reg_delta - border_delta),
                "regional_rainfall_change": r4(rain_delta),
            }
            protocol = {
                "subcategory": sub,
                "thresholds": {
                    "support_regional_change_q60": q_reg["q60"],
                    "refute_regional_change_q25": q_reg["q25"],
                    "support_contrast_change_q75": q_con["q75"],
                    "refute_contrast_change_q25": q_con["q25"],
                    "support_rainfall_change_q60": q_rain["q60"],
                    "refute_rainfall_change_q25": q_rain["q25"],
                },
            }
            decision = classify_with_thresholds(metrics, protocol)
            if decision == "AMBIGUOUS":
                continue
            hypothesis = (
                f"The 3x3 {region_label(reg)} locally intensified from {y1} to {y2}: "
                "its anomaly increased more than its surrounding border and rainfall also increased."
            )
            protocol_text = (
                "Compute regional_abs_anomaly_change = mean_region(|A_later|) - mean_region(|A_earlier|). "
                "Compute border_abs_anomaly_change the same way on the surrounding border. "
                "Compute localized_contrast_change = regional change - border change. "
                "Compute regional_rainfall_change = mean_region(R_later - R_earlier).\n"
                "SUPPORTED if regional_abs_anomaly_change is at least its candidate Q60 threshold, "
                "localized_contrast_change is at least its candidate Q75 threshold, and "
                "regional_rainfall_change is at least its candidate Q60 threshold.\n"
                "REFUTED if any corresponding metric is at or below its candidate Q25 refutation threshold. "
                "INSUFFICIENT otherwise."
            )
            reasons = {
                "SUPPORTED": "regional anomaly, local contrast, and rainfall-change criteria all pass",
                "REFUTED": "one or more intensification criteria fall at or below a Q25 refutation threshold",
                "INSUFFICIENT": "the signal is mixed between Q25 refutation and support thresholds",
            }
            candidates.append(
                {
                    "subcategory": sub,
                    "hypothesis": hypothesis,
                    "protocol_text": protocol_text,
                    "metrics": metrics,
                    "protocol": protocol,
                    "decision": decision,
                    "reason": reasons[decision],
                    "distractor_reasons": reasons,
                    "context_extra": {"region_cells": cells, "border_cells": border, "years": [y1, y2]},
                }
            )
    return candidates


def generate_wet_consistency(lookup, regions, thresholds, dist):
    sub = "wet_anomaly_consistency_verification"
    candidates = []
    q_rain = distribution_thresholds(dist["rainfall_change"], [25, 75])
    q_frac = distribution_thresholds(dist["fraction_rain_increase"], [25, 75])
    for reg in regions:
        cells = reg["cells"]
        for y1, y2 in zip(YEARS[:-1], YEARS[1:]):
            rain_diff = lookup.rainfall(cells, y2) - lookup.rainfall(cells, y1)
            metrics = {
                "mean_signed_anomaly_later_year": r4(float(np.mean(lookup.anomaly(cells, y2)))),
                "regional_rainfall_change": r4(float(np.mean(rain_diff))),
                "fraction_cells_rainfall_increased": r4(float(np.mean(rain_diff > 0))),
            }
            protocol = {
                "subcategory": sub,
                "thresholds": {
                    "support_signed_anomaly_p75": thresholds["yearly_signed_anomaly"][str(y2)]["p75"],
                    "refute_signed_anomaly_p25": thresholds["yearly_signed_anomaly"][str(y2)]["p25"],
                    "support_rainfall_change_q75": q_rain["q75"],
                    "refute_rainfall_change_q25": q_rain["q25"],
                    "support_fraction_increase_q75": q_frac["q75"],
                    "refute_fraction_increase_q25": q_frac["q25"],
                },
            }
            decision = classify_with_thresholds(metrics, protocol)
            if decision == "AMBIGUOUS":
                continue
            hypothesis = (
                f"For the 3x3 {region_label(reg)}, the {y2} positive anomaly signal is "
                f"consistent with increased rainfall relative to {y1}."
            )
            protocol_text = (
                "Compute the later-year regional mean signed anomaly_score, the regional rainfall "
                "change from earlier to later year, and the fraction of cells whose rainfall increased.\n"
                "SUPPORTED if later-year mean signed anomaly is at least the yearly P75 signed-anomaly "
                "threshold, rainfall change is at least its candidate Q75 threshold, and the fraction "
                "of rainfall-increase cells is at least its candidate Q75 threshold.\n"
                "REFUTED if the signed anomaly is at or below the yearly P25 threshold, or if a high "
                "positive anomaly is paired with rainfall-change or rainfall-fraction evidence at or "
                "below its Q25 refutation threshold. INSUFFICIENT otherwise."
            )
            reasons = {
                "SUPPORTED": "positive-anomaly, rainfall-change, and cell-fraction evidence all pass",
                "REFUTED": "the anomaly signal or rainfall-consistency evidence triggers refutation",
                "INSUFFICIENT": "the anomaly and rainfall evidence are not decisive under the printed thresholds",
            }
            candidates.append(
                {
                    "subcategory": sub,
                    "hypothesis": hypothesis,
                    "protocol_text": protocol_text,
                    "metrics": metrics,
                    "protocol": protocol,
                    "decision": decision,
                    "reason": reasons[decision],
                    "distractor_reasons": reasons,
                    "context_extra": {"region_cells": cells, "years": [y1, y2]},
                }
            )
    return candidates


def generate_compound(lookup, regions, dist):
    sub = "compound_state_transition_verification"
    candidates = []
    q_rain = distribution_thresholds(dist["rainfall_change"], [33, 66])
    q_temp = distribution_thresholds(dist["temperature_change"], [33, 66])
    for reg in regions:
        cells = reg["cells"]
        for y1, y2 in zip(YEARS[:-1], YEARS[1:]):
            metrics = {
                "regional_rainfall_change": r4(float(np.mean(lookup.rainfall(cells, y2) - lookup.rainfall(cells, y1)))),
                "regional_temperature_change": r4(float(np.mean(lookup.temperature(cells, y2) - lookup.temperature(cells, y1)))),
            }
            protocol = {
                "subcategory": sub,
                "thresholds": {
                    "support_rainfall_change_q66": q_rain["q66"],
                    "refute_rainfall_change_q33": q_rain["q33"],
                    "support_temperature_change_q66": q_temp["q66"],
                    "refute_temperature_change_q33": q_temp["q33"],
                },
            }
            decision = classify_with_thresholds(metrics, protocol)
            if decision == "AMBIGUOUS":
                continue
            hypothesis = (
                f"The 3x3 {region_label(reg)} transitioned into a compound high-shift state "
                f"from {y1} to {y2}, with both rainfall and maximum temperature increasing strongly."
            )
            protocol_text = (
                "Compute regional_rainfall_change = mean_region(R_later - R_earlier) and "
                "regional_temperature_change = mean_region(T_later - T_earlier).\n"
                "SUPPORTED if both changes are at least their candidate Q66 support thresholds. "
                "REFUTED if either change is at or below its candidate Q33 refutation threshold. "
                "INSUFFICIENT otherwise."
            )
            reasons = {
                "SUPPORTED": "both rainfall and temperature changes exceed their support thresholds",
                "REFUTED": "at least one variable falls at or below its refutation threshold",
                "INSUFFICIENT": "the two-variable transition is neither jointly strong nor decisively refuted",
            }
            candidates.append(
                {
                    "subcategory": sub,
                    "hypothesis": hypothesis,
                    "protocol_text": protocol_text,
                    "metrics": metrics,
                    "protocol": protocol,
                    "decision": decision,
                    "reason": reasons[decision],
                    "distractor_reasons": reasons,
                    "context_extra": {"region_cells": cells, "years": [y1, y2]},
                }
            )
    return candidates


def generate_spatial(lookup, regions, thresholds):
    sub = "spatial_coherence_verification"
    raw = []
    for reg in regions:
        cells = reg["cells"]
        for year in YEARS:
            active_threshold = thresholds["yearly_abs_anomaly"][str(year)]["p80"]
            abs_vals = lookup.abs_anomaly(cells, year)
            active = abs_vals >= active_threshold
            comps = connected_components(cells, active)
            active_count = int(np.sum(active))
            largest = max((len(c) for c in comps), default=0)
            component_count = len(comps)
            share = float(largest / active_count) if active_count else 0.0
            raw.append((reg, year, active_threshold, active, active_count, largest, component_count, share))
    q_count = distribution_thresholds(np.asarray([x[4] for x in raw], dtype=float), [25, 50])
    q_largest = distribution_thresholds(np.asarray([x[5] for x in raw], dtype=float), [25, 60])
    q_components = distribution_thresholds(np.asarray([x[6] for x in raw], dtype=float), [40, 75])
    candidates = []
    spatial_thresholds = {
        "support_active_count_min": r4(math.floor(max(q_count["q50"], 2.0)) + 0.5),
        "refute_active_count_max": r4(math.floor(q_count["q25"]) + 0.5),
        "support_largest_component_min": r4(math.floor(max(q_largest["q60"], 2.0)) + 0.5),
        "refute_largest_component_max": r4(math.floor(q_largest["q25"]) + 0.5),
        "support_component_count_max": r4(math.floor(q_components["q40"]) + 0.5),
        "refute_component_count_min": r4(math.floor(max(q_components["q75"], 2.0)) + 0.5),
    }
    for reg, year, active_threshold, active, active_count, largest, component_count, share in raw:
        metrics = {
            "active_cell_count": r4(active_count),
            "largest_component_size": r4(largest),
            "component_count": r4(component_count),
            "largest_component_share": r4(share),
        }
        protocol = {
            "subcategory": sub,
            "thresholds": {
                "active_cell_threshold_yearly_abs_p80": r4(active_threshold),
                **spatial_thresholds,
            },
        }
        decision = classify_with_thresholds(metrics, protocol)
        if decision == "AMBIGUOUS":
            continue
        hypothesis = (
            f"In {year}, the 5x5 {region_label(reg)} contains a spatially coherent anomaly "
            "rather than a fragmented active-cell pattern."
        )
        protocol_text = (
            "Mark a cell active if |anomaly_score| is at least the yearly P80 |anomaly_score| threshold. "
            "Using 4-neighbor adjacency, compute the number of active cells, the largest connected "
            "active component, component_count, and largest_component_share = "
            "largest_component_size / active_cell_count.\n"
            "SUPPORTED if active_cell_count and largest_component_size pass their printed minimum "
            "thresholds and component_count is at or below its printed maximum threshold. "
            "REFUTED if active_cell_count or largest_component_size is at or below its printed "
            "refutation maximum, or component_count is at or above its printed fragmentation minimum. "
            "INSUFFICIENT otherwise.\n"
            f"Active-cell mask for the 5x5 region, north-to-south rows (1=active, 0=inactive):\n{mask_rows(reg['cells'], active)}"
        )
        reasons = {
            "SUPPORTED": "the active cells are numerous enough and concentrated into few connected components",
            "REFUTED": "the active-cell count, largest component size, or fragmentation count triggers refutation",
            "INSUFFICIENT": "the active-cell pattern is between coherent and fragmented thresholds",
        }
        candidates.append(
            {
                "subcategory": sub,
                "hypothesis": hypothesis,
                "protocol_text": protocol_text,
                "metrics": metrics,
                "protocol": protocol,
                "decision": decision,
                "reason": reasons[decision],
                "distractor_reasons": reasons,
                "context_extra": {
                    "region_cells": reg["cells"],
                    "year": year,
                    "active_mask": [bool(x) for x in active],
                },
            }
        )
    return candidates


def generate_reliability(lookup, regions, thresholds, dist):
    sub = "reliability_aware_claim_verification"
    candidates = []
    q_abs = distribution_thresholds(dist["region_mean_abs"], [50, 85])
    for reg in regions:
        cells = reg["cells"]
        for year in YEARS:
            metrics = {
                "mean_abs_anomaly": r4(float(np.mean(lookup.abs_anomaly(cells, year)))),
                "mean_completeness": r4(float(np.mean(lookup.completeness(cells, year)))),
            }
            protocol = {
                "subcategory": sub,
                "thresholds": {
                    "support_mean_abs_q85": q_abs["q85"],
                    "refute_mean_abs_q50": q_abs["q50"],
                    "support_completeness_p50": thresholds["global_completeness"]["p50"],
                },
            }
            decision = classify_with_thresholds(metrics, protocol)
            if decision == "AMBIGUOUS":
                continue
            hypothesis = (
                f"The {year} anomaly evidence in the 3x3 {region_label(reg)} is strong enough "
                "and reliable enough to support a dataset-defined regional risk claim."
            )
            protocol_text = (
                "Compute mean_abs_anomaly over the region and mean_completeness over the same cells. "
                "SUPPORTED if mean_abs_anomaly is at least the candidate Q85 regional mean-|anomaly| "
                "threshold and mean_completeness is at least the global P50 completeness threshold. "
                "REFUTED if mean_abs_anomaly is at or below the candidate Q50 threshold. "
                "INSUFFICIENT otherwise."
            )
            reasons = {
                "SUPPORTED": "both anomaly magnitude and completeness pass their support thresholds",
                "REFUTED": "regional anomaly magnitude is at or below the refutation threshold",
                "INSUFFICIENT": "the anomaly magnitude is not strong enough for support but not low enough for refutation",
            }
            candidates.append(
                {
                    "subcategory": sub,
                    "hypothesis": hypothesis,
                    "protocol_text": protocol_text,
                    "metrics": metrics,
                    "protocol": protocol,
                    "decision": decision,
                    "reason": reasons[decision],
                    "distractor_reasons": reasons,
                    "context_extra": {"region_cells": cells, "year": year},
                }
            )
    return candidates


def validate_questions(questions):
    violations = []
    ids = set()
    for q in questions:
        if q["id"] in ids:
            violations.append((q["id"], "duplicate id"))
        ids.add(q["id"])
        if len(set(q["options"].values())) != len(q["options"]):
            violations.append((q["id"], "duplicate option text"))
        option_labels = [text.split(" - ", 1)[0] for text in q["options"].values()]
        if sorted(option_labels) != ["INSUFFICIENT", "REFUTED", "SUPPORTED"]:
            violations.append((q["id"], "options must contain one label for each adjudication class"))
        if q["answer"] not in q["options"]:
            violations.append((q["id"], "answer letter missing from options"))
        correct_text = q["options"][q["answer"]]
        if not correct_text.startswith(q["context"]["decision"]):
            violations.append((q["id"], "answer text does not match stored decision"))
        recomputed = classify_with_thresholds(q["context"]["metrics"], q["context"]["protocol"])
        if recomputed != q["context"]["decision"]:
            violations.append((q["id"], f"recomputed {recomputed} != stored {q['context']['decision']}"))
        if recomputed == "AMBIGUOUS":
            violations.append((q["id"], "ambiguous protocol result"))
        if has_boundary_tie(q["context"]["metrics"], q["context"]["protocol"]):
            violations.append((q["id"], "metric equals a decisive threshold"))
        body = (
            q["question"]
            + " "
            + " ".join(q["options"].values())
            + " "
            + q["explanation"]
        ).lower()
        for pat in FORBIDDEN_PATTERNS:
            if re.search(pat, body):
                violations.append((q["id"], f"external-knowledge term /{pat}/"))
        if "Decision protocol" not in q["question"] or "Thresholds:" not in q["question"]:
            violations.append((q["id"], "protocol or thresholds not printed"))
        if "Evidence:" not in q["explanation"]:
            violations.append((q["id"], "explanation missing evidence summary"))
    return violations


def public_copy(data):
    return {
        "name": data["name"],
        "version": data["version"],
        "description": data["description"],
        "constraint": data["constraint"],
        "n_questions": data["n_questions"],
        "subcategories": data["subcategories"],
        "questions": [
            {
                "id": q["id"],
                "category": q["category"],
                "subcategory": q["subcategory"],
                "difficulty": q["difficulty"],
                "question": q["question"],
                "options": q["options"],
            }
            for q in data["questions"]
        ],
    }


def main():
    root = repo_root()
    data = load_dataset(root)
    wide = build_wide(data)
    lookup = ClimateLookup(wide)
    thresholds = compute_thresholds(data, wide)
    regions_3x3, regions_5x5 = build_regions(wide)
    if len(regions_3x3) < 100 or len(regions_5x5) < 50:
        raise RuntimeError("Insufficient complete regions for benchmark generation")

    dist = compute_candidate_distributions(lookup, regions_3x3, regions_5x5)
    thresholds["candidate_distributions"] = {
        k: {
            "p25": r4(percentile(v, 25)),
            "p50": r4(percentile(v, 50)),
            "p75": r4(percentile(v, 75)),
        }
        for k, v in dist.items()
        if len(v)
    }

    candidate_sets = {
        "persistent_regional_anomaly_verification": generate_persistent(lookup, regions_3x3, thresholds),
        "localized_intensification_verification": generate_localized(lookup, regions_3x3, thresholds, dist),
        "wet_anomaly_consistency_verification": generate_wet_consistency(lookup, regions_3x3, thresholds, dist),
        "compound_state_transition_verification": generate_compound(lookup, regions_3x3, dist),
        "spatial_coherence_verification": generate_spatial(lookup, regions_5x5, thresholds),
        "reliability_aware_claim_verification": generate_reliability(lookup, regions_3x3, thresholds, dist),
    }

    questions = []
    qnum = 0
    generation_report = {}
    for sub in SUBCATEGORIES:
        candidates = candidate_sets[sub]
        selected = balanced_select(candidates, N_PER_SUBCATEGORY)
        if len(selected) < N_PER_SUBCATEGORY:
            raise RuntimeError(f"Only {len(selected)} valid candidates for {sub}")
        generation_report[sub] = {
            "valid_candidates": len(candidates),
            "candidate_decisions": dict(Counter(c["decision"] for c in candidates)),
        }
        for item in selected:
            qnum += 1
            qid = f"HYP-{qnum:03d}"
            questions.append(
                make_question(
                    qid=qid,
                    subcategory=item["subcategory"],
                    hypothesis=item["hypothesis"],
                    protocol_text=item["protocol_text"],
                    metrics=item["metrics"],
                    protocol=item["protocol"],
                    decision=item["decision"],
                    reason=item["reason"],
                    distractor_reasons=item["distractor_reasons"],
                    context_extra=item["context_extra"],
                )
            )

    violations = validate_questions(questions)
    by_sub = Counter(q["subcategory"] for q in questions)
    by_diff = Counter(q["difficulty"] for q in questions)
    by_answer = Counter(q["answer"] for q in questions)
    by_decision = Counter(q["context"]["decision"] for q in questions)

    validation_report = {
        "passed": len(violations) == 0,
        "violation_count": len(violations),
        "violations": violations[:50],
        "checks": [
            "unique ids",
            "unique option text",
            "answer letter present",
            "stored answer matches recomputed protocol decision",
            "ambiguous protocol results rejected",
            "decision protocol and thresholds printed",
            "forbidden external-knowledge terms absent",
            "explanations include recomputed evidence",
        ],
    }
    if violations:
        raise RuntimeError(f"Validation failed with {len(violations)} violations: {violations[:5]}")

    output = {
        "name": "ClimateTwinBench_Hypothesis",
        "version": "1.0",
        "description": (
            "Deterministic scientific hypothesis verification over gridded "
            "ClimateTwinIndia spatiotemporal climate states."
        ),
        "constraint": (
            "STRICT: Every answer is derivable programmatically from dataset values alone. "
            "No external climate knowledge is required. Protocol thresholds are printed "
            "in each question and are derived from dataset percentiles or candidate "
            "distribution quantiles."
        ),
        "dataset": {
            "name": "ClimateTwinIndia",
            "years": YEARS,
            "grid_cells": int(len(wide)),
            "source_files": [f"data/processed/climate_states_{y}.csv" for y in YEARS],
            "variables": [
                "anomaly_score",
                "rainfall_mm",
                "max_temperature_c",
                "completeness_score",
            ],
        },
        "n_questions": len(questions),
        "subcategories": dict(by_sub),
        "statistics": {
            "difficulty": dict(by_diff),
            "answer_distribution": dict(by_answer),
            "decision_distribution": dict(by_decision),
            "generation_report": generation_report,
            "threshold_summary": thresholds,
        },
        "validation_report": validation_report,
        "questions": questions,
    }

    bench_dir = root / "benchmark"
    private_path = bench_dir / "ClimateTwinBench_Hypothesis.json"
    public_path = bench_dir / "ClimateTwinBench_Hypothesis_public.json"
    with open(private_path, "w", encoding="utf-8") as f:
        json.dump(to_py(output), f, indent=2)
    with open(public_path, "w", encoding="utf-8") as f:
        json.dump(to_py(public_copy(output)), f, indent=2)

    print("=" * 72)
    print("ClimateTwinBench-Hypothesis generated")
    print(f"Questions: {len(questions)}")
    print("By subcategory:")
    for sub, n in by_sub.items():
        print(f"  {sub}: {n}")
    print("Difficulty:")
    for key, n in by_diff.items():
        print(f"  {key}: {n}")
    print("Decision distribution:")
    for key, n in by_decision.items():
        print(f"  {key}: {n}")
    print("Answer distribution:")
    for key, n in sorted(by_answer.items()):
        print(f"  {key}: {n}")
    print("Validation: passed")
    print(f"Saved private benchmark: {private_path}")
    print(f"Saved public benchmark:  {public_path}")


if __name__ == "__main__":
    main()
