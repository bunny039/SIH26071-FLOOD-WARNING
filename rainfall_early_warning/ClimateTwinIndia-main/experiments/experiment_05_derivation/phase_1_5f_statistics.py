#!/usr/bin/env python3
"""
ClimateTwin Phase 1.5F — publication-grade statistical analysis.

Reads the already-frozen offline sensitivity experiment and its directional
away-from-GT control. No model/API calls. Does not modify either experiment.

Primary observations:
  245 model/question pairs with observed metric error.

Primary contrast:
  alpha=0 -> alpha=0.99, toward-GT contraction.

Directional control:
  alpha=0.99 toward-GT vs alpha=0.99 away-GT.

Alpha=1.0 is intentionally excluded because it changes the canonical GT
decision at the equality boundary and is therefore a degenerate endpoint.

Outputs:
  phase_1_5f_statistics.json
  phase_1_5f_primary_effect.csv
  phase_1_5f_directional_effect.csv
  phase_1_5f_category_effects.csv
  phase_1_5f_alpha_curve.csv
  phase_1_5f_model_effects.csv
  phase_1_5f_report.md
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import binomtest, spearmanr

ROOT = Path(__file__).resolve().parents[2]
PRIMARY = ROOT / "experiments/experiment_05_derivation/results/margin_sensitivity"
CONTROL = ROOT / "experiments/experiment_05_derivation/results/margin_sensitivity_control"
OUT = ROOT / "experiments/experiment_05_derivation/results/phase_1_5f_statistics"

ALPHAS = [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]
BOOTSTRAP = 10000
SEED = 20260626


def exact_mcnemar(a: np.ndarray, b: np.ndarray) -> dict:
    """Exact two-sided McNemar test from paired binary arrays.

    a/b are booleans where True means propagated. Discordant pairs are the
    only observations used by the exact conditional test.
    """
    a = np.asarray(a, dtype=bool)
    b = np.asarray(b, dtype=bool)
    b_to_a = int(np.sum((a == 1) & (b == 0)))
    a_to_b = int(np.sum((a == 0) & (b == 1)))
    discordant = b_to_a + a_to_b

    if discordant == 0:
        p = 1.0
    else:
        p = float(binomtest(b_to_a, discordant, 0.5).pvalue)

    return {
        "a_propagated_b_absorbed": b_to_a,
        "a_absorbed_b_propagated": a_to_b,
        "discordant": discordant,
        "exact_two_sided_p": p,
    }


def paired_bootstrap_diff(a: np.ndarray, b: np.ndarray, seed: int = SEED) -> dict:
    """Percent-point paired risk-difference bootstrap."""
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    if len(a) != len(b) or len(a) == 0:
        raise ValueError("paired arrays must have equal non-zero length")

    observed = float(np.mean(b) - np.mean(a))
    rng = np.random.default_rng(seed)
    n = len(a)
    diffs = np.empty(BOOTSTRAP, dtype=float)

    # Resample paired observations, preserving within-pair dependence.
    for i in range(BOOTSTRAP):
        idx = rng.integers(0, n, n)
        diffs[i] = np.mean(b[idx] - a[idx])

    lo, hi = np.quantile(diffs, [0.025, 0.975])
    return {
        "difference": observed,
        "difference_percentage_points": observed * 100.0,
        "bootstrap_ci95_low": float(lo),
        "bootstrap_ci95_high": float(hi),
        "bootstrap_ci95_low_percentage_points": float(lo * 100.0),
        "bootstrap_ci95_high_percentage_points": float(hi * 100.0),
        "bootstrap_resamples": BOOTSTRAP,
        "bootstrap_seed": seed,
    }


def load_and_validate():
    qp = pd.read_csv(PRIMARY / "question_level_sensitivity.csv")
    qc = pd.read_csv(CONTROL / "question_level_control.csv")

    required_p = {
        "model", "question_id", "category", "alpha",
        "perturbed_status", "original_gt_decision",
        "perturbed_gt_decision", "metric_error_present",
    }
    required_c = required_p
    missing_p = required_p - set(qp.columns)
    missing_c = required_c - set(qc.columns)
    if missing_p:
        raise RuntimeError(f"Primary CSV missing columns: {sorted(missing_p)}")
    if missing_c:
        raise RuntimeError(f"Control CSV missing columns: {sorted(missing_c)}")

    qp = qp[qp["metric_error_present"] == True].copy()
    qc = qc[qc["metric_error_present"] == True].copy()

    # The metric-error flag is repeated for each alpha. Reduce to one row per
    # model/question for uniqueness checks.
    pk = ["model", "question_id"]
    pkeys = qp[pk].drop_duplicates()
    ckeys = qc[pk].drop_duplicates()

    if len(pkeys) != 245 or len(ckeys) != 245:
        raise RuntimeError(f"Expected 245 observations; got primary={len(pkeys)}, control={len(ckeys)}")

    if set(map(tuple, pkeys.to_records(index=False))) != set(map(tuple, ckeys.to_records(index=False))):
        raise RuntimeError("Primary and control do not contain identical paired observations.")

    for name, df in [("primary", qp), ("control", qc)]:
        observed_alphas = sorted(df["alpha"].unique().tolist())
        if observed_alphas != ALPHAS:
            raise RuntimeError(f"{name} alpha grid mismatch: {observed_alphas}")

        gt_changes = int((df["perturbed_gt_decision"] != df["original_gt_decision"]).sum())
        if gt_changes:
            raise RuntimeError(f"{name}: canonical GT decision changed in {gt_changes} rows.")

    return qp, qc


def endpoint(df: pd.DataFrame, alpha: float, status_col="perturbed_status"):
    x = df[df["alpha"] == alpha][["model", "question_id", "category", status_col]].copy()
    x = x.drop_duplicates(["model", "question_id"])
    if len(x) != 245:
        raise RuntimeError(f"Expected 245 endpoint rows at alpha={alpha}, got {len(x)}")
    x["propagated"] = x[status_col].eq("propagated")
    return x


def alpha_curve(primary: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for alpha in ALPHAS:
        x = endpoint(primary, alpha)
        rate = float(x["propagated"].mean())
        rows.append({
            "alpha": alpha,
            "n": len(x),
            "propagated": int(x["propagated"].sum()),
            "absorbed": int((~x["propagated"]).sum()),
            "propagation_rate": rate,
        })
    return pd.DataFrame(rows)


def category_effects(primary: pd.DataFrame, control: pd.DataFrame) -> pd.DataFrame:
    p0 = endpoint(primary, 0.0)
    p99 = endpoint(primary, 0.99)
    c99 = endpoint(control, 0.99)

    base = p0.rename(columns={"propagated": "baseline"})
    toward = p99.rename(columns={"propagated": "toward"})
    away = c99.rename(columns={"propagated": "away"})
    x = base.merge(toward, on=["model", "question_id", "category"])
    x = x.merge(away, on=["model", "question_id", "category"])

    rows = []
    for cat, g in x.groupby("category", sort=True):
        primary_stats = paired_bootstrap_diff(g["baseline"].values, g["toward"].values)
        direction_stats = paired_bootstrap_diff(g["away"].values, g["toward"].values)
        mcn_primary = exact_mcnemar(g["baseline"].values, g["toward"].values)
        mcn_direction = exact_mcnemar(g["away"].values, g["toward"].values)
        rows.append({
            "category": cat,
            "n": len(g),
            "baseline_rate": g["baseline"].mean(),
            "toward_rate": g["toward"].mean(),
            "away_rate": g["away"].mean(),
            "toward_minus_baseline_pp": primary_stats["difference_percentage_points"],
            "toward_minus_baseline_ci95_low_pp": primary_stats["bootstrap_ci95_low_percentage_points"],
            "toward_minus_baseline_ci95_high_pp": primary_stats["bootstrap_ci95_high_percentage_points"],
            "away_minus_baseline_pp": (g["away"].mean() - g["baseline"].mean()) * 100,
            "toward_minus_away_pp": direction_stats["difference_percentage_points"],
            "toward_minus_away_ci95_low_pp": direction_stats["bootstrap_ci95_low_percentage_points"],
            "toward_minus_away_ci95_high_pp": direction_stats["bootstrap_ci95_high_percentage_points"],
            "primary_mcnemar_p": mcn_primary["exact_two_sided_p"],
            "directional_mcnemar_p": mcn_direction["exact_two_sided_p"],
            "primary_A_to_P": mcn_primary["a_absorbed_b_propagated"],
            "primary_P_to_A": mcn_primary["a_propagated_b_absorbed"],
            "direction_AwayProp_to_TowardAbs": mcn_direction["a_absorbed_b_propagated"],
            "direction_AwayAbs_to_TowardProp": mcn_direction["a_propagated_b_absorbed"],
        })
    return pd.DataFrame(rows)


def holm_adjust(pvals):
    pvals = np.asarray(pvals, dtype=float)
    order = np.argsort(pvals)
    adjusted = np.empty_like(pvals)
    running = 0.0
    m = len(pvals)
    for rank, idx in enumerate(order):
        value = min(1.0, (m - rank) * pvals[idx])
        running = max(running, value)
        adjusted[idx] = running
    return adjusted


def model_effects(primary: pd.DataFrame, control: pd.DataFrame) -> pd.DataFrame:
    p0 = endpoint(primary, 0.0)
    p99 = endpoint(primary, 0.99)
    c99 = endpoint(control, 0.99)
    x = p0.merge(p99, on=["model", "question_id", "category"], suffixes=("_base", "_toward"))
    x = x.merge(c99[["model", "question_id", "propagated"]].rename(columns={"propagated": "away"}),
                on=["model", "question_id"])
    rows = []
    for model, g in x.groupby("model", sort=True):
        d = paired_bootstrap_diff(g["propagated_base"].values, g["propagated_toward"].values)
        direction = paired_bootstrap_diff(g["away"].values, g["propagated_toward"].values)
        rows.append({
            "model": model,
            "n": len(g),
            "baseline_rate": g["propagated_base"].mean(),
            "toward_rate": g["propagated_toward"].mean(),
            "away_rate": g["away"].mean(),
            "toward_minus_baseline_pp": d["difference_percentage_points"],
            "toward_minus_away_pp": direction["difference_percentage_points"],
            "primary_mcnemar_p": exact_mcnemar(g["propagated_base"], g["propagated_toward"])["exact_two_sided_p"],
            "directional_mcnemar_p": exact_mcnemar(g["away"], g["propagated_toward"])["exact_two_sided_p"],
        })
    return pd.DataFrame(rows)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    primary, control = load_and_validate()

    p0 = endpoint(primary, 0.0)
    p99 = endpoint(primary, 0.99)
    c99 = endpoint(control, 0.99)

    # Primary: baseline -> toward-GT at alpha=.99
    prim = exact_mcnemar(p0["propagated"].values, p99["propagated"].values)
    prim_ci = paired_bootstrap_diff(p0["propagated"].values, p99["propagated"].values)

    # Directional: away-GT -> toward-GT at alpha=.99
    direction = exact_mcnemar(c99["propagated"].values, p99["propagated"].values)
    direction_ci = paired_bootstrap_diff(c99["propagated"].values, p99["propagated"].values)

    # Directional contrast as a continuous signed endpoint difference.
    toward_rate = float(p99["propagated"].mean())
    away_rate = float(c99["propagated"].mean())
    baseline_rate = float(p0["propagated"].mean())

    # Alpha-response trend: aggregate rate is descriptive; the inferential
    # trend uses the per-observation mean Spearman association between alpha
    # and binary propagated status. This is a secondary descriptive robustness
    # measure, not the primary hypothesis test.
    curve = alpha_curve(primary)
    per_obs = primary.pivot_table(
        index=["model", "question_id"], columns="alpha", values="perturbed_status",
        aggfunc="first"
    )
    rho_values = []
    for _, row in per_obs.iterrows():
        y = row.eq("propagated").astype(int).values

        # Spearman rho is undefined for a constant response vector.
        # Treat those observations as undefined rather than emitting
        # scipy ConstantInputWarning.
        if np.unique(y).size < 2:
            continue

        rho, _ = spearmanr(np.asarray(ALPHAS, dtype=float), y)
        if np.isfinite(rho):
            rho_values.append(float(rho))

    trend_summary = {
        "mean_per_observation_spearman_rho": (
            float(np.mean(rho_values)) if rho_values else None
        ),
        "median_per_observation_spearman_rho": (
            float(np.median(rho_values)) if rho_values else None
        ),
        "n_with_defined_rho": len(rho_values),
        "n_constant_response_excluded": int(len(per_obs) - len(rho_values)),
        "note": "Secondary descriptive trend measure; the primary inference is paired at alpha=0 vs alpha=.99 and toward-vs-away at alpha=.99.",
    }

    cat = category_effects(primary, control)
    # Holm adjustment separately for the six primary category-specific
    # directional tests. They are secondary analyses.
    cat["directional_mcnemar_p_holm"] = holm_adjust(cat["directional_mcnemar_p"].values)

    models = model_effects(primary, control)

    primary_effect = {
        "n": 245,
        "baseline_alpha": 0.0,
        "endpoint_alpha": 0.99,
        "baseline_propagation_rate": baseline_rate,
        "endpoint_propagation_rate": toward_rate,
        "risk_difference_percentage_points": prim_ci["difference_percentage_points"],
        "risk_difference_ci95_percentage_points": [
            prim_ci["bootstrap_ci95_low_percentage_points"],
            prim_ci["bootstrap_ci95_high_percentage_points"],
        ],
        "exact_mcnemar": prim,
    }

    directional_effect = {
        "n": 245,
        "away_alpha": 0.99,
        "toward_alpha": 0.99,
        "away_propagation_rate": away_rate,
        "toward_propagation_rate": toward_rate,
        "toward_minus_away_percentage_points": direction_ci["difference_percentage_points"],
        "toward_minus_away_ci95_percentage_points": [
            direction_ci["bootstrap_ci95_low_percentage_points"],
            direction_ci["bootstrap_ci95_high_percentage_points"],
        ],
        "exact_mcnemar": direction,
    }

    summary = {
        "analysis": "ClimateTwin Phase 1.5F publication-grade statistical analysis",
        "observations": 245,
        "alpha_grid": ALPHAS,
        "alpha_1_policy": "excluded from primary analysis because alpha=1 changes canonical GT decisions at the equality boundary",
        "toward_gt": "T_alpha = T + alpha * (GT_metric - T)",
        "away_gt_control": "T_alpha = T - alpha * (GT_metric - T)",
        "bootstrap_resamples": BOOTSTRAP,
        "bootstrap_seed": SEED,
        "canonical_gt_changes_through_0_99": {
            "primary": 0,
            "control": 0,
        },
        "primary_effect": primary_effect,
        "directional_effect": directional_effect,
        "trend_summary": trend_summary,
    }

    (OUT / "phase_1_5f_statistics.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    pd.DataFrame([{
        **{k: v for k, v in primary_effect.items() if k != "exact_mcnemar"},
        "mcnemar_A_to_P": prim["a_absorbed_b_propagated"],
        "mcnemar_P_to_A": prim["a_propagated_b_absorbed"],
        "mcnemar_discordant": prim["discordant"],
        "mcnemar_p": prim["exact_two_sided_p"],
        "ci95_low_pp": prim_ci["bootstrap_ci95_low_percentage_points"],
        "ci95_high_pp": prim_ci["bootstrap_ci95_high_percentage_points"],
    }]).to_csv(OUT / "phase_1_5f_primary_effect.csv", index=False)

    pd.DataFrame([{
        **{k: v for k, v in directional_effect.items() if k != "exact_mcnemar"},
        "mcnemar_away_propagated_toward_absorbed": direction["a_propagated_b_absorbed"],
        "mcnemar_away_absorbed_toward_propagated": direction["a_absorbed_b_propagated"],
        "mcnemar_discordant": direction["discordant"],
        "mcnemar_p": direction["exact_two_sided_p"],
        "ci95_low_pp": direction_ci["bootstrap_ci95_low_percentage_points"],
        "ci95_high_pp": direction_ci["bootstrap_ci95_high_percentage_points"],
    }]).to_csv(OUT / "phase_1_5f_directional_effect.csv", index=False)

    cat.to_csv(OUT / "phase_1_5f_category_effects.csv", index=False)
    curve.to_csv(OUT / "phase_1_5f_alpha_curve.csv", index=False)
    models.to_csv(OUT / "phase_1_5f_model_effects.csv", index=False)

    report = f"""# ClimateTwin Phase 1.5F — Statistical Analysis

