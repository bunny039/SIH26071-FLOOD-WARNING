"""
===========================================================
ClimateTwinBench Paper Analysis
===========================================================

Generates:

Tables
------
table1_protocol_recovery.csv
table2_category_recovery.csv
table3_metric_summary.csv
table4_failure_cases.csv

Figures
-------
figure1_category_recovery.pdf
figure2_metric_accuracy.pdf
figure3_metric_scatter.pdf

Summary
-------
paper_summary.txt

Author:
Aaditya Thokal

===========================================================
"""

from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

plt.rcParams.update({

    "font.size":12,

    "axes.labelsize":13,

    "axes.titlesize":13,

    "xtick.labelsize":11,

    "ytick.labelsize":11,

    "legend.fontsize":11

})

# ===========================================================
# Locate Project Automatically
# ===========================================================

PROJECT = Path.cwd()

while PROJECT.name != "ClimateTwinIndia":

    PROJECT = PROJECT.parent

DERIVATION_RESULTS = (

    PROJECT

    / "experiments"

    / "experiment_05_derivation"

    / "results"

)

OUTPUT = PROJECT/"paper_analysis"

FIGURES = OUTPUT/"figures"

TABLES = OUTPUT/"tables"

FIGURES.mkdir(

    parents=True,

    exist_ok=True

)

TABLES.mkdir(

    parents=True,

    exist_ok=True

)

print("="*60)
print("ClimateTwinBench Paper Analysis")
print("="*60)

print()

print("Project Folder")

print(PROJECT)

print()

print("Reading Results From")

print(DERIVATION_RESULTS)

print()

# ===========================================================
# Load CSVs
# ===========================================================

claude = pd.read_csv(

    DERIVATION_RESULTS/

    "claude_derivation.csv"

)

deepseek = pd.read_csv(

    DERIVATION_RESULTS/

    "deepseek_derivation.csv"

)

gpt = pd.read_csv(

    DERIVATION_RESULTS/

    "gpt_derivation.csv"

)

claude_summary = pd.read_csv(

    DERIVATION_RESULTS/

    "claude_metric_summary.csv"

)

deepseek_summary = pd.read_csv(

    DERIVATION_RESULTS/

    "deepseek_metric_summary.csv"

)

gpt_summary = pd.read_csv(

    DERIVATION_RESULTS/

    "gpt_metric_summary.csv"

)

print("Loaded CSVs")

print()

print("Claude :",claude.shape)

print("DeepSeek :",deepseek.shape)

print("GPT :",gpt.shape)

print()

# ===========================================================
# Helper Functions
# ===========================================================

def protocol_accuracy(df):

    return (

        df["RecoveredDecision"]

        ==

        df["GT_Decision"]

    ).mean()*100


def category_accuracy(df):

    return (

        df

        .groupby(

            "subcategory"

        )

        .apply(

            lambda x:

            (

                x["RecoveredDecision"]

                ==

                x["GT_Decision"]

            ).mean()*100,

            include_groups=False

        )

        .reset_index(

            name="Accuracy"

        )

    )


def failures(df):

    return df[

        df["Decision_Correct"]==False

    ].copy()


# ===========================================================
# Build Overall Table
# ===========================================================

overall = pd.DataFrame({

    "Model":[

        "Claude",

        "DeepSeek",

        "GPT"

    ],

    "Protocol Recovery":[

        protocol_accuracy(claude),

        protocol_accuracy(deepseek),

        protocol_accuracy(gpt)

    ]

})

overall.to_csv(

    TABLES/

    "table1_protocol_recovery.csv",

    index=False

)

print()

print("Overall Recovery")

print(overall)

print()

# ===========================================================
# END OF PART 1
# ===========================================================
# ===========================================================
# Category Accuracy Table
# ===========================================================

claude_cat = category_accuracy(claude)

deepseek_cat = category_accuracy(deepseek)

gpt_cat = category_accuracy(gpt)

category_table = (

    claude_cat

    .merge(

        deepseek_cat,

        on="subcategory",

        suffixes=(

            "_Claude",

            "_DeepSeek"

        )

    )

    .merge(

        gpt_cat,

        on="subcategory"

    )

)

