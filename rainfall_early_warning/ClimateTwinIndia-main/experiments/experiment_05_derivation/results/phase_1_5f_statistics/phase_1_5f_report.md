# ClimateTwin Phase 1.5F — Statistical Analysis

## Frozen design

- Observations: **245** model/question pairs with observed metric error.
- Primary intervention: threshold contraction toward canonical GT metric.
- Directional control: equal-magnitude threshold displacement away from canonical GT metric.
- Alpha grid: `[0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]`.
- Alpha=1.0 is excluded because it changes the canonical GT decision at the equality boundary.
- Canonical GT decisions changed through alpha=.99: **0** in both primary and control.
- No model/API inference is performed by this analysis.

## Primary endpoint

Baseline propagation: **56.3265%**

Toward-GT propagation at alpha=.99: **68.9796%**

Paired risk difference: **12.65 percentage points**

95% bootstrap CI: **[4.49, 20.41] pp**

Exact two-sided McNemar p-value: **0.00265379**

Discordant pairs: absorbed→propagated = **66**; propagated→absorbed = **35**.

## Directional control

Away-GT propagation at alpha=.99: **41.2245%**

Toward-GT propagation at alpha=.99: **68.9796%**

Toward-minus-away difference: **27.76 percentage points**

95% bootstrap CI: **[20.00, 35.51] pp**

Exact two-sided McNemar p-value: **3.76518e-11**

Discordant pairs (away→toward): away propagated→toward absorbed = **21**; away absorbed→toward propagated = **89**.

## Interpretation boundary

The inferential claims supported by this artifact are about **directional sensitivity of the deterministic decision outcome under controlled threshold displacement**. They do not by themselves establish that the intervention is representative of all possible protocol changes or that the threshold movement is causal in a broader deployment setting.

## Secondary analyses

Category-level effects are in `phase_1_5f_category_effects.csv`; six directional category p-values are Holm-adjusted in `directional_mcnemar_p_holm`.

The alpha-response curve is in `phase_1_5f_alpha_curve.csv`. Per-observation Spearman association with alpha is a descriptive secondary measure only.

Model-level endpoint summaries are in `phase_1_5f_model_effects.csv`.

## Reproducibility

Bootstrap resamples: **10000**

Bootstrap seed: **20260626**

All source files are the already-generated primary and control CSVs; no new model inference is required.