## Frozen design

- Observations: **245** model/question pairs with observed metric error.
- Primary intervention: threshold contraction toward canonical GT metric.
- Directional control: equal-magnitude threshold displacement away from canonical GT metric.
- Alpha grid: `{ALPHAS}`.
- Alpha=1.0 is excluded because it changes the canonical GT decision at the equality boundary.
- Canonical GT decisions changed through alpha=.99: **0** in both primary and control.
- No model/API inference is performed by this analysis.

## Primary endpoint

Baseline propagation: **{baseline_rate:.4%}**

Toward-GT propagation at alpha=.99: **{toward_rate:.4%}**

Paired risk difference: **{prim_ci['difference_percentage_points']:.2f} percentage points**

95% bootstrap CI: **[{prim_ci['bootstrap_ci95_low_percentage_points']:.2f}, {prim_ci['bootstrap_ci95_high_percentage_points']:.2f}] pp**

Exact two-sided McNemar p-value: **{prim['exact_two_sided_p']:.6g}**

Discordant pairs: absorbed→propagated = **{prim['a_absorbed_b_propagated']}**; propagated→absorbed = **{prim['a_propagated_b_absorbed']}**.

## Directional control

Away-GT propagation at alpha=.99: **{away_rate:.4%}**

Toward-GT propagation at alpha=.99: **{toward_rate:.4%}**

