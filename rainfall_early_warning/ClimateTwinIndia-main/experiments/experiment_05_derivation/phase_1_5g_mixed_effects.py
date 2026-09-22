"""
ClimateTwin Phase 1.5G
Question-clustered mixed-effects robustness analysis.

Purpose
-------
Re-analyze the frozen Phase 1.5 endpoint using a binomial GLMM with a
question-level random intercept.

No model inference is performed.
No benchmark data are modified.
No Phase 1.5 primary/control outputs are modified.

Analyses
--------
1. Baseline -> toward-GT alpha=.99
2. Away-GT alpha=.99 -> toward-GT alpha=.99
3. Canonical `gpt`-labeled-subset sensitivity check using existing
   model/question pairs (see GPT-label provenance note below; this
   script does not assert a specific model identity for that label)

The primary Phase 1.5 McNemar results remain the original paired analysis.
This script is a robustness analysis addressing dependence among observations
sharing the same benchmark question.

The mixed model is:

    logit(P(Y_ij = 1)) = beta_0 + beta_1 * condition_ij + u_j

where:
    Y = propagated (1) / absorbed (0)
    condition = 0/1 endpoint condition
    u_j = question-level random intercept

The reported mixed-model quantity is:
    exp(beta_1) = odds ratio

with a 95% posterior interval from the fitted variational-Bayes approximation.

This script does NOT claim causal inference.
"""

from __future__ import annotations

import json
import math
import platform
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import binomtest
from statsmodels.genmod.bayes_mixed_glm import BinomialBayesMixedGLM


ROOT = Path(__file__).resolve().parents[2]

PRIMARY_FILE = (
    ROOT
    / "experiments"
    / "experiment_05_derivation"
    / "results"
    / "margin_sensitivity"
    / "question_level_sensitivity.csv"
)

CONTROL_FILE = (
    ROOT
    / "experiments"
    / "experiment_05_derivation"
    / "results"
    / "margin_sensitivity_control"
    / "question_level_control.csv"
)

OUT_DIR = (
    ROOT
    / "experiments"
    / "experiment_05_derivation"
    / "results"
    / "phase_1_5g_mixed_effects"
)

ALPHA_ENDPOINT = 0.99
GPT_LABEL = "gpt"

# Fixed seed for the NumPy random state consumed by statsmodels'
# variational-Bayes starting-value initialization (BinomialBayesMixedGLM
# draws its initial posterior-SD vector from np.random.normal when no
# explicit `sd=` is passed to fit_vb). This does NOT affect, and is
# entirely independent of, any Phase 1.5D/E/F seed (e.g. the bootstrap
# seed used by phase_1_5f_statistics.py). It exists only to make this
# secondary Phase 1.5G robustness fit deterministic across re-runs.
PHASE_1_5G_SEED = 20260626


def fail(message: str) -> None:
    raise RuntimeError(message)


def validate_columns(df: pd.DataFrame, required: set[str], name: str) -> None:
    missing = sorted(required - set(df.columns))
    if missing:
        fail(f"{name} is missing required columns: {missing}")


def load_primary() -> pd.DataFrame:
    if not PRIMARY_FILE.exists():
        fail(f"Missing primary file:\n{PRIMARY_FILE}")

    df = pd.read_csv(PRIMARY_FILE)

    validate_columns(
        df,
        {
            "model",
            "question_id",
            "alpha",
            "perturbed_status",
            "baseline_status",
            "metric_error_present",
            "perturbed_gt_decision",
            "original_gt_decision",
        },
        "Primary sensitivity CSV",
    )

    return df


def load_control() -> pd.DataFrame:
    if not CONTROL_FILE.exists():
        fail(f"Missing control file:\n{CONTROL_FILE}")

    df = pd.read_csv(CONTROL_FILE)

    validate_columns(
        df,
        {
            "model",
            "question_id",
            "alpha",
            "perturbed_status",
            "metric_error_present",
            "perturbed_gt_decision",
            "original_gt_decision",
        },
        "Control sensitivity CSV",
    )

    return df


