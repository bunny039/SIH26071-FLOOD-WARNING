#!/usr/bin/env python3
"""
===========================================================
ClimateTwinBench Derivation Evaluator

Evaluates:
- Intermediate Metric Accuracy
- Protocol Recovery
- Pearson Correlation
- MAE
- RMSE
- Exact Match

Usage

python evaluate_derivation.py --model deepseek
python evaluate_derivation.py --model claude
python evaluate_derivation.py --model 
python evaluate_derivation.py --model gemini
===========================================================
"""

import argparse
import json
import os
import re
import sys

import numpy as np
import pandas as pd

from scipy.stats import pearsonr
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error
)

# ----------------------------------------------------------
# PROJECT PATHS
# ----------------------------------------------------------

ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        ".."
    )
)

SRC_DIR = os.path.join(ROOT, "src")

BENCHMARK = os.path.join(
    ROOT,
    "benchmark",
    "ClimateTwinBench_Hypothesis_V2.json"
)

RAW_DIR = os.path.join(
    os.path.dirname(__file__),
    "raw_outputs"
)

RESULT_DIR = os.path.join(
    os.path.dirname(__file__),
    "results"
)

os.makedirs(RESULT_DIR, exist_ok=True)

sys.path.append(SRC_DIR)

from hypothesis_benchmark_generator_v2 import classify_with_thresholds

# ----------------------------------------------------------
# ORACLE METRICS
# ----------------------------------------------------------

ORACLE_METRICS = {

    "persistent_regional_anomaly_verification": [

        "min_yearly_mean_abs_anomaly",

        "min_fraction_cells_above_p75",

        "min_yearly_mean_completeness"

    ],

    "localized_intensification_verification": [

        "regional_abs_anomaly_change",

        "localized_contrast_change",

        "regional_rainfall_change"

    ],

    "wet_anomaly_consistency_verification": [

        "mean_signed_anomaly_later_year",

        "regional_rainfall_change",

        "fraction_cells_rainfall_increased"

    ],

    "compound_state_transition_verification": [

        "regional_rainfall_change",

        "regional_temperature_change"

    ],

    "spatial_coherence_verification": [

        "active_cell_count",

        "largest_component_size",

        "component_count"

    ],

    "reliability_aware_claim_verification": [

        "mean_abs_anomaly",

        "mean_completeness"

    ]

}

# ----------------------------------------------------------
# LOAD BENCHMARK
# ----------------------------------------------------------

def load_questions():

    with open(BENCHMARK, "r", encoding="utf8") as f:

        benchmark = json.load(f)

    return benchmark["questions"]


# ----------------------------------------------------------
# LOAD RAW MODEL OUTPUT
# ----------------------------------------------------------

def load_raw_output(model_name):

    filename = os.path.join(

        RAW_DIR,

        f"{model_name}.txt"

    )

    if not os.path.exists(filename):

        raise FileNotFoundError(filename)

    with open(

        filename,

        "r",

        encoding="utf8"

    ) as f:

        text = f.read()

    return text


# ----------------------------------------------------------
# ROBUST BLOCK PARSER
# ----------------------------------------------------------

def parse_output(text):

    blocks = text.split("Derived Values")

    responses = []

    for block in blocks:

        if "Decision" not in block:
            continue

        response = {}

        m1 = re.search(
            r"Metric_1\s*=\s*([-+]?\d*\.?\d+)",
            block
        )

        m2 = re.search(
            r"Metric_2\s*=\s*([-+]?\d*\.?\d+)",
            block
        )

        m3 = re.search(
            r"Metric_3\s*=\s*([-+]?\d*\.?\d+)",
            block
        )

        decision = re.search(
            r"Decision\s*=\s*(SUPPORTED|REFUTED|INSUFFICIENT)",
            block
        )

        response["Metric1"] = (
            float(m1.group(1))
            if m1 else None
        )

        response["Metric2"] = (
            float(m2.group(1))
            if m2 else None
        )

        response["Metric3"] = (
            float(m3.group(1))
            if m3 else None
        )

        response["Decision"] = (
            decision.group(1)
            if decision else None
        )

        responses.append(response)

    print("=" * 60)
    print("Parsed Output")
    print("=" * 60)
    print("Responses:", len(responses))

    return responses

# ----------------------------------------------------------
# BUILD EVALUATION DATAFRAME
# ----------------------------------------------------------