Toward-minus-away difference: **{direction_ci['difference_percentage_points']:.2f} percentage points**

95% bootstrap CI: **[{direction_ci['bootstrap_ci95_low_percentage_points']:.2f}, {direction_ci['bootstrap_ci95_high_percentage_points']:.2f}] pp**

Exact two-sided McNemar p-value: **{direction['exact_two_sided_p']:.6g}**

Discordant pairs (away→toward): away propagated→toward absorbed = **{direction['a_propagated_b_absorbed']}**; away absorbed→toward propagated = **{direction['a_absorbed_b_propagated']}**.

## Interpretation boundary

The inferential claims supported by this artifact are about **directional sensitivity of the deterministic decision outcome under controlled threshold displacement**. They do not by themselves establish that the intervention is representative of all possible protocol changes or that the threshold movement is causal in a broader deployment setting.

## Secondary analyses

Category-level effects are in `phase_1_5f_category_effects.csv`; six directional category p-values are Holm-adjusted in `directional_mcnemar_p_holm`.

The alpha-response curve is in `phase_1_5f_alpha_curve.csv`. Per-observation Spearman association with alpha is a descriptive secondary measure only.

Model-level endpoint summaries are in `phase_1_5f_model_effects.csv`.

## Reproducibility

Bootstrap resamples: **{BOOTSTRAP}**