def normalize_bool(value) -> bool:
    if isinstance(value, bool):
        return value

    text = str(value).strip().lower()

    if text in {"true", "1", "yes"}:
        return True

    if text in {"false", "0", "no"}:
        return False

    fail(f"Cannot interpret boolean value: {value!r}")


def make_binary_endpoint(
    df: pd.DataFrame,
    endpoint_name: str,
) -> pd.DataFrame:
    """
    Construct paired observations for a single endpoint.

    Returns one row per model/question pair with:
        baseline / endpoint condition
        propagated outcome
        question_id
        model
    """

    errors = df[df["metric_error_present"].map(normalize_bool)].copy()

    if errors.empty:
        fail(f"No metric-error observations found for {endpoint_name}.")

    base = errors[errors["alpha"] == 0.0].copy()
    endpoint = errors[errors["alpha"] == ALPHA_ENDPOINT].copy()

    if base.empty:
        fail(f"No alpha=0 observations found for {endpoint_name}.")

    if endpoint.empty:
        fail(
            f"No alpha={ALPHA_ENDPOINT} observations found for "
            f"{endpoint_name}."
        )

    base = base[
        [
            "model",
            "question_id",
            "baseline_status",
            "original_gt_decision",
            "perturbed_gt_decision",
        ]
    ].copy()

    endpoint = endpoint[
        [
            "model",
            "question_id",
            "perturbed_status",
            "original_gt_decision",
            "perturbed_gt_decision",
        ]
    ].copy()

    base = base.rename(
        columns={
            "baseline_status": "status",
            "original_gt_decision": "base_original_gt",
            "perturbed_gt_decision": "base_perturbed_gt",
        }
    )

    endpoint = endpoint.rename(
        columns={
            "perturbed_status": "status",
            "original_gt_decision": "endpoint_original_gt",
            "perturbed_gt_decision": "endpoint_perturbed_gt",
        }
    )

    base = base.drop_duplicates(["model", "question_id"])
    endpoint = endpoint.drop_duplicates(["model", "question_id"])

    merged = base.merge(
        endpoint,
        on=["model", "question_id"],
        how="inner",
        suffixes=("_base", "_endpoint"),
    )

    if len(merged) != len(base) or len(merged) != len(endpoint):
        fail(
            f"{endpoint_name}: endpoint pairing mismatch. "
            f"baseline={len(base)}, endpoint={len(endpoint)}, "
            f"paired={len(merged)}"
        )

    # The canonical GT decision must not change for alpha=.99.
    gt_base = merged["base_original_gt"].astype(str)
    gt_endpoint = merged["endpoint_perturbed_gt"].astype(str)

    gt_changes = int((gt_base != gt_endpoint).sum())

    if gt_changes != 0:
        fail(
            f"{endpoint_name}: canonical GT decision changed in "
            f"{gt_changes} paired observations at alpha=.99."
        )

    merged["propagated"] = (
        merged["status_endpoint"].astype(str).str.lower() == "propagated"
    ).astype(int)

    merged["condition"] = 1
    merged["endpoint"] = endpoint_name

    # Add the baseline observations as condition=0.
    baseline_rows = merged[
        [
            "model",
            "question_id",
            "status_base",
        ]
    ].copy()

    baseline_rows["propagated"] = (
        baseline_rows["status_base"].astype(str).str.lower() == "propagated"
    ).astype(int)

    baseline_rows["condition"] = 0
    baseline_rows["endpoint"] = endpoint_name

    endpoint_rows = merged[
        [
            "model",
            "question_id",
            "propagated",
            "condition",
            "endpoint",
        ]
    ].copy()

    result = pd.concat(
        [
            baseline_rows,
            endpoint_rows,
        ],
        ignore_index=True,
    )

    # Treat question_id as a categorical grouping variable.
    result["question_id"] = result["question_id"].astype(str)
    result["model"] = result["model"].astype(str)
    result["condition"] = result["condition"].astype(int)
    result["propagated"] = result["propagated"].astype(int)

    return result


