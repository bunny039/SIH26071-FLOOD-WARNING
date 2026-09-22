from pathlib import Path
import pandas as pd
import numpy as np

RESULTS = Path("results")

MODELS = {
    "Claude": "claude",
    "Claude Opus": "claude_opus",
    "DeepSeek": "deepseek",
    "Gemini": "gemini",
    "GPT": "gpt"
}

out = []

out.append("="*90)
out.append("CLIMATETWINBENCH - MASTER PAPER STATISTICS")
out.append("="*90)
out.append("")

###############################################################
# Helper
###############################################################

def metric_correct(df):

    m1 = np.isclose(df["GT_Metric1"], df["Pred_Metric1"], atol=1e-4)

    m2 = np.isclose(df["GT_Metric2"], df["Pred_Metric2"], atol=1e-4)

    if "GT_Metric3" in df.columns:

        m3 = (
            df["GT_Metric3"].isna()
            |
            np.isclose(
                df["GT_Metric3"],
                df["Pred_Metric3"],
                atol=1e-4
            )
        )

    else:
        m3 = True

    return m1 & m2 & m3


###############################################################
# Overall model summaries
###############################################################

master = []

for nice_name, model in MODELS.items():

    file = RESULTS / f"{model}_derivation.csv"

    if not file.exists():
        continue

    df = pd.read_csv(file)

    metric = metric_correct(df)

    decision = df["Decision_Correct"]

    total = len(df)

    metric_errors = (~metric).sum()

    absorbed = ((~metric) & decision).sum()

    propagated = ((~metric) & (~decision)).sum()

    protocol = decision.mean()*100

    metric_acc = metric.mean()*100

    absorb_rate = (
        absorbed/metric_errors*100
        if metric_errors else 0
    )

    prop_rate = (
        propagated/metric_errors*100
        if metric_errors else 0
    )

    master.append({
        "Model": nice_name,
        "Questions": total,
        "Protocol Recovery": protocol,
        "Metric Accuracy": metric_acc,
        "Metric Errors": metric_errors,
        "Absorbed": absorbed,
        "Propagated": propagated,
        "Absorption Rate": absorb_rate,
        "Propagation Rate": prop_rate
    })

master_df = pd.DataFrame(master)

out.append("OVERALL MODEL PERFORMANCE")
out.append("-"*90)
out.append(master_df.to_string(index=False))
out.append("")
out.append("")

###############################################################
# Per-category summaries
###############################################################

out.append("="*90)
out.append("PER-CATEGORY SUMMARY")
out.append("="*90)
out.append("")

for nice_name, model in MODELS.items():

    file = RESULTS / f"{model}_derivation.csv"

    if not file.exists():
        continue

    df = pd.read_csv(file)

    metric = metric_correct(df)

    df["MetricCorrect"] = metric

    out.append(f"\n{nice_name}")
    out.append("-"*50)

    summary = []

    for cat, g in df.groupby("subcategory"):

        mc = g["MetricCorrect"]

        dc = g["Decision_Correct"]

        metric_errors = (~mc).sum()

        absorbed = ((~mc) & dc).sum()

        propagated = ((~mc) & (~dc)).sum()

        summary.append({

            "Category":cat,

            "Questions":len(g),

            "MetricAcc":round(mc.mean()*100,2),

            "DecisionAcc":round(dc.mean()*100,2),

            "MetricErrors":metric_errors,

            "Absorbed":absorbed,

            "Propagated":propagated

        })

    out.append(
        pd.DataFrame(summary).to_string(index=False)
    )
    out.append("")

###############################################################
# Propagated failures
###############################################################

out.append("="*90)
out.append("PROPAGATED FAILURES")
out.append("="*90)
out.append("")

for nice_name, model in MODELS.items():

    file = RESULTS / f"{model}_derivation.csv"

    if not file.exists():
        continue

    df = pd.read_csv(file)

    metric = metric_correct(df)

    fail = df[(~metric) & (~df["Decision_Correct"])]

    out.append(f"\n{nice_name}")

    if len(fail)==0:

        out.append("None\n")
        continue

    cols=[
        "id",
        "subcategory",
        "GT_Decision",
        "RecoveredDecision",
        "GT_Metric1",
        "Pred_Metric1",
        "GT_Metric2",
        "Pred_Metric2",
        "GT_Metric3",
        "Pred_Metric3"
    ]

    out.append(
        fail[cols].to_string(index=False)
    )
    out.append("")

###############################################################
# Benchmark totals
###############################################################

out.append("="*90)
out.append("BENCHMARK TOTALS")
out.append("="*90)
out.append("")

example = pd.read_csv(
    RESULTS/"claude_derivation.csv"
)

out.append(f"Questions                  : {len(example)}")
out.append(f"Categories                 : {example.subcategory.nunique()}")

out.append(
    f"Persistent                 : {(example.subcategory=='persistent_regional_anomaly_verification').sum()}"
)

out.append(
    f"Localized                  : {(example.subcategory=='localized_intensification_verification').sum()}"
)

out.append(
    f"Wet                        : {(example.subcategory=='wet_anomaly_consistency_verification').sum()}"
)

out.append(
    f"Compound                   : {(example.subcategory=='compound_state_transition_verification').sum()}"
)

out.append(
    f"Spatial                    : {(example.subcategory=='spatial_coherence_verification').sum()}"
)

out.append(
    f"Reliability                : {(example.subcategory=='reliability_aware_claim_verification').sum()}"
)

out.append("")

###############################################################
# Save
###############################################################

outfile = RESULTS/"paper_numbers.txt"

with open(outfile,"w",encoding="utf8") as f:

    f.write("\n".join(out))

print("="*80)
print("Saved")
print(outfile)
print("="*80)