category_table.rename(

    columns={

        "Accuracy":"Accuracy_GPT"

    },

    inplace=True

)

category_table.to_csv(

    TABLES/

    "table2_category_recovery.csv",

    index=False

)

print("="*60)

print("Category Recovery")

print("="*60)

print(category_table)

print()

# ===========================================================
# Metric Summary Table
# ===========================================================

claude_summary["Model"] = "Claude"

deepseek_summary["Model"] = "DeepSeek"

gpt_summary["Model"] = "GPT"

metric_table = pd.concat(

    [

        claude_summary,

        deepseek_summary,

        gpt_summary

    ],

    ignore_index=True

)

metric_table = metric_table[

    [

        "Model",

        "Metric",

        "Rows",

        "MAE",

        "RMSE",

        "Pearson_r",

        "Exact_Match"

    ]

]

metric_table.to_csv(

    TABLES/

    "table3_metric_summary.csv",

    index=False

)

print("="*60)

print("Metric Summary")

print("="*60)

print(metric_table)

print()

# ===========================================================
# Failure Analysis
# ===========================================================

deepseek_failures = failures(deepseek)

failure_table = deepseek_failures[

    [

        "id",

        "subcategory",

        "GT_Decision",

        "RecoveredDecision"

    ]

].copy()

failure_table["Failure_Type"] = ""

failure_table["Root_Cause"] = ""

for idx, row in failure_table.iterrows():

    if row["subcategory"] == "spatial_coherence_verification":

        failure_table.loc[idx, "Failure_Type"] = "Spatial"

        failure_table.loc[idx, "Root_Cause"] = (

            "Connected-component counting"

        )

    elif row["subcategory"] == "reliability_aware_claim_verification":

        failure_table.loc[idx, "Failure_Type"] = "Numerical"

        failure_table.loc[idx, "Root_Cause"] = (

            "Mean anomaly derivation"

        )

    else:

        failure_table.loc[idx, "Failure_Type"] = "Unknown"

        failure_table.loc[idx, "Root_Cause"] = "Unknown"

failure_table.to_csv(

    TABLES/

    "table4_failure_cases.csv",

    index=False

)

print("="*60)

print("Failure Analysis")

print("="*60)

print(failure_table)

print()

# ===========================================================
# Build Paper Summary
# ===========================================================

summary = []

summary.append(

    "ClimateTwinBench Derivation Evaluation"

)

summary.append("="*50)

summary.append("")

summary.append("Protocol Recovery")

summary.append("---------------------------")

for _, row in overall.iterrows():

    summary.append(

        f"{row['Model']}: "

        f"{row['Protocol Recovery']:.2f}%"

    )

summary.append("")

summary.append("Category Recovery")

summary.append("---------------------------")

for _, row in category_table.iterrows():

    summary.append(

        f"{row['subcategory']}"

    )

    summary.append(

        f"  Claude   : "

        f"{row['Accuracy_Claude']:.2f}%"

    )

    summary.append(

        f"  DeepSeek : "

        f"{row['Accuracy_DeepSeek']:.2f}%"

    )

    summary.append(

        f"  GPT      : "

        f"{row['Accuracy_GPT']:.2f}%"

    )

    summary.append("")

summary.append("")

summary.append("DeepSeek Failure Analysis")

summary.append("---------------------------")

for _, row in failure_table.iterrows():

    summary.append(

        f"{row['id']}"

    )

    summary.append(

        f"Category : "

        f"{row['subcategory']}"

    )

    summary.append(

        f"Failure  : "

        f"{row['Failure_Type']}"

    )

    summary.append(

        f"Cause    : "

        f"{row['Root_Cause']}"

    )

    summary.append("")

summary_file = OUTPUT / "paper_summary.txt"

with open(

    summary_file,

    "w",

    encoding="utf-8"

) as f:

    f.write(

        "\n".join(summary)

    )

print("="*60)

print("Paper Summary Written")