Bootstrap seed: **{SEED}**

All source files are the already-generated primary and control CSVs; no new model inference is required.
"""
    (OUT / "phase_1_5f_report.md").write_text(report, encoding="utf-8")

    print("=" * 70)
    print("ClimateTwin Phase 1.5F — Statistical Analysis")
    print("=" * 70)
    print(f"Observations: {len(p0)}")
    print(f"Primary:      {baseline_rate:.4%} -> {toward_rate:.4%} ({prim_ci['difference_percentage_points']:+.2f} pp)")
    print(f"Primary CI:   [{prim_ci['bootstrap_ci95_low_percentage_points']:+.2f}, {prim_ci['bootstrap_ci95_high_percentage_points']:+.2f}] pp")
    print(f"Primary McNemar p: {prim['exact_two_sided_p']:.6g}")
    print(f"Directional:  {away_rate:.4%} -> {toward_rate:.4%} ({direction_ci['difference_percentage_points']:+.2f} pp)")
    print(f"Directional CI:[{direction_ci['bootstrap_ci95_low_percentage_points']:+.2f}, {direction_ci['bootstrap_ci95_high_percentage_points']:+.2f}] pp")
    print(f"Directional McNemar p: {direction['exact_two_sided_p']:.6g}")
    print()
    print(f"Outputs: {OUT}")
    print("DONE")


if __name__ == "__main__":
    main()