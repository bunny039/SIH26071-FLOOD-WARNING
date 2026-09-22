# PROJECT_MASTER.md

# ClimateTwinBench

**Master Project Document**

**Version:** Final Pre-Writing State

---

# READ THIS FIRST

This repository contains the complete research project for ClimateTwinBench.

Before writing anything:

1. Read this document completely.
2. Build an internal understanding of the scientific narrative.
3. Then explore the repository to locate evidence supporting every statement.
4. Never invent experiments.
5. Never invent numbers.
6. Never strengthen claims beyond what the experiments support.

This document describes the intended scientific story, current project status, completed experiments, reviewer criticisms, resolved issues, unresolved issues, and writing philosophy.

---

# Primary Goal

The purpose of this paper is **not** simply to introduce a benchmark.

The primary contribution is a **benchmark design methodology** called **Intermediate-Evidence Substitution (IES)** and its empirical validation.

ClimateTwinBench is the experimental instantiation used to validate IES.

The benchmark is therefore evidence supporting the methodology—not the contribution itself.

---

# Scientific Question

The paper asks one central question:

> When evaluating deterministic structured verification tasks, can benchmark evidence be designed so that numerical derivation—not shortcut lookup—is the primary remaining challenge?

This question motivates the entire paper.

---

# Core Hypothesis

Hypothesis:

If decisive aggregate statistics are removed from benchmark evidence while preserving labels, thresholds, and decision protocols, then:

* shortcut-based protocol execution becomes impossible,
* intermediate metric derivation becomes necessary,
* remaining model failures become attributable primarily to derivation rather than protocol execution.

This hypothesis is evaluated experimentally.

---

# Intermediate-Evidence Substitution (IES)

Formal definition:

Intermediate-Evidence Substitution (IES) is a benchmark design principle that replaces decisive aggregate statistics appearing in benchmark evidence with the raw intermediate values required to derive those statistics, while preserving:

* task labels
* protocols
* thresholds
* evaluation criteria

Only the observable evidence changes.

Ground truth remains identical.

IES therefore changes **what must be computed**, not **what is being evaluated**.

---

# Benchmark Structure

The benchmark contains six deterministic hypothesis verification categories.

Persistent Regional Anomaly

Localized Intensification

Wet Anomaly Consistency

Compound State Transition

Spatial Coherence

Reliability-aware Claim Verification

Each category evaluates a different numerical derivation primitive.

No category evaluates climate knowledge.

The benchmark evaluates structured numerical verification performed on climate observations.

---

# Benchmark Versions

## V1

Evidence contains decisive aggregate statistics.

Examples:

minimum anomaly

active cell count

mean anomaly

largest connected component

These values are already computed.

Some frontier models can answer directly using threshold comparison.

---

## V2

IES replaces decisive aggregates with intermediate observations.

Examples:

cell grids

binary masks

yearly observations

component masks

Models must derive the required statistics before protocol execution.

---

# What the Paper Is NOT Claiming

The paper does NOT claim:

* reasoning ability
* understanding
* intelligence
* climate expertise
* climate knowledge evaluation
* protocol execution is solved generally
* derivation is the only possible strategy

The paper reports only observable experimental behaviour.

---

# Experimental Pipeline

The repository contains multiple experiments.

These should be understood as one connected investigation.

Experiment 1

V1 benchmark evaluation.

Purpose:

Establish baseline performance.

---

Experiment 2

V2 benchmark evaluation.

Purpose:

Measure effect of IES.

---

Experiment 3

Transition analysis.

Purpose:

Question-level V1→V2 behaviour.

Includes:

C→C

C→W

W→C

W→W

McNemar statistics.

---

Experiment 4

Compound error taxonomy.

Purpose:

Mechanistic analysis of Compound failures.

---

Experiment 5

Derivation isolation experiment.

THIS IS THE PRIMARY EXPERIMENT.

Correct intermediate metrics are supplied directly.

Models perform only protocol execution.

Purpose:

Separate derivation from protocol execution.