def build_dataframe(
    questions,
    responses
):

    rows = []

    n = min(

        len(questions),

        len(responses)

    )

    print("=" * 60)
    print("Building DataFrame")
    print("=" * 60)
    print("Questions Used:", n)
    print()

    for i in range(n):

        question = questions[i]

        subcategory = question["subcategory"]

        oracle_metrics = ORACLE_METRICS[subcategory]

        gt_metrics = question["context"]["metrics"]

        response = responses[i]

        row = {

            "id": question["id"],

            "subcategory": subcategory,

            "GT_Decision":
                question["context"]["decision"],

            "Pred_Decision":
                response["Decision"],

            "protocol":
                question["context"]["protocol"]

        }

        predicted_values = [

            response["Metric1"],

            response["Metric2"],

            response["Metric3"]

        ]

        for j, metric_name in enumerate(oracle_metrics):

            row[f"Metric_Name{j+1}"] = metric_name

            row[f"GT_Metric{j+1}"] = gt_metrics[metric_name]

            # Only assign if the model actually produced that metric
            if j < len(predicted_values):

                row[f"Pred_Metric{j+1}"] = predicted_values[j]

            else:

                row[f"Pred_Metric{j+1}"] = None

        rows.append(row)

    df = pd.DataFrame(rows)

    return df

# ----------------------------------------------------------
# RECOVER DECISIONS USING ORACLE
# ----------------------------------------------------------

# ----------------------------------------------------------
# RECOVER DECISIONS USING ORACLE
# ----------------------------------------------------------

def recover_protocol(df):

    recovered = []

    for _, row in df.iterrows():

        metrics = {}

        # Collect only metrics that actually exist
        for i in range(1, 5):

            metric_name = row.get(f"Metric_Name{i}", None)

            if metric_name is None or pd.isna(metric_name):
                continue

            pred_col = f"Pred_Metric{i}"

            if pred_col not in row:
                continue

            value = row[pred_col]

            if pd.isna(value):
                continue

            metrics[metric_name] = float(value)

        protocol = row["protocol"]

        try:

            decision = classify_with_thresholds(
                metrics,
                protocol
            )

        except Exception as e:

            print(f"\nError on {row['id']}")
            print(metrics)
            print(e)

            decision = "ERROR"

        recovered.append(decision)

    df["RecoveredDecision"] = recovered

    df["Decision_Correct"] = (
        df["RecoveredDecision"] ==
        df["GT_Decision"]
    )

    return df

# ----------------------------------------------------------
# FIND MISSING QUESTIONS
# ----------------------------------------------------------

def find_missing_questions(
    questions,
    dataframe
):

    expected = {

        q["id"]

        for q in questions

    }

    observed = set(

        dataframe["id"]

    )

    missing = sorted(

        expected - observed

    )

    print("=" * 60)
    print("Missing Questions")
    print("=" * 60)

    if len(missing) == 0:

        print("None")

    else:

        print(missing)

    print()

    return missing

# ----------------------------------------------------------
# SHOW FAILURES
# ----------------------------------------------------------

def show_failures(df):

    failures = df[
        df["Decision_Correct"] == False
    ]

    print("=" * 60)
    print("Protocol Recovery Failures")
    print("=" * 60)

    if len(failures) == 0:

        print("None")

        return

    print(

        failures[

            [

                "id",

                "subcategory",

                "GT_Decision",

                "RecoveredDecision"

            ]

        ]

    )

    print()

# ----------------------------------------------------------
# METRIC STATISTICS
# ----------------------------------------------------------

def evaluate_metrics(df):

    print("=" * 60)
    print("Metric Accuracy")
    print("=" * 60)

    summary = []

    for i in range(1, 4):

        gt_col = f"GT_Metric{i}"
        pred_col = f"Pred_Metric{i}"

        if gt_col not in df.columns:
            continue

        temp = df[[gt_col, pred_col]].dropna()

        if len(temp) == 0:
            continue

        mae = mean_absolute_error(
            temp[gt_col],
            temp[pred_col]
        )

        rmse = np.sqrt(
            mean_squared_error(
                temp[gt_col],
                temp[pred_col]
            )
        )

        try:
            corr = pearsonr(
                temp[gt_col],
                temp[pred_col]
            )[0]
        except:
            corr = np.nan

        exact = (
            temp[gt_col].round(4)
            ==
            temp[pred_col].round(4)
        ).mean() * 100

        print(f"\nMetric {i}")
        print("-" * 40)
        print("Rows :", len(temp))
        print("MAE  :", round(mae, 6))
        print("RMSE :", round(rmse, 6))
        print("r    :", round(corr, 6))
        print("Exact:", round(exact, 2), "%")

        summary.append({

            "Metric": i,

            "Rows": len(temp),

            "MAE": mae,

            "RMSE": rmse,

            "Pearson_r": corr,

            "Exact_Match": exact

        })

    return pd.DataFrame(summary)