def make_directional_endpoint(
    primary: pd.DataFrame,
    control: pd.DataFrame,
) -> pd.DataFrame:
    """
    Construct paired away-vs-toward observations at alpha=.99.

    condition=0 -> away
    condition=1 -> toward
    outcome=propagated
    """

    p = primary[
        (primary["alpha"] == ALPHA_ENDPOINT)
        & (primary["metric_error_present"].map(normalize_bool))
    ].copy()

    c = control[
        (control["alpha"] == ALPHA_ENDPOINT)
        & (control["metric_error_present"].map(normalize_bool))
    ].copy()

    p = p[
        [
            "model",
            "question_id",
            "perturbed_status",
            "original_gt_decision",
            "perturbed_gt_decision",
        ]
    ].rename(
        columns={
            "perturbed_status": "toward_status",
            "original_gt_decision": "toward_original_gt",
            "perturbed_gt_decision": "toward_gt",
        }
    )

    c = c[
        [
            "model",
            "question_id",
            "perturbed_status",
            "original_gt_decision",
            "perturbed_gt_decision",
        ]
    ].rename(
        columns={
            "perturbed_status": "away_status",
            "original_gt_decision": "away_original_gt",
            "perturbed_gt_decision": "away_gt",
        }
    )

    p = p.drop_duplicates(["model", "question_id"])
    c = c.drop_duplicates(["model", "question_id"])

    merged = p.merge(
        c,
        on=["model", "question_id"],
        how="inner",
    )

    if len(merged) != len(p) or len(merged) != len(c):
        fail(
            "Directional endpoint pairing mismatch: "
            f"toward={len(p)}, away={len(c)}, paired={len(merged)}"
        )

    toward_gt_changes = int(
        (
            merged["toward_gt"].astype(str)
            != merged["toward_original_gt"].astype(str)
        ).sum()
    )

    away_gt_changes = int(
        (
            merged["away_gt"].astype(str)
            != merged["away_original_gt"].astype(str)
        ).sum()
    )

    if toward_gt_changes != 0 or away_gt_changes != 0:
        fail(
            "Directional alpha=.99 changed canonical GT decisions: "
            f"toward={toward_gt_changes}, away={away_gt_changes}"
        )

    away_rows = merged[
        [
            "model",
            "question_id",
            "away_status",
        ]
    ].copy()

    away_rows["propagated"] = (
        away_rows["away_status"].astype(str).str.lower() == "propagated"
    ).astype(int)

    away_rows["condition"] = 0
    away_rows["endpoint"] = "away_vs_toward"

    toward_rows = merged[
        [
            "model",
            "question_id",
            "toward_status",
        ]
    ].copy()

    toward_rows["propagated"] = (
        toward_rows["toward_status"].astype(str).str.lower()
        == "propagated"
    ).astype(int)

    toward_rows["condition"] = 1
    toward_rows["endpoint"] = "away_vs_toward"

    away_rows = away_rows[
        [
            "model",
            "question_id",
            "propagated",
            "condition",
            "endpoint",
        ]
    ]

    toward_rows = toward_rows[
        [
            "model",
            "question_id",
            "propagated",
            "condition",
            "endpoint",
        ]
    ]

    result = pd.concat(
        [
            away_rows,
            toward_rows,
        ],
        ignore_index=True,
    )

    result["question_id"] = result["question_id"].astype(str)
    result["model"] = result["model"].astype(str)
    result["condition"] = result["condition"].astype(int)
    result["propagated"] = result["propagated"].astype(int)

    return result


