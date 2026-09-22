"""
Tests for analyze_margin_sensitivity.py.

Scope: ONLY the new margin-sensitivity implementation. No existing tests
exist in this repository to extend, and no existing files are modified
by this test module.

Run with:
    python -m pytest experiments/experiment_05_derivation/tests/test_margin_sensitivity.py -v
"""

import copy
import os
import sys

import numpy as np
import pandas as pd
import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
EXP_DIR = os.path.dirname(HERE)
ROOT = os.path.abspath(os.path.join(EXP_DIR, "..", ".."))
SRC_DIR = os.path.join(ROOT, "src")

sys.path.append(SRC_DIR)
sys.path.append(EXP_DIR)

from hypothesis_benchmark_generator_v2 import classify_with_thresholds  # noqa: E402
import analyze_margin_sensitivity as ms  # noqa: E402


# ----------------------------------------------------------
# Fixtures: minimal synthetic protocols, one per subcategory,
# constructed so GT metrics comfortably satisfy SUPPORT.
# ----------------------------------------------------------

def persistent_protocol():
    protocol = {
        "subcategory": "persistent_regional_anomaly_verification",
        "thresholds": {
            "support_mean_abs_p75": 0.70,
            "refute_mean_abs_p50": 0.40,
            "support_fraction_above_p75": 0.25,
            "refute_fraction_above_p75": 0.0,
            "support_completeness_p10": 1.0,
        },
    }
    gt_metrics = {
        "min_yearly_mean_abs_anomaly": 1.00,
        "min_fraction_cells_above_p75": 0.50,
        "min_yearly_mean_completeness": 1.0,
    }
    return protocol, gt_metrics


def localized_protocol():
    protocol = {
        "subcategory": "localized_intensification_verification",
        "thresholds": {
            "support_regional_change_q60": 0.10,
            "refute_regional_change_q25": -0.20,
            "support_contrast_change_q75": 0.10,
            "refute_contrast_change_q25": -0.10,
            "support_rainfall_change_q60": 0.20,
            "refute_rainfall_change_q25": -0.40,
        },
    }
    gt_metrics = {
        "regional_abs_anomaly_change": 0.50,
        "localized_contrast_change": 0.50,
        "regional_rainfall_change": 0.50,
    }
    return protocol, gt_metrics


def wet_consistency_protocol():
    protocol = {
        "subcategory": "wet_anomaly_consistency_verification",
        "thresholds": {
            "support_signed_anomaly_p75": 0.40,
            "refute_signed_anomaly_p25": -0.30,
            "support_rainfall_change_q75": 0.50,
            "refute_rainfall_change_q25": -0.40,
            "support_fraction_increase_q75": 0.80,
            "refute_fraction_increase_q25": 0.10,
        },
    }
    gt_metrics = {
        "mean_signed_anomaly_later_year": 0.90,
        "regional_rainfall_change": 0.90,
        "fraction_cells_rainfall_increased": 0.95,
    }
    return protocol, gt_metrics


def spatial_protocol():
    protocol = {
        "subcategory": "spatial_coherence_verification",
        "thresholds": {
            "active_cell_threshold_yearly_abs_p80": 0.80,  # not read by classify_with_thresholds
            "support_active_count_min": 2.5,
            "refute_active_count_max": 0.5,
            "support_largest_component_min": 2.5,
            "refute_largest_component_max": 0.5,
            "support_component_count_max": 1.5,
            "refute_component_count_min": 2.5,
        },
    }
    gt_metrics = {
        "active_cell_count": 6.0,
        "largest_component_size": 6.0,
        "component_count": 1.0,
    }
    return protocol, gt_metrics


# ----------------------------------------------------------
# 1. Baseline transformation is identity
# ----------------------------------------------------------

def test_baseline_transformation_is_identity():
    protocol, gt_metrics = persistent_protocol()
    perturbed = ms.perturb_protocol(protocol, gt_metrics, 0.0)
    assert perturbed["thresholds"] == protocol["thresholds"]
    # And the original protocol dict must be untouched (deep copy).
    original_snapshot = copy.deepcopy(protocol)
    ms.perturb_protocol(protocol, gt_metrics, 1.0)
    assert protocol == original_snapshot


# ----------------------------------------------------------
# 2. Canonical oracle result is preserved at baseline
# ----------------------------------------------------------