# ----------------------------------------------------------
# PROTOCOL ACCURACY
# ----------------------------------------------------------

def protocol_accuracy(df):

    accuracy = (

        df["RecoveredDecision"]

        ==

        df["GT_Decision"]

    ).mean() * 100

    print()

    print("=" * 60)

    print("Protocol Recovery")

    print("=" * 60)

    print(

        f"{accuracy:.2f}%"

    )

    print()

    return accuracy

# ----------------------------------------------------------
# DECISION CONFUSION
# ----------------------------------------------------------

def decision_table(df):

    table = pd.crosstab(

        df["GT_Decision"],

        df["RecoveredDecision"]

    )

    print("=" * 60)

    print("Decision Confusion Matrix")

    print("=" * 60)

    print(table)

    print()

    return table

# ----------------------------------------------------------
# SAVE RESULTS
# ----------------------------------------------------------

def save_results(

    model,

    df,

    metric_summary,

    confusion

):

    csv_file = os.path.join(

        RESULT_DIR,

        f"{model}_derivation.csv"

    )

    df.to_csv(

        csv_file,

        index=False

    )

    metric_file = os.path.join(

        RESULT_DIR,

        f"{model}_metric_summary.csv"

    )

    metric_summary.to_csv(

        metric_file,

        index=False

    )

    confusion_file = os.path.join(

        RESULT_DIR,

        f"{model}_confusion.csv"

    )

    confusion.to_csv(

        confusion_file

    )

    print("=" * 60)

    print("Saved Files")

    print("=" * 60)

    print(csv_file)

    print(metric_file)

    print(confusion_file)

    print()

# ----------------------------------------------------------
# PRINT SUMMARY
# ----------------------------------------------------------

def print_summary(

    model,

    metric_summary,

    protocol_acc,

    df

):

    print()

    print("=" * 70)

    print(model.upper())

    print("=" * 70)

    print()

    print(

        f"Questions Evaluated : {len(df)}"

    )

    print(

        f"Protocol Recovery   : {protocol_acc:.2f}%"

    )

    print()

    print(metric_summary)

    print()

    failures = (

        df["Decision_Correct"]

        ==

        False

    ).sum()

    print(

        "Protocol Failures :", failures

    )

    print()

# ----------------------------------------------------------
# MAIN
# ----------------------------------------------------------

def main():

    parser = argparse.ArgumentParser(

        description="ClimateTwinBench Derivation Evaluator"

    )

    parser.add_argument(

    "--model",

    required=True,

    choices=[

        "deepseek",
        "claude",
        "claude_opus",
        "gemini",
        "gpt",
        "gpt_oss_120b"

    ],

    help="Model to evaluate"

)

    args = parser.parse_args()

    model = args.model

    print()

    print("=" * 70)

    print("ClimateTwinBench Derivation Evaluation")

    print("=" * 70)

    print()

    print("Model :", model)

    print()

    # --------------------------------------------------

    questions = load_questions()

    text = load_raw_output(model)

    responses = parse_output(text)

    df = build_dataframe(
         questions,
         responses
)

    # --------------------------------------------------

    df = recover_protocol(df)

    # --------------------------------------------------

    metric_summary = evaluate_metrics(df)

    # --------------------------------------------------

    protocol_acc = protocol_accuracy(df)

    # --------------------------------------------------

    confusion = decision_table(df)

    # --------------------------------------------------

    find_missing_questions(

        questions,

        df

    )

    # --------------------------------------------------

    show_failures(df)

    # --------------------------------------------------

    print_summary(

        model,

        metric_summary,

        protocol_acc,

        df

    )

    # --------------------------------------------------

    save_results(

        model,

        df,

        metric_summary,

        confusion

    )

    print()

    print("=" * 70)

    print("Evaluation Complete")

    print("=" * 70)

    print()


# ----------------------------------------------------------

if __name__ == "__main__":

    main()