This experiment validates IES.

---

Experiment 6

Cascade analysis.

Purpose:

Determine whether metric derivation errors propagate into protocol errors.

Findings:

Most derivation errors are absorbed.

---

Experiment 7

Category-level derivation analysis.

Purpose:

Determine which benchmark categories generate derivation failures.

---

# Final Isolation Results

Claude

Protocol Recovery

100%

Metric Accuracy

97.92%

---

Claude Opus

Protocol Recovery

100%

Metric Accuracy

98.75%

---

Gemini

Protocol Recovery

100%

Metric Accuracy

100%

---

DeepSeek

Protocol Recovery

99.58%

Metric Accuracy

92.92%

17 metric derivation errors

16 absorbed

1 propagated

Only propagated failure:

HYP-186

Spatial Coherence

---

GPT-OSS-120B

Protocol Recovery

42.92%

Metric Accuracy

4.17%

Provides lower-performing comparison baseline.

---

# Main Scientific Finding

Supplying correct intermediate metrics restores protocol execution to near-perfect accuracy for frontier models.

Therefore:

Protocol execution is not the dominant bottleneck on ClimateTwinBench.

Numerical derivation is.

This conclusion is experimentally supported.

---

# DeepSeek Cascade Analysis

Earlier analyses identified three propagated failures.

Parser improvements corrected this.

Final verified result:

17 metric derivation errors

16 absorbed

1 propagated

Absorption rate:

94.12%

This validates the benchmark's boundary-tie rejection procedure.

---

# ChatGPT

ChatGPT is treated separately.

ChatGPT improves substantially from V1 to V2.

This does NOT fit the derivation-bottleneck narrative established for Claude and DeepSeek.

The current data cannot distinguish among:

1. V1 evidence ambiguity

2. Explicit derivation scaffolding

3. Interaction of both

The mechanism remains unknown.

Treat this as an open question.

Do not speculate beyond the evidence.

---

# Reviewer Criticisms Already Addressed

✓ Cascade analysis

✓ Transition analysis

✓ McNemar

✓ Compound taxonomy

✓ Per-category derivation accuracy

✓ Isolation experiment

✓ DeepSeek paradox

✓ Mechanistic scoping

✓ ChatGPT discussion

✓ ChatGPT limitation

✓ Reviewer concerns about heterogeneous MAE

✓ Claude Opus evaluation

✓ Gemini evaluation

✓ GPT-OSS evaluation

---

# Remaining Limitations

The paper explicitly acknowledges:

* ChatGPT anomaly remains unresolved.

* IES removes decisive aggregate shortcuts but cannot prove no alternative shortcuts exist.

* Isolation experiments cover Claude, Claude Opus, Gemini and DeepSeek only.

* Results are specific to ClimateTwinBench protocols.

* Climate knowledge itself is deliberately outside the evaluation scope.

---

# Writing Philosophy

Assume Reviewer #2 is reading every sentence.

For every claim ask:

"What evidence supports this?"

If no experiment supports the statement:

weaken it.

Do not strengthen it.

---

# Language Rules

Never write:

"models reason"

"models understand"

"models think"

"LLMs know"

Describe behaviour only.

Examples:

"achieved"

"predicted"

"derived"

"executed"

"produced"

---

# Paper Structure

Introduction

Related Work

ClimateTwinBench

Intermediate-Evidence Substitution

Experimental Design

Results

Analysis

Discussion

Limitations

Conclusion

Appendix

---

# Your Role

You are not a copy editor.

You are not a paraphraser.

You are acting as a senior ACL/EMNLP/ClimateNLP coauthor.

Your responsibilities are:

* identify logical gaps

* ensure scientific precision

* maintain internal consistency

* challenge unsupported claims

* improve reviewer defensibility

If repository contents disagree with previous drafts, trust the repository.

If evidence is missing, state that it is missing rather than inferring an answer.

The final manuscript should be one that could withstand scrutiny from skeptical ACL/EMNLP/ClimateNLP reviewers.