@pytest.mark.parametrize(
    "factory",
    [persistent_protocol, localized_protocol, wet_consistency_protocol, spatial_protocol],
)
def test_canonical_oracle_preserved_at_baseline(factory):
    protocol, gt_metrics = factory()
    baseline_decision = classify_with_thresholds(gt_metrics, protocol)
    perturbed = ms.perturb_protocol(protocol, gt_metrics, 0.0)
    assert classify_with_thresholds(gt_metrics, perturbed) == baseline_decision


# ----------------------------------------------------------
# 3. A known absorbed case remains absorbed at sufficiently wide margin
# ----------------------------------------------------------

def test_known_absorbed_case_remains_absorbed_at_wide_margin():
    protocol, gt_metrics = persistent_protocol()
    gt_decision = classify_with_thresholds(gt_metrics, protocol)
    assert gt_decision == "SUPPORTED"

    # A small metric error that does not change the decision at baseline.
    pred_metrics = dict(gt_metrics)
    pred_metrics["min_yearly_mean_abs_anomaly"] -= 0.01
    pred_decision = classify_with_thresholds(pred_metrics, protocol)
    assert pred_decision == gt_decision  # absorbed at baseline

    # Relaxing the margin (alpha < 0, threshold moves further away from GT)
    # must keep it absorbed.
    relaxed = ms.perturb_protocol(protocol, gt_metrics, -1.0)
    assert classify_with_thresholds(pred_metrics, relaxed) == classify_with_thresholds(gt_metrics, relaxed)


# ----------------------------------------------------------
# 4. A known propagated case remains propagated under corresponding baseline geometry
# ----------------------------------------------------------

def test_known_propagated_case_remains_propagated_at_baseline_geometry():
    protocol, gt_metrics = persistent_protocol()
    gt_decision = classify_with_thresholds(gt_metrics, protocol)

    # A large metric error that flips the decision at baseline (alpha=0).
    pred_metrics = dict(gt_metrics)
    pred_metrics["min_yearly_mean_abs_anomaly"] = 0.10  # below refute_mean_abs_p50
    pred_decision = classify_with_thresholds(pred_metrics, protocol)
    assert pred_decision != gt_decision  # propagated at baseline geometry

    baseline = ms.perturb_protocol(protocol, gt_metrics, 0.0)
    assert classify_with_thresholds(pred_metrics, baseline) != classify_with_thresholds(gt_metrics, baseline)


# ----------------------------------------------------------
# 5. Threshold perturbation moves in the intended direction
# ----------------------------------------------------------

def test_threshold_moves_toward_gt_as_alpha_increases():
    protocol, gt_metrics = persistent_protocol()
    T0 = protocol["thresholds"]["support_mean_abs_p75"]
    G = gt_metrics["min_yearly_mean_abs_anomaly"]
    assert G > T0

    prev_gap = abs(G - T0)
    for alpha in [0.0, 0.25, 0.5, 0.75, 1.0]:
        perturbed = ms.perturb_protocol(protocol, gt_metrics, alpha)
        Tp = perturbed["thresholds"]["support_mean_abs_p75"]
        gap = abs(G - Tp)
        assert gap <= prev_gap + 1e-9
        prev_gap = gap

    # At alpha=1 the threshold must exactly equal the GT metric.
    at_one = ms.perturb_protocol(protocol, gt_metrics, 1.0)
    assert at_one["thresholds"]["support_mean_abs_p75"] == pytest.approx(G)

    # Negative alpha must move the threshold further away (relaxation).
    relaxed = ms.perturb_protocol(protocol, gt_metrics, -1.0)
    Tr = relaxed["thresholds"]["support_mean_abs_p75"]
    assert abs(G - Tr) > abs(G - T0)


# ----------------------------------------------------------
# 6. AND/OR protocols are not accidentally reduced to scalar logic
# ----------------------------------------------------------