def fit_question_glmm(
    df: pd.DataFrame,
    name: str,
) -> dict:
    """
    Fit:

        propagated ~ condition
        random intercept: question_id

    using BinomialBayesMixedGLM variational Bayes.
    """

    if df["propagated"].nunique() < 2:
        fail(f"{name}: outcome has only one class.")

    if df["condition"].nunique() < 2:
        fail(f"{name}: condition has only one level.")

    model = BinomialBayesMixedGLM.from_formula(
        "propagated ~ condition",
        {
            "question": "0 + C(question_id)",
        },
        df,
        vcp_p=1.0,
        fe_p=2.0,
    )

    # Seed the NumPy random state immediately before fit_vb(). fit_vb's
    # starting posterior-SD vector (drawn internally via np.random.normal
    # when `sd=` is not supplied) is otherwise unseeded, which makes the
    # VB fit non-deterministic across re-runs. This seed affects only this
    # secondary Phase 1.5G fit; it is unrelated to any D/E/F seed.
    np.random.seed(PHASE_1_5G_SEED)

    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")

        result = model.fit_vb(
            fit_method="BFGS",
            minim_opts={
                "maxiter": 10000,
                "gtol": 1e-7,
            },
            verbose=False,
        )

    vb_warning_emitted = any(
        "did not converge" in str(w.message) for w in caught
    )

    # optimizer_success/optimizer_message are derived from fit_vb's own
    # convergence warning mechanism above.
    optimizer_success = not vb_warning_emitted
    optimizer_message = (
        "scipy.optimize.minimize did not report full convergence "
        "(UserWarning: VB fitting did not converge)"
        if vb_warning_emitted
        else "No non-convergence warning was raised by fit_vb()."
    )

    # The fitted result exposes the underlying SciPy OptimizeResult
    # through result.optim_retvals in the tested statsmodels version.
    # We intentionally do not persist optimizer-specific diagnostics in
    # the canonical summary artifact here; the optimizer/restart
    # robustness checks are preserved separately as a secondary
    # diagnostic artifact.
    gradient_norm_at_solution = None

    names = list(model.exog_names)

    if "condition" not in names:
        fail(
            f"{name}: could not locate condition coefficient. "
            f"Fixed effects: {names}"
        )

    idx = names.index("condition")

    beta = float(result.fe_mean[idx])
    sd = float(result.fe_sd[idx])

    ci_low_beta = beta - 1.96 * sd
    ci_high_beta = beta + 1.96 * sd

    odds_ratio = float(np.exp(beta))
    ci_low_or = float(np.exp(ci_low_beta))
    ci_high_or = float(np.exp(ci_high_beta))

    # Normal approximation to posterior probability beta > 0.
    if sd > 0:
        z = beta / sd
        prob_positive = float(
            0.5 * (1.0 + math.erf(z / math.sqrt(2.0)))
        )
    else:
        prob_positive = 1.0 if beta > 0 else 0.0

    variance_component_log_sd = float(result.vcp_mean[0])
    question_random_sd = float(np.exp(variance_component_log_sd))

    return {
        "analysis": name,
        "n_rows": int(len(df)),
        "n_pairs": int(len(df) // 2),
        "n_questions": int(df["question_id"].nunique()),
        "n_models": int(df["model"].nunique()),
        "baseline_or_control_rate": float(
            df.loc[df["condition"] == 0, "propagated"].mean()
        ),
        "endpoint_rate": float(
            df.loc[df["condition"] == 1, "propagated"].mean()
        ),
        "beta_condition_log_odds": beta,
        "posterior_sd_beta": sd,
        "odds_ratio_endpoint_vs_condition0": odds_ratio,
        "or_ci_low_95": ci_low_or,
        "or_ci_high_95": ci_high_or,
        "posterior_probability_beta_gt_0": prob_positive,
        "question_random_intercept_sd": question_random_sd,
        "estimation": "BinomialBayesMixedGLM_fit_vb",
        "vb_warning_emitted": vb_warning_emitted,
        "optimizer_success": optimizer_success,
        "optimizer_message": optimizer_message,
        "gradient_norm_at_solution": gradient_norm_at_solution,
        "phase_1_5g_seed": PHASE_1_5G_SEED,
    }


def paired_mcnemar(
    df: pd.DataFrame,
    name: str,
) -> dict:
    """
    Recompute the exact paired McNemar test from the constructed pairs.

    This is included only as a transparent reference against the existing
    Phase 1.5 numbers.
    """

    if len(df) % 2 != 0:
        fail(f"{name}: expected paired rows, got {len(df)}.")

    base = df[df["condition"] == 0][
        ["model", "question_id", "propagated"]
    ].rename(columns={"propagated": "base"})

    endpoint = df[df["condition"] == 1][
        ["model", "question_id", "propagated"]
    ].rename(columns={"propagated": "endpoint"})

    x = base.merge(
        endpoint,
        on=["model", "question_id"],
        how="inner",
    )

    if len(x) * 2 != len(df):
        fail(
            f"{name}: pairing failure during McNemar recomputation. "
            f"rows={len(df)}, pairs={len(x)}"
        )

    b = int(((x["base"] == 0) & (x["endpoint"] == 1)).sum())
    c = int(((x["base"] == 1) & (x["endpoint"] == 0)).sum())

    p_value = float(
        binomtest(
            b,
            b + c,
            0.5,
            alternative="two-sided",
        ).pvalue
    )

    baseline_rate = float(x["base"].mean())
    endpoint_rate = float(x["endpoint"].mean())

    return {
        "analysis": name,
        "n_pairs": int(len(x)),
        "baseline_rate": baseline_rate,
        "endpoint_rate": endpoint_rate,
        "difference_pp": (endpoint_rate - baseline_rate) * 100.0,
        "absorbed_to_propagated": b,
        "propagated_to_absorbed": c,
        "mcnemar_exact_p": p_value,
    }


def gpt_only_check(
    df: pd.DataFrame,
    name: str,
) -> dict:
    """
    Existing-model sensitivity check for observations concentrated in
    the canonical `gpt`-labeled subset. This script does not assert a
    specific underlying model identity for that label (see the GPT-label
    provenance note in the generated report).
    """

    g = df[df["model"].astype(str).str.lower() == GPT_LABEL].copy()

    if g.empty:
        return {
            "analysis": name,
            "available": False,
            "reason": f"No model labeled '{GPT_LABEL}' found.",
        }

    result = paired_mcnemar(g, name)
    result["available"] = True
    result["model"] = GPT_LABEL

    return result


def main() -> None:
    print("=" * 70)
    print("ClimateTwin Phase 1.5G — Mixed-Effects Robustness Analysis")
    print("=" * 70)
    print(f"Primary : {PRIMARY_FILE}")
    print(f"Control : {CONTROL_FILE}")
    print(f"Endpoint: alpha={ALPHA_ENDPOINT}")
    print()

    primary = load_primary()
    control = load_control()

    primary_errors = primary[
        primary["metric_error_present"].map(normalize_bool)
    ].copy()

    control_errors = control[
        control["metric_error_present"].map(normalize_bool)
    ].copy()

    print(
        "Primary metric-error observations:",
        primary_errors[["model", "question_id"]]
        .drop_duplicates()
        .shape[0],
    )

    print(
        "Control metric-error observations:",
        control_errors[["model", "question_id"]]
        .drop_duplicates()
        .shape[0],
    )

    # ---------------------------------------------------------------
    # PRIMARY: baseline -> toward alpha=.99
    # ---------------------------------------------------------------

    print()
    print("Building baseline -> toward dataset...")

    primary_glmm_data = make_binary_endpoint(
        primary,
        "baseline_vs_toward",
    )

    primary_mcnemar = paired_mcnemar(
        primary_glmm_data,
        "baseline_vs_toward",
    )

    print(
        f"  Pairs: {primary_mcnemar['n_pairs']}"
    )

    print(
        f"  Baseline: "
        f"{primary_mcnemar['baseline_rate']:.6f}"
    )

    print(
        f"  Toward:   "
        f"{primary_mcnemar['endpoint_rate']:.6f}"
    )

    print(
        f"  McNemar p: "
        f"{primary_mcnemar['mcnemar_exact_p']:.8g}"
    )

    print("  Fitting question-random-intercept GLMM...")

    primary_glmm = fit_question_glmm(
        primary_glmm_data,
        "baseline_vs_toward",
    )

    print(
        f"  OR: "
        f"{primary_glmm['odds_ratio_endpoint_vs_condition0']:.6f}"
    )

    print(
        f"  Approx. 95% credible interval (mean-field VB): "
        f"[{primary_glmm['or_ci_low_95']:.6f}, "
        f"{primary_glmm['or_ci_high_95']:.6f}]"
    )

    print(
        f"  Posterior P(beta>0): "
        f"{primary_glmm['posterior_probability_beta_gt_0']:.6f}"
    )

    print(
        f"  VB warning emitted: {primary_glmm['vb_warning_emitted']}"
    )

    # ---------------------------------------------------------------
    # DIRECTIONAL: away -> toward alpha=.99
    # ---------------------------------------------------------------

    print()
    print("Building away -> toward dataset...")

    directional_data = make_directional_endpoint(
        primary,
        control,
    )

    directional_mcnemar = paired_mcnemar(
        directional_data,
        "away_vs_toward",
    )

    print(
        f"  Pairs: {directional_mcnemar['n_pairs']}"
    )

    print(
        f"  Away:   "
        f"{directional_mcnemar['baseline_rate']:.6f}"
    )

    print(
        f"  Toward: "
        f"{directional_mcnemar['endpoint_rate']:.6f}"
    )

    print(
        f"  McNemar p: "
        f"{directional_mcnemar['mcnemar_exact_p']:.8g}"
    )

    print("  Fitting question-random-intercept GLMM...")

    directional_glmm = fit_question_glmm(
        directional_data,
        "away_vs_toward",
    )

    print(
        f"  OR: "
        f"{directional_glmm['odds_ratio_endpoint_vs_condition0']:.6f}"
    )

    print(
        f"  Approx. 95% credible interval (mean-field VB): "
        f"[{directional_glmm['or_ci_low_95']:.6f}, "
        f"{directional_glmm['or_ci_high_95']:.6f}]"
    )

    print(
        f"  Posterior P(beta>0): "
        f"{directional_glmm['posterior_probability_beta_gt_0']:.6f}"
    )

    print(
        f"  VB warning emitted: {directional_glmm['vb_warning_emitted']}"
    )

    # ---------------------------------------------------------------
    # GPT-label-subset sensitivity checks
    # ---------------------------------------------------------------

    print()
    print("Canonical `gpt`-labeled-subset sensitivity checks...")

    gpt_primary = gpt_only_check(
        primary_glmm_data,
        "gpt_only_baseline_vs_toward",
    )

    gpt_directional = gpt_only_check(
        directional_data,
        "gpt_only_away_vs_toward",
    )

    if gpt_primary.get("available"):
        print(
            f"  GPT primary pairs: "
            f"{gpt_primary['n_pairs']}"
        )
        print(
            f"  GPT primary McNemar p: "
            f"{gpt_primary['mcnemar_exact_p']:.8g}"
        )

    if gpt_directional.get("available"):
        print(
            f"  GPT directional pairs: "
            f"{gpt_directional['n_pairs']}"
        )
        print(
            f"  GPT directional McNemar p: "
            f"{gpt_directional['mcnemar_exact_p']:.8g}"
        )

    # ---------------------------------------------------------------
    # Save outputs
    # ---------------------------------------------------------------

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    primary_glmm_data.to_csv(
        OUT_DIR / "phase_1_5g_primary_model_data.csv",
        index=False,
    )

    directional_data.to_csv(
        OUT_DIR / "phase_1_5g_directional_model_data.csv",
        index=False,
    )

    summary_rows = [
        {
            **primary_glmm,
            **{
                f"mcnemar_{k}": v
                for k, v in primary_mcnemar.items()
                if k != "analysis"
            },
        },
        {
            **directional_glmm,
            **{
                f"mcnemar_{k}": v
                for k, v in directional_mcnemar.items()
                if k != "analysis"
            },
        },
    ]

    summary = pd.DataFrame(summary_rows)

    summary.to_csv(
        OUT_DIR / "phase_1_5g_mixed_effects_summary.csv",
        index=False,
    )

    gpt_summary = pd.DataFrame(
        [
            gpt_primary,
            gpt_directional,
        ]
    )

    gpt_summary.to_csv(
        OUT_DIR / "phase_1_5g_gpt_sensitivity.csv",
        index=False,
    )

    metadata = {
        "phase": "1.5G",
        "analysis": "question_clustered_mixed_effects_robustness",
        "source_primary": str(PRIMARY_FILE),
        "source_control": str(CONTROL_FILE),
        "alpha_endpoint": ALPHA_ENDPOINT,
        "random_effect": "question_id_random_intercept",
        "model_random_effect": False,
        "new_model_inference": False,
        "n_primary_pairs": primary_mcnemar["n_pairs"],
        "n_directional_pairs": directional_mcnemar["n_pairs"],
        "primary_mcnemar_p": primary_mcnemar["mcnemar_exact_p"],
        "directional_mcnemar_p": directional_mcnemar[
            "mcnemar_exact_p"
        ],
        "phase_1_5g_seed": PHASE_1_5G_SEED,
        "primary_vb_warning_emitted": primary_glmm["vb_warning_emitted"],
        "primary_optimizer_success": primary_glmm["optimizer_success"],
        "primary_optimizer_message": primary_glmm["optimizer_message"],
        "directional_vb_warning_emitted": directional_glmm[
            "vb_warning_emitted"
        ],
        "directional_optimizer_success": directional_glmm[
            "optimizer_success"
        ],
        "directional_optimizer_message": directional_glmm[
            "optimizer_message"
        ],
        "interval_terminology": (
            "approximate 95% credible interval under the mean-field "
            "variational-Bayes Gaussian posterior approximation "
            "(NOT an exact frequentist confidence interval; mean-field "
            "VB can underestimate posterior variance)"
        ),
        "gpt_label_provenance_note": (
            "The canonical `gpt`-labeled subset is associated with "
            "GPT-OSS-120B in repository notebooks/documentation "
            "(e.g. project_master.md, 10_derivation_analysis.ipynb), "
            "but the evaluation infrastructure "
            "(evaluate_derivation.py, analyze_margin_sensitivity.py) "
            "also contains a distinct `gpt_oss_120b` label/raw-output "
            "file. This script reports results only for the canonical "
            "`gpt`-labeled subset and does not assert a specific model "
            "identity for that label."
        ),
        "analysis_role": (
            "Phase 1.5G is a SECONDARY robustness analysis. The frozen "
            "paired McNemar test (Phase 1.5D/E/F) remains the primary "
            "inferential analysis and is unaffected by anything in "
            "this file."
        ),
        "python": sys.version,
        "platform": platform.platform(),
    }

    with open(
        OUT_DIR / "phase_1_5g_metadata.json",
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(metadata, f, indent=2)

    report = f"""# ClimateTwin Phase 1.5G — Mixed-Effects Robustness

## Purpose

This analysis re-evaluates the frozen Phase 1.5 endpoints using a
binomial generalized linear mixed model with a question-level random
intercept.

No model inference or benchmark generation was performed.

**Phase 1.5G is a SECONDARY robustness analysis.** The frozen paired
McNemar test (Phase 1.5D/E/F) remains the primary inferential analysis.
Nothing in this file changes, supersedes, or is required to support that
primary result.

## Primary endpoint

Baseline -> toward-GT alpha={ALPHA_ENDPOINT}

- N pairs: {primary_mcnemar["n_pairs"]}
- Baseline propagation: {primary_mcnemar["baseline_rate"]:.6%}
- Toward propagation: {primary_mcnemar["endpoint_rate"]:.6%}
- Difference: {primary_mcnemar["difference_pp"]:+.4f} pp
- Exact McNemar p: {primary_mcnemar["mcnemar_exact_p"]:.8g}
- Mixed-model OR: {primary_glmm["odds_ratio_endpoint_vs_condition0"]:.6f}
- Approx. 95% credible interval (mean-field VB):
  [{primary_glmm["or_ci_low_95"]:.6f},
   {primary_glmm["or_ci_high_95"]:.6f}]
- Posterior P(beta > 0):
  {primary_glmm["posterior_probability_beta_gt_0"]:.6f}

Question random-intercept SD:
{primary_glmm["question_random_intercept_sd"]:.6f}

VB warning emitted: {primary_glmm["vb_warning_emitted"]}
Optimizer message: {primary_glmm["optimizer_message"]}

## Directional control

Away-GT alpha={ALPHA_ENDPOINT} -> toward-GT alpha={ALPHA_ENDPOINT}

- N pairs: {directional_mcnemar["n_pairs"]}
- Away propagation: {directional_mcnemar["baseline_rate"]:.6%}
- Toward propagation: {directional_mcnemar["endpoint_rate"]:.6%}
- Difference: {directional_mcnemar["difference_pp"]:+.4f} pp
- Exact McNemar p: {directional_mcnemar["mcnemar_exact_p"]:.8g}
- Mixed-model OR: {directional_glmm["odds_ratio_endpoint_vs_condition0"]:.6f}
- Approx. 95% credible interval (mean-field VB):
  [{directional_glmm["or_ci_low_95"]:.6f},
   {directional_glmm["or_ci_high_95"]:.6f}]
- Posterior P(beta > 0):
  {directional_glmm["posterior_probability_beta_gt_0"]:.6f}

Question random-intercept SD:
{directional_glmm["question_random_intercept_sd"]:.6f}

VB warning emitted: {directional_glmm["vb_warning_emitted"]}
Optimizer message: {directional_glmm["optimizer_message"]}

## Convergence diagnostic note

Fitting uses `statsmodels.genmod.bayes_mixed_glm.BinomialBayesMixedGLM`
with `fit_vb(fit_method="BFGS")`. This fit can intermittently raise
`UserWarning: VB fitting did not converge`, which is a direct pass-through
of `scipy.optimize.minimize`'s own `OptimizeResult.success` flag for the
BFGS backend on this ELBO surface — it does not, by itself, indicate a
different or worse solution. Independent checks across multiple optimizers
(BFGS, L-BFGS-B, Newton-CG) and multiple random restarts on this dataset
found the objective value and the odds-ratio estimate stable to several
significant figures regardless of whether this warning fired. The
NumPy random state used for the VB starting values is fixed
(`PHASE_1_5G_SEED = {PHASE_1_5G_SEED}`) so that whether the warning fires
on a given re-run is itself deterministic, but this seed is independent
of, and does not affect, any Phase 1.5D/E/F seed or result.

This diagnostic describes optimizer behavior only. It is not a claim
about the scientific validity of the primary McNemar endpoint, which does
not depend on this model.

## Interval terminology

The reported interval is an **approximate 95% credible interval under the
mean-field variational-Bayes Gaussian posterior approximation** — it is
not an exact posterior credible interval and not a frequentist confidence
interval. Mean-field VB approximates the joint posterior with an
independent-factor Gaussian, which is a known source of understated
posterior variance relative to the true (intractable) posterior. This
interval should be read as a plausible lower bound on true posterior
uncertainty rather than an exact quantification of it.

## Interpretation

The mixed-effects model is a robustness analysis addressing repeated
observations associated with the same benchmark question.

The original paired McNemar tests remain the frozen Phase 1.5 primary
analysis. This model does not replace them.

The result should be interpreted as evidence about directional
sensitivity of deterministic decision outcomes under controlled
threshold displacement, not as a causal deployment claim.

## GPT-label sensitivity and provenance

The paired results restricted to the canonical `gpt`-labeled subset are
reported separately because the observed metric-error population is
strongly concentrated in that label in the frozen Phase 1.5 artifacts.

Repository notebooks and narrative documentation (e.g.
`project_master.md`, `10_derivation_analysis.ipynb`) associate the
canonical `gpt` subset with GPT-OSS-120B. However, the evaluation
infrastructure (`evaluate_derivation.py`, `analyze_margin_sensitivity.py`)
also contains a distinct `gpt_oss_120b` label backed by its own,
non-identical raw-output file. This script reports results only for the
canonical `gpt`-labeled subset and does not itself assert a specific
model identity for that label.

## Reproducibility

All inputs are already-generated Phase 1.5 CSV files.
No model/API inference was performed.

The NumPy random state for the VB starting-value initialization is fixed
via `PHASE_1_5G_SEED = {PHASE_1_5G_SEED}`, set immediately before each
`fit_vb()` call. This is a Phase 1.5G-only seed and is independent of any
Phase 1.5D/E/F seed.
"""

    with open(
        OUT_DIR / "phase_1_5g_report.md",
        "w",
        encoding="utf-8",
    ) as f:
        f.write(report)

    print()
    print("=" * 70)
    print("Saved:")
    print(f"  {OUT_DIR / 'phase_1_5g_mixed_effects_summary.csv'}")
    print(f"  {OUT_DIR / 'phase_1_5g_gpt_sensitivity.csv'}")
    print(f"  {OUT_DIR / 'phase_1_5g_report.md'}")
    print(f"  {OUT_DIR / 'phase_1_5g_metadata.json'}")
    print("=" * 70)
    print("DONE")


if __name__ == "__main__":
    main()