print("="*60)

print(summary_file)

print()

# ===========================================================
# END OF PART 2
# ===========================================================
# ===========================================================
# FIGURE 1
# Category Recovery
# ===========================================================

print("="*60)
print("Generating Figure 1")
print("="*60)

labels = [

    "Persistent\nRegional",

    "Localized\nIntensification",

    "Wet\nConsistency",

    "Spatial\nCoherence",

    "Reliability\nAware",

    "Compound\nTransition"

]

claude_scores = category_table["Accuracy_Claude"].values
deepseek_scores = category_table["Accuracy_DeepSeek"].values

x = np.arange(len(labels))
width = 0.35

fig, ax = plt.subplots(figsize=(12,5))

claude_bars = ax.bar(

    x-width/2,

    claude_scores,

    width,

    label="Claude"

)

deepseek_bars = ax.bar(

    x+width/2,

    deepseek_scores,

    width,

    label="DeepSeek"

)

for bar in deepseek_bars:

    h = bar.get_height()

    if h < 99.99:

        ax.text(

            bar.get_x()+bar.get_width()/2,

            h+1.5,

            f"{h:.1f}",

            ha="center",

            va="bottom",

            fontsize=10,

            fontweight="bold"

        )

ax.set_ylabel("Protocol Recovery (%)")

ax.set_ylim(0,102)

ax.set_xticks(x)

ax.set_xticklabels(labels)

ax.set_yticks(np.arange(0,101,20))

ax.grid(False)

ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

ax.legend(

    frameon=False,

    loc="upper left",

    bbox_to_anchor=(1.01,1)

)

plt.tight_layout()

plt.savefig(

    FIGURES/

    "figure1_category_recovery.pdf",

    bbox_inches="tight"

)

plt.savefig(

    FIGURES/

    "figure1_category_recovery.png",

    dpi=300,

    bbox_inches="tight"

)

plt.close()

print("Saved Figure 1")

# ===========================================================
# FIGURE 2
# Exact Match Accuracy
# ===========================================================

print("="*60)
print("Generating Figure 2")
print("="*60)

metric_names = [

    "Metric 1",

    "Metric 2",

    "Metric 3"

]

claude_exact = claude_summary["Exact_Match"].values

deepseek_exact = deepseek_summary["Exact_Match"].values

gpt_exact = gpt_summary["Exact_Match"].values

x = np.arange(len(metric_names))

width = 0.25

fig, ax = plt.subplots(figsize=(9,5))

ax.bar(

    x-width,

    claude_exact,

    width,

    label="Claude"

)

ax.bar(

    x,

    deepseek_exact,

    width,

    label="DeepSeek"

)

ax.bar(

    x+width,

    gpt_exact,

    width,

    label="GPT"

)

ax.set_xticks(x)

ax.set_xticklabels(metric_names)

ax.set_ylabel("Exact Match (%)")

ax.set_ylim(0,105)

ax.grid(False)

ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

ax.legend(frameon=False)

plt.tight_layout()

plt.savefig(

    FIGURES/

    "figure2_exact_match.pdf",

    bbox_inches="tight"

)

plt.savefig(

    FIGURES/

    "figure2_exact_match.png",

    dpi=300,

    bbox_inches="tight"

)

plt.close()

print("Saved Figure 2")

# ===========================================================
# FIGURE 3
# MAE Comparison
# ===========================================================

print("="*60)
print("Generating Figure 3")
print("="*60)

claude_mae = claude_summary["MAE"].values

deepseek_mae = deepseek_summary["MAE"].values

gpt_mae = gpt_summary["MAE"].values

x = np.arange(len(metric_names))

width = 0.25

fig, ax = plt.subplots(figsize=(9,5))

ax.bar(

    x-width,

    claude_mae,

    width,

    label="Claude"

)

ax.bar(

    x,

    deepseek_mae,

    width,

    label="DeepSeek"

)

ax.bar(

    x+width,

    gpt_mae,

    width,

    label="GPT"

)

ax.set_xticks(x)

ax.set_xticklabels(metric_names)