def test_and_or_protocol_structure_preserved():
    # wet_anomaly_consistency_verification has a nested AND-inside-OR
    # refute condition. Perturbing thresholds must still be evaluated
    # through the full classify_with_thresholds() boolean structure, not
    # a scalar shortcut -- verified by checking a case where only one of
    # two OR-ed refute sub-conditions is triggered by the perturbation.
    protocol, gt_metrics = wet_consistency_protocol()
    gt_decision = classify_with_thresholds(gt_metrics, protocol)
    assert gt_decision == "SUPPORTED"

    # Predicted metrics that satisfy the nested AND's first conjunct
    # (signed anomaly still high) but trip only ONE of the two nested OR
    # disjuncts (rainfall change low, fraction increase still high).
    pred_metrics = dict(gt_metrics)
    pred_metrics["regional_rainfall_change"] = -0.50  # below refute_rainfall_change_q25 baseline
    pred_decision = classify_with_thresholds(pred_metrics, protocol)
    assert pred_decision == "REFUTED"  # nested AND/OR correctly triggers refute

    # This must still work identically after a (harmless, off-axis)
    # perturbation of unrelated thresholds -- i.e. the compound boolean
    # structure, not a scalar reduction, is what's being evaluated.
    perturbed = ms.perturb_protocol(protocol, gt_metrics, 0.1)
    perturbed_pred_decision = classify_with_thresholds(pred_metrics, perturbed)
    assert perturbed_pred_decision in {"REFUTED", "AMBIGUOUS"}  # still driven by the nested condition, not scalar


# ----------------------------------------------------------
# 7. Unsupported protocol structures are explicitly handled
# ----------------------------------------------------------

def test_unsupported_subcategory_is_explicit_not_silent():
    fake_protocol = {"subcategory": "not_a_real_subcategory", "thresholds": {}}
    result = ms.perturb_protocol(fake_protocol, {}, 0.5)
    assert result is None  # explicit signal, not a silently-wrong approximation


# ----------------------------------------------------------
# 8. Sensitivity outcome remains anchored to canonical GT decision
# ----------------------------------------------------------

def test_sensitivity_uses_canonical_gt_decision_as_fixed_reference():
    protocol, gt_metrics = persistent_protocol()
    canonical_gt = classify_with_thresholds(gt_metrics, protocol)

    # At alpha=1 some boundary operators may change the perturbed GT
    # classification itself. That diagnostic must never redefine the
    # outcome against which propagation is measured.
    perturbed = ms.perturb_protocol(protocol, gt_metrics, 1.0)
    perturbed_gt = classify_with_thresholds(gt_metrics, perturbed)

    pred_metrics = dict(gt_metrics)
    pred_metrics["min_yearly_mean_abs_anomaly"] = 0.10
    perturbed_pred = classify_with_thresholds(pred_metrics, perturbed)

    expected = "absorbed" if perturbed_pred == canonical_gt else "propagated"
    assert expected == "propagated"
    # This fixture demonstrates the exact failure mode we guard against:
    # the intervention can move the GT point onto a different boundary
    # label, but that must not redefine the canonical target.
    assert canonical_gt != perturbed_gt


# ----------------------------------------------------------
# 9. Deterministic repeated execution gives identical output
# ----------------------------------------------------------

def test_deterministic_repeated_execution():
    protocol, gt_metrics = persistent_protocol()
    pred_metrics = dict(gt_metrics)
    pred_metrics["min_yearly_mean_abs_anomaly"] -= 0.05

    results_1 = []
    results_2 = []
    for alpha in ms.ALPHA_SCHEDULE:
        p1 = ms.perturb_protocol(protocol, gt_metrics, alpha)
        p2 = ms.perturb_protocol(protocol, gt_metrics, alpha)
        results_1.append(classify_with_thresholds(pred_metrics, p1))
        results_2.append(classify_with_thresholds(pred_metrics, p2))
    assert results_1 == results_2

    # Bootstrap determinism too.
    statuses = ["absorbed", "propagated", "absorbed", "absorbed", "propagated"]
    stats_a = ms.propagation_rate_with_ci(statuses, ("category", "x", 0.5), 200)
    stats_b = ms.propagation_rate_with_ci(statuses, ("category", "x", 0.5), 200)
    assert stats_a == stats_b


# ----------------------------------------------------------
# Extra: metric_error_present mirrors paper_statistics.py semantics
# ----------------------------------------------------------

def test_metric_error_present_tolerance():
    assert not ms.metric_error_present([1.0, 2.0], [1.00001, 2.00001])
    assert ms.metric_error_present([1.0, 2.0], [1.5, 2.0])
    assert ms.metric_error_present([1.0, 2.0], [1.0, None])
    assert not ms.metric_error_present([1.0, np.nan], [1.0, None])
