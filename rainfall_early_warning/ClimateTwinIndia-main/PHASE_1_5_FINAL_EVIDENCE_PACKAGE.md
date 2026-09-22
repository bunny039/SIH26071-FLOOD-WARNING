# ClimateTwin Phase 1.5 --- Final Evidence Package

## Status

**Phase 1.5 is FROZEN.**

The Phase 1.5 evidence chain consists of the decision-margin sensitivity
analysis (1.5D), matched directional control (1.5E), statistical
analysis (1.5F), mixed-effects robustness analysis (1.5G), and final
audit/remediation (1.5H).

No further modifications should be made to the frozen Phase 1.5
scientific artifacts. Any genuinely new scientific question must be
opened as a new numbered phase.

------------------------------------------------------------------------

## 1. Research question

Phase 1.5 evaluates whether deterministic benchmark decisions are
sensitive to controlled displacement of the decision threshold toward
versus away from the canonical ground-truth metric.

The analysis is an offline evaluation of already-generated benchmark and
model-evaluation artifacts. No new model/API inference is required.

------------------------------------------------------------------------

## 2. Frozen design

### Primary intervention

For threshold `T`, canonical ground-truth metric `GT_metric`, and
perturbation parameter `alpha`:

`T'(alpha) = T + alpha * (GT_metric - T)`

The canonical decision function is reused.

Frozen alpha grid:

`[0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99]`

The inferential endpoint is alpha = 0.99.

Alpha = 1.0 is outside the frozen grid and is not an inferential
endpoint.

### Directional control

The matched control displaces the threshold away from the canonical
ground-truth metric by the same alpha schedule.

This tests whether the observed result is merely a generic consequence
of threshold perturbation rather than directional alignment with the
canonical metric.

### Analysis population

The primary endpoint contains **245 model/question observations with an
observed metric error**.

The population is strongly concentrated in the canonical `gpt`-labelled
subset:

-   `gpt`: 230
-   `deepseek`: 14
-   `claude`: 1

Therefore the results must not be described as balanced five-model
replication.

------------------------------------------------------------------------

## 3. Phase 1.5D --- Decision-margin sensitivity

Baseline propagation:

**56.3265%**

Toward-GT propagation at alpha = 0.99:

**68.9796%**

Paired difference:

**+12.6531 percentage points**

Canonical ground-truth decisions changed anywhere in the frozen range
alpha \<= 0.99:

**0**

Primary paired discordances:

-   absorbed -\> propagated: **66**
-   propagated -\> absorbed: **35**

------------------------------------------------------------------------

## 4. Phase 1.5E --- Directional control

Away-GT propagation at alpha = 0.99:

**41.2245%**

Toward-GT propagation at alpha = 0.99:

**68.9796%**

Toward-minus-away difference:

**+27.7551 percentage points**

Directional paired discordances:

-   away propagated -\> toward absorbed: **21**
-   away absorbed -\> toward propagated: **89**

The matched control moves in the opposite direction from the primary
toward-GT intervention.

------------------------------------------------------------------------

## 5. Phase 1.5F --- Statistical inference

### Primary endpoint

Baseline -\> toward-GT alpha = 0.99:

-   N = **245**
-   Baseline = **56.3265%**
-   Toward = **68.9796%**
-   Paired difference = **+12.6531 pp**
-   95% bootstrap CI = **\[+4.49, +20.41\] pp**
-   Exact two-sided McNemar p = **0.0026537861**

Bootstrap configuration:

-   resamples = **10,000**
-   seed = **20260626**

### Directional endpoint

Away-GT alpha = 0.99 -\> toward-GT alpha = 0.99:

-   N = **245**
-   Away = **41.2245%**
-   Toward = **68.9796%**
-   Difference = **+27.7551 pp**
-   95% bootstrap CI = **\[+20.00, +35.51\] pp**
-   Exact two-sided McNemar p = **3.7651773e-11**

The McNemar analyses remain the primary inferential analyses.

------------------------------------------------------------------------

## 6. Phase 1.5G --- Mixed-effects robustness

A binomial generalized linear mixed model with a question-level random
intercept was used as a secondary robustness analysis.

The mixed-effects analysis does **not** replace the frozen McNemar
endpoint.

### Baseline -\> toward

-   N pairs = **245**
-   Odds ratio = **1.838698**
-   Approximate 95% credible interval under mean-field VB =
    **\[1.384961, 2.441086\]**
-   Posterior P(beta \> 0) = **0.999987**
-   Question random-intercept SD = **0.736829**

### Away -\> toward

-   N pairs = **245**
-   Odds ratio = **3.843138**
-   Approximate 95% credible interval under mean-field VB =
    **\[2.877542, 5.132751\]**
-   Posterior P(beta \> 0) = **1.000000**
-   Question random-intercept SD = **0.910654**

The terminology "credible interval" is intentional: these are
approximate mean-field variational-Bayes intervals, not frequentist
confidence intervals.

The Phase 1.5H remediation also records the VB warning state rather than
silently suppressing it.

------------------------------------------------------------------------

## 7. Phase 1.5G model-concentration sensitivity

The canonical `gpt`-labelled subset contains 230 of the 245 metric-error
observations.

Existing sensitivity checks report:

### Canonical `gpt`-labelled subset

Primary paired McNemar:

**p = 0.012400603**

Directional paired McNemar:

**p = 1.015826e-10**

These are model-concentration sensitivity checks. They are not evidence
of balanced replication across all evaluated models.

------------------------------------------------------------------------

## 8. Alpha = 1.0 boundary

Alpha = 1.0 is intentionally excluded from the frozen sensitivity grid.

The reproducible statement supported by the frozen artifacts is:

> Canonical ground-truth decisions remained unchanged throughout the
> tested perturbation range alpha \<= 0.99.

The previously circulated **222/245** alpha=1.0
canonical-decision-change figure is not independently reconstructible
from the frozen question-level sensitivity CSV alone and **must not be
presented as a verified Phase 1.5 result**.

Alpha = 1.0 is therefore treated only as an equality-boundary
diagnostic, outside the frozen inferential endpoint.

------------------------------------------------------------------------

## 9. What the evidence supports

The frozen evidence supports claims about:

-   deterministic decision sensitivity;
-   controlled threshold displacement;
-   directional contrast between toward-GT and away-GT perturbations;
-   paired statistical association between the intervention and
    deterministic decision outcomes;
-   robustness of the endpoint to question-level clustering.

------------------------------------------------------------------------

## 10. What the evidence does not establish

Phase 1.5 does **not** by itself establish:

-   a causal deployment effect;
-   generalization to arbitrary threshold changes;
-   generalization to unseen benchmark protocols;
-   balanced robustness across all evaluated models;
-   superiority in real-world deployment;
-   that the threshold intervention represents every possible protocol
    modification.

The error-conditioned population is also strongly concentrated in the
canonical `gpt`-labelled subset, so claims of balanced cross-model
replication would exceed the evidence.

------------------------------------------------------------------------

## 11. Reproducibility boundary

Phase 1.5D-G consumes existing artifacts and does not require new
model/API inference.

Primary inputs include:

`benchmark/ClimateTwinBench_Hypothesis_V2.json`

`experiments/experiment_05_derivation/results/*_derivation.csv`

`experiments/experiment_05_derivation/results/margin_sensitivity/`

`experiments/experiment_05_derivation/results/margin_sensitivity_control/`

Frozen Phase 1.5 statistical outputs are under:

`experiments/experiment_05_derivation/results/phase_1_5f_statistics/`

Mixed-effects robustness outputs are under:

`experiments/experiment_05_derivation/results/phase_1_5g_mixed_effects/`

The alpha=1.0 diagnostic outputs are under:

`experiments/experiment_05_derivation/results/phase_1_5_alpha1_diagnostic/`

------------------------------------------------------------------------

## 12. Frozen artifact map

### Phase 1.5D

`results/margin_sensitivity/`

-   `question_level_sensitivity.csv`
-   `aggregate_sensitivity_overall.csv`
-   `aggregate_sensitivity_by_model.csv`
-   `aggregate_sensitivity_by_category.csv`
-   `margin_sensitivity_metadata.json`

### Phase 1.5E

`results/margin_sensitivity_control/`

-   `question_level_control.csv`
-   `aggregate_control_overall.csv`
-   `aggregate_control_by_model.csv`
-   `aggregate_control_by_category.csv`
-   `margin_sensitivity_control_metadata.json`

### Phase 1.5F

`results/phase_1_5f_statistics/`

-   `phase_1_5f_alpha_curve.csv`
-   `phase_1_5f_category_effects.csv`
-   `phase_1_5f_directional_effect.csv`
-   `phase_1_5f_model_effects.csv`
-   `phase_1_5f_primary_effect.csv`
-   `phase_1_5f_report.md`
-   `phase_1_5f_statistics.json`

### Phase 1.5G

`results/phase_1_5g_mixed_effects/`

-   `phase_1_5g_mixed_effects_summary.csv`
-   `phase_1_5g_gpt_sensitivity.csv`
-   `phase_1_5g_primary_model_data.csv`
-   `phase_1_5g_directional_model_data.csv`
-   `phase_1_5g_report.md`
-   `phase_1_5g_metadata.json`

### Alpha=1 diagnostic

`results/phase_1_5_alpha1_diagnostic/`

-   `phase_1_5_alpha1_diagnostic.csv`
-   `phase_1_5_alpha1_diagnostic.json`
-   `phase_1_5_alpha1_diagnostic.md`

------------------------------------------------------------------------

## 13. Audit and remediation

Phase 1.5H addressed the robustness-analysis and documentation issues
identified during final review.

The remediation:

-   made Phase 1.5G VB fitting reproducible with the frozen seed;
-   records the VB warning state;
-   records fit diagnostics without fabricating an optimizer gradient;
-   preserves the existing mixed-effects model structure;
-   corrects interval terminology;
-   narrows the `gpt`-labelled-subset language;
-   preserves the alpha=1.0 boundary limitation;
-   leaves the frozen D/E/F scientific artifacts untouched.

The remediation was committed and pushed as:

`62c9984 Remediate Phase 1.5G robustness diagnostics`

The local `main` branch and `origin/main` were verified aligned at this
commit.

------------------------------------------------------------------------

## 14. Recommended paper-level headline

A defensible concise formulation is:

> Among 245 model/question observations with an observed metric error,
> controlled contraction of the decision threshold toward the canonical
> ground-truth metric increased deterministic propagation from 56.33% to
> 68.98% (+12.65 percentage points; exact McNemar p = 0.00265). In the
> matched away-from-ground-truth control, propagation was 41.22%,
> producing a +27.76-point contrast against the toward-GT intervention
> (exact McNemar p = 3.77 × 10\^-11). A question-level mixed-effects
> robustness analysis yielded OR = 1.84 for baseline-to-toward and OR =
> 3.84 for away-to-toward.

This should be presented as deterministic directional sensitivity
evidence, not as a causal deployment claim.

------------------------------------------------------------------------

## 15. Final freeze declaration

**ClimateTwin Phase 1.5 is FROZEN.**

The evidence chain is internally consistent across the frozen D/E/F
analyses, the G robustness analysis, and the H remediation.

Further scientific investigation must be opened as a new numbered phase
rather than modifying Phase 1.5 artifacts in place.