ax.set_ylabel("Mean Absolute Error")

ax.grid(False)

ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

ax.legend(frameon=False)

plt.tight_layout()

plt.savefig(

    FIGURES/

    "figure3_mae.pdf",

    bbox_inches="tight"

)

plt.savefig(

    FIGURES/

    "figure3_mae.png",

    dpi=300,

    bbox_inches="tight"

)

plt.close()

print("Saved Figure 3")

print()
print("="*60)
print("All Figures Generated")
print("="*60)
print()

# ===========================================================
# FIGURE 4
# Ground Truth vs Predicted Scatter
# ===========================================================

print("="*60)
print("Generating Figure 4")
print("="*60)

metric_labels = [
    ("GT_Metric1", "Pred_Metric1", "Metric 1"),
    ("GT_Metric2", "Pred_Metric2", "Metric 2"),
    ("GT_Metric3", "Pred_Metric3", "Metric 3"),
]

models = [
    ("Claude", claude),
    ("DeepSeek", deepseek),
    ("GPT", gpt)
]

for model_name, df in models:

    fig, axes = plt.subplots(1, 3, figsize=(15,5))

    for ax, (gt, pred, title) in zip(axes, metric_labels):

        if gt not in df.columns or pred not in df.columns:
            ax.axis("off")
            continue

        temp = df[[gt, pred]].dropna()

        if len(temp) == 0:
            ax.axis("off")
            continue

        ax.scatter(
            temp[gt],
            temp[pred],
            alpha=0.7,
            s=20
        )

        mn = min(temp[gt].min(), temp[pred].min())
        mx = max(temp[gt].max(), temp[pred].max())

        ax.plot(
            [mn, mx],
            [mn, mx],
            linestyle="--",
            linewidth=1
        )

        ax.set_title(title)
        ax.set_xlabel("Ground Truth")
        ax.set_ylabel("Prediction")

        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)

    plt.suptitle(model_name)

    plt.tight_layout()

    plt.savefig(
        FIGURES/f"figure4_scatter_{model_name.lower()}.pdf",
        bbox_inches="tight"
    )

    plt.savefig(
        FIGURES/f"figure4_scatter_{model_name.lower()}.png",
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

print("Saved Figure 4")

# ===========================================================
# FIGURE 5
# Benchmark Pipeline Diagram
# ===========================================================

print("="*60)
print("Generating Figure 5")
print("="*60)

fig, ax = plt.subplots(figsize=(13,3))

ax.axis("off")

boxes = [

    ("Raw Climate\nGrid",0.08),

    ("Metric\nDerivation",0.30),

    ("Deterministic\nProtocol",0.55),

    ("Decision",0.82)

]

for text,x in boxes:

    ax.text(

        x,

        0.5,

        text,

        ha="center",

        va="center",

        fontsize=13,

        bbox=dict(

            boxstyle="round",

            pad=0.5

        )

    )

for i in range(len(boxes)-1):

    x1=boxes[i][1]+0.07
    x2=boxes[i+1][1]-0.07

    ax.annotate(

        "",

        xy=(x2,0.5),

        xytext=(x1,0.5),

        arrowprops=dict(

            arrowstyle="->",

            lw=2

        )

    )

plt.tight_layout()

plt.savefig(
    FIGURES/"figure5_pipeline.pdf",
    bbox_inches="tight"
)

plt.savefig(
    FIGURES/"figure5_pipeline.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

print("Saved Figure 5")

# ===========================================================
# FINAL SUMMARY
# ===========================================================

print()
print("="*70)
print("ClimateTwinBench Paper Analysis Complete")
print("="*70)

print()

print("Tables")

for f in sorted(TABLES.glob("*.csv")):
    print("  ",f.name)

print()

print("Figures")

for f in sorted(FIGURES.glob("*.pdf")):
    print("  ",f.name)

print()

print("Summary")

print("  paper_summary.txt")

print()

print("="*70)
print("Finished Successfully")
print("="*70)

# ===========================================================
# MAIN
# ===========================================================

if __name__ == "__main__":
    pass