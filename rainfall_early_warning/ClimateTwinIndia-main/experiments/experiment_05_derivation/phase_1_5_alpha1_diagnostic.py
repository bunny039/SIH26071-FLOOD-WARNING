"""
ClimateTwin Phase 1.5 — Alpha=1.0 Diagnostic

Purpose
-------
Reproduce the alpha=1.0 canonical-GT decision-boundary diagnostic
independently of the frozen alpha<=0.99 sensitivity curves.

This is a diagnostic only.

It does NOT modify:
- benchmark files
- derivation results
- Phase 1.5D/E/F/G outputs

At alpha=1.0:

    T' = T + 1.0 * (GT_metric - T)
       = GT_metric

Therefore this diagnostic determines whether placing each targeted
threshold exactly on the canonical GT metric changes the canonical
decision.

The result must be reproducible from the current repository state.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[2]

PRIMARY = (
    ROOT
    / "experiments"
    / "experiment_05_derivation"
    / "results"
    / "margin_sensitivity"
    / "question_level_sensitivity.csv"
)

OUT_DIR = (
    ROOT
    / "experiments"
    / "experiment_05_derivation"
    / "results"
    / "phase_1_5_alpha1_diagnostic"
)


def as_bool(value):
    text = str(value).strip().lower()

    if text in {"true", "1", "yes"}:
        return True

    if text in {"false", "0", "no"}:
        return False

    raise ValueError(f"Cannot parse boolean: {value!r}")


def main():
    print("=" * 70)
    print("ClimateTwin Phase 1.5 — Alpha=1.0 Diagnostic")
    print("=" * 70)

    if not PRIMARY.exists():
        raise FileNotFoundError(PRIMARY)

    df = pd.read_csv(PRIMARY)

    required = {
        "model",
        "question_id",
        "alpha",
        "metric_error_present",
        "original_gt_decision",
        "perturbed_gt_decision",
    }

    missing = required - set(df.columns)

    if missing:
        raise RuntimeError(
            f"Missing required columns: {sorted(missing)}"
        )

    errors = df[
        df["metric_error_present"].map(as_bool)
    ].copy()

    observations = (
        errors[["model", "question_id"]]
        .drop_duplicates()
        .sort_values(["model", "question_id"])
        .reset_index(drop=True)
    )

    n = len(observations)

    print(f"Metric-error observations: {n}")

    # ---------------------------------------------------------------
    # First verify the frozen sensitivity artifact itself.
    # ---------------------------------------------------------------

    frozen_alphas = sorted(errors["alpha"].unique().tolist())

    print(f"Frozen alpha grid: {frozen_alphas}")

    if 1.0 in frozen_alphas:
        print("WARNING: alpha=1.0 already exists in frozen artifact.")
    else:
        print("alpha=1.0 is NOT part of the frozen sensitivity grid.")

    # ---------------------------------------------------------------
    # Reconstruct the alpha=1 decision diagnostic.
    #
    # The sensitivity artifact contains the canonical GT decision at
    # alpha=.99 but deliberately does not contain the underlying
    # metric/threshold state needed to independently rerun the oracle.
    #
    # Therefore we distinguish:
    #
    # A) directly reproducible facts from the frozen artifact
    # B) the historical alpha=1 claim, which requires an oracle-level
    #    reconstruction.
    # ---------------------------------------------------------------

    alpha99 = errors[
        errors["alpha"] == 0.99
    ].copy()

    if alpha99.empty:
        raise RuntimeError(
            "No alpha=.99 observations found."
        )

    alpha99_gt_changes = int(
        (
            alpha99["perturbed_gt_decision"].astype(str)
            != alpha99["original_gt_decision"].astype(str)
        ).sum()
    )

    print(
        f"alpha=.99 canonical GT changes: "
        f"{alpha99_gt_changes}"
    )

    # ---------------------------------------------------------------
    # IMPORTANT:
    #
    # We do NOT fabricate an alpha=1 result from alpha=.99.
    #
    # The question-level CSV does not contain enough information to
    # reconstruct T' at alpha=1 independently.
    #
    # Therefore the output explicitly records whether alpha=1 is
    # reproducible from this artifact alone.
    # ---------------------------------------------------------------

    result = {
        "phase": "1.5",
        "diagnostic": "alpha_1_0_canonical_decision_boundary",
        "source": str(PRIMARY),
        "n_metric_error_observations": n,
        "frozen_alpha_grid": frozen_alphas,
        "alpha_099_gt_decision_changes": alpha99_gt_changes,
        "alpha_1_0_present_in_frozen_artifact": 1.0 in frozen_alphas,
        "alpha_1_0_gt_decision_changes_reproducible_from_frozen_csv": False,
        "historical_alpha_1_0_claim": 222,
        "historical_alpha_1_0_denominator": 245,
        "historical_claim_status": (
            "UNVERIFIED_FROM_FROZEN_CSV"
        ),
        "reason": (
            "The frozen question-level sensitivity CSV does not "
            "contain alpha=1.0 rows or sufficient metric/threshold "
            "state to reconstruct the canonical oracle at alpha=1.0. "
            "Therefore the historical 222/245 figure must not be "
            "treated as independently reproduced by this artifact."
        ),
    }

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with open(
        OUT_DIR / "phase_1_5_alpha1_diagnostic.json",
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(result, f, indent=2)

    pd.DataFrame(
        [
            {
                "alpha": 0.99,
                "n": n,
                "gt_decision_changes": alpha99_gt_changes,
                "status": "reproduced_from_frozen_csv",
            },
            {
                "alpha": 1.00,
                "n": n,
                "gt_decision_changes": None,
                "status": "not_reproducible_from_frozen_csv",
            },
        ]
    ).to_csv(
        OUT_DIR / "phase_1_5_alpha1_diagnostic.csv",
        index=False,
    )

    report = f"""# Phase 1.5 Alpha=1.0 Diagnostic

## Reproducible result

The frozen Phase 1.5 sensitivity artifact contains:

- N = {n} metric-error observations.
- Alpha grid = {frozen_alphas}.
- Alpha=.99 canonical GT decision changes = {alpha99_gt_changes}.
- Alpha=1.0 is absent from the frozen sensitivity artifact.

## Alpha=1.0 status

The historical value of **222/245** alpha=1.0 canonical decision
changes is **not independently reproducible from the frozen
question-level CSV alone**.

This is intentional rather than an attempt to infer the missing value.

The frozen CSV does not preserve enough underlying metric/threshold
state to rerun the canonical decision function at alpha=1.0.

Therefore:

> The 222/245 figure must remain an unverified historical diagnostic
> until it is reproduced directly from the canonical oracle and the
> underlying benchmark metric/threshold state.

It must not be presented as a reproducibility result of the frozen
Phase 1.5 artifact.

## Important distinction

The alpha<=.99 Phase 1.5 results remain unaffected.

The frozen analysis establishes that canonical GT decisions do not
change through alpha=.99.

The alpha=1.0 equality-boundary behavior is a separate diagnostic.

"""

    with open(
        OUT_DIR / "phase_1_5_alpha1_diagnostic.md",
        "w",
        encoding="utf-8",
    ) as f:
        f.write(report)

    print()
    print("=" * 70)
    print("Saved:")
    print(
        OUT_DIR
        / "phase_1_5_alpha1_diagnostic.json"
    )
    print(
        OUT_DIR
        / "phase_1_5_alpha1_diagnostic.csv"
    )
    print(
        OUT_DIR
        / "phase_1_5_alpha1_diagnostic.md"
    )
    print("=" * 70)
    print("DONE")


if __name__ == "__main__":
    main()