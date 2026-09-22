# ClimateTwin --- Phase 1.5 Research Freeze & NeurIPS Evidence Pack

**Status:** FROZEN\
**Scope:** Phase 1.5 deterministic decision-margin sensitivity
experiment\
**Purpose:** Establish the final empirical evidence from the validated
ClimateTwinBench Hypothesis V2 derivation results before moving to paper
design/review.

------------------------------------------------------------------------

## 0. Executive decision

### Phase 1.5 is frozen.

The experiment has now completed the planned sequence:

1.  Canonical oracle/reproduction validation.
2.  Offline threshold-margin sensitivity analysis.
3.  Identification and exclusion of the degenerate alpha=1 endpoint.
4.  Addition of a matched away-from-GT directional control.
5.  Exact paired statistical testing.
6.  Paired bootstrap uncertainty estimation.
7.  Category-level and model-level secondary summaries.
8.  Clean rerun of the publication-statistics artifact with no runtime
    warnings.

**No further model/API inference is required for this experiment.**

We should now stop modifying the experimental design unless a later
independent audit identifies a correctness problem.

This does **not** mean the NeurIPS paper is finished. It means the
empirical core of Phase 1.5 is finished and should be treated as a fixed
evidence package.

------------------------------------------------------------------------

# 1. Research question

The experiment asks:

> **When a deterministic verification protocol contains a numerical
> decision error, how does the position of its decision thresholds
> relative to the canonical metric state affect whether that numerical
> error becomes consequential?**

The experiment is intentionally narrower than a claim about all
numerical errors, all verification systems, or all real-world deployment
settings.

The operational outcome is whether an observed model-derived numerical
error is:

-   **absorbed** --- the deterministic decision remains the canonical
    ground-truth decision; or
-   **propagated** --- the numerical error changes the deterministic
    decision relative to the canonical ground-truth decision.

The experiment therefore studies the **decision consequences of
already-observed numerical derivation errors**, rather than generating
new model errors.

------------------------------------------------------------------------

# 2. Experimental data

## Benchmark

The analysis uses:

`benchmark/ClimateTwinBench_Hypothesis_V2.json`

The benchmark contains 240 hypothesis questions distributed across six
protocol categories.

The six categories represented in the sensitivity analysis are:

1.  `compound_state_transition_verification`
2.  `localized_intensification_verification`
3.  `persistent_regional_anomaly_verification`
4.  `reliability_aware_claim_verification`
5.  `spatial_coherence_verification`
6.  `wet_anomaly_consistency_verification`

The sensitivity analysis consumes the already-generated
derivation/evaluation outputs for:

-   Claude
-   Claude Opus
-   DeepSeek
-   Gemini
-   GPT

No new model inference is performed by Phase 1.5.

------------------------------------------------------------------------

# 3. Primary observation set

The analysis identifies:

**245 distinct model/question observations containing an observed metric
error.**

These are the paired observational units used throughout the primary and
directional analyses.

Each unit is identified by:

`(model, question_id)`

The same 245 observations are retained across the primary toward-GT
analysis and the away-from-GT control.

This pairing is essential: the statistical comparisons are not treated
as independent samples.

------------------------------------------------------------------------

# 4. Canonical decision reference

The experiment uses the existing deterministic decision logic as the
oracle.

The analysis does not reimplement an alternative classifier.

For each observation, propagation is evaluated against the **original
canonical GT decision**.

This is important because the intervention changes protocol thresholds
in memory, while the canonical target remains fixed.

The experiment therefore asks whether the *same observed numerical
error* becomes more or less consequential under controlled changes in
decision-boundary position.

------------------------------------------------------------------------

# 5. Threshold intervention

For each relevant metric/threshold pair, the primary intervention is:

\[ T\_{`\alpha`{=tex}}\^{toward} = T+`\alpha`{=tex}(G-T) \]

where:

-   \(T\) = original protocol threshold,
-   \(G\) = canonical ground-truth metric value,
-   (`\alpha`{=tex}) = margin-contraction parameter.

Interpretation:

-   (`\alpha=0`{=tex}): original protocol threshold.
-   (0\<`\alpha`{=tex}\<1): threshold moves toward the canonical metric
    state.
-   (`\alpha=1`{=tex}): threshold reaches the canonical metric value and
    becomes a degenerate equality boundary.

The primary alpha grid is:

\[ {0, 0.10, 0.25, 0.50, 0.75, 0.90, 0.95, 0.99} \]

------------------------------------------------------------------------

# 6. Why alpha=1 is excluded

An initial exploratory run included alpha=1.0.

At alpha=1.0, the threshold can collapse onto the canonical metric
value. This changes the canonical GT decision at the equality boundary
and therefore changes the target being used to classify propagation.

The final analysis therefore excludes alpha=1.0 from the primary
inferential domain.

Empirically:

-   Through alpha=0.99: **0 canonical GT decision changes**
-   At alpha=1.0: the earlier diagnostic run showed **222/245**
    canonical GT decisions changing.

This makes alpha=1 a useful **degeneracy diagnostic**, not a valid
primary endpoint.

The final experiment consequently uses alpha \<= 0.99.

------------------------------------------------------------------------

# 7. Primary sensitivity result

At the original threshold configuration:

**Propagation = 138 / 245 = 56.3265%**

At alpha=0.99 toward the canonical GT metric:

**Propagation = 169 / 245 = 68.9796%**

Therefore:

\[ `\Delta `{=tex}P = 68.9796%-56.3265% =
+12.65`\text{ percentage points}`{=tex} \]

The paired bootstrap 95% confidence interval is:

\[ \[+4.49, +20.41\]`\text{ percentage points}`{=tex} \]

The exact two-sided McNemar test gives:

\[ p=0.00265379 \]

The paired transition counts are:

-   Absorbed -\> Propagated: **66**
-   Propagated -\> Absorbed: **35**

Thus the net directional movement is:

\[ 66-35=+31 \]

propagation outcomes.

------------------------------------------------------------------------

# 8. Full toward-GT response curve

The primary aggregate curve is:

    Alpha   Propagation rate
  ------- ------------------
     0.00             56.33%
     0.10             57.14%
     0.25             56.73%
     0.50             61.22%
     0.75             64.49%
     0.90             68.16%
     0.95             68.16%
     0.99             68.98%

The curve is not strictly monotonic at every local step.

In particular, alpha=0.10 to alpha=0.25 shows a small reversal.

Therefore the paper should **not** claim a mathematically monotonic
dose-response relationship.

The defensible claim is that stronger contraction toward the canonical
metric state produces a substantial net increase in consequential
errors, while local non-monotonicity reflects the underlying
deterministic Boolean decision geometry.

------------------------------------------------------------------------

# 9. Directional control

The matched control applies an equal-magnitude displacement in the
opposite direction:

\[ T\_{`\alpha`{=tex}}\^{away} = T-`\alpha`{=tex}(G-T) \]

The away-from-GT control uses:

-   the same 245 observations,
-   the same alpha grid,
-   the same canonical metrics,
-   the same model predictions,
-   the same deterministic classifier,
-   the same canonical GT target.

Only the direction of threshold displacement changes.

------------------------------------------------------------------------

# 10. Away-from-GT control result

At alpha=0.99:

**Away-from-GT propagation = 41.2245%**

The same observation set under toward-GT contraction gives:

**Toward-GT propagation = 68.9796%**

Therefore:

\[ 68.9796%-41.2245% = +27.76`\text{ percentage points}`{=tex} \]

The paired bootstrap 95% CI is:

\[ \[+20.00, +35.51\]`\text{ percentage points}`{=tex} \]

The exact two-sided McNemar test gives:

\[ p=3.76518`\times10`{=tex}\^{-11} \]

Directional paired transitions:

-   Away propagated -\> Toward absorbed: **21**
-   Away absorbed -\> Toward propagated: **89**

Therefore the directional discordance is:

\[ 89-21=68 \]

This is the central control result.

------------------------------------------------------------------------

# 11. Why the directional control matters

A weaker experiment could only show:

> "Changing thresholds changes propagation."

The control demonstrates something more specific.

At alpha=0.99:

-   Moving thresholds **toward** the canonical metric state increases
    propagation.
-   Moving thresholds **away** from the canonical metric state decreases
    propagation.

Both interventions preserve the canonical GT decision through
alpha=0.99.

Therefore the result is not adequately described as a generic
consequence of perturbing thresholds.

The defensible interpretation is **directional sensitivity of
deterministic decision outcomes to the location of the verification
boundary relative to the canonical metric state**.

------------------------------------------------------------------------

# 12. Full directional curves

    Alpha   Toward-GT   Away-GT
  ------- ----------- ---------
     0.00      56.33%    56.33%
     0.10      57.14%    55.92%
     0.25      56.73%    53.06%
     0.50      61.22%    46.12%
     0.75      64.49%    42.04%
     0.90      68.16%    41.22%
     0.95      68.16%    41.22%
     0.99      68.98%    41.22%

The separation becomes substantial as the displacement approaches the
canonical metric state.

------------------------------------------------------------------------

# 13. Category heterogeneity

The response is not uniform across protocol families.

## Compound state transition

Baseline:

**65.0%**

Toward-GT alpha=.99:

**75.0%**

Change:

**+10.0 pp**

Away-GT alpha=.99:

**42.5%**

This demonstrates substantial directional sensitivity.

------------------------------------------------------------------------

## Localized intensification

Baseline:

**67.5%**

Toward-GT alpha=.99:

**72.5%**

Change:

**+5.0 pp**

Away-GT alpha=.99:

**35.0%**

The protocol is sensitive in both directions, with stronger suppression
under away-from-GT displacement.

------------------------------------------------------------------------

## Persistent regional anomaly

Baseline:

**9.3%**

Toward-GT alpha=.99:

**51.2%**

Change:

**+41.9 pp**

Away-GT alpha=.99:

**4.7%**

This is the largest observed category-level sensitivity.

The same protocol moves from very low propagation at baseline to roughly
half of the observed errors becoming consequential under strong
toward-GT contraction, while moving in the opposite direction suppresses
propagation further.

This should be treated as a particularly important secondary result, not
generalized to every protocol.

------------------------------------------------------------------------

## Reliability-aware claim verification

Baseline:

**67.5%**

Toward-GT alpha=.99:

**67.5%**

Away-GT alpha=.99:

**67.5%**

This protocol is effectively invariant under the tested intervention.

That invariance is scientifically useful because it demonstrates that
the effect is not universal across deterministic protocols.

------------------------------------------------------------------------

## Spatial coherence

Baseline:

**66.7%**

Toward-GT alpha=.99:

**81.0%**

Change:

**+14.3 pp**

Away-GT alpha=.99:

**47.6%**

This provides another strong example of directional sensitivity.

------------------------------------------------------------------------

## Wet anomaly consistency

Baseline:

**65.0%**

Toward-GT alpha=.99:

**67.5%**

Change:

**+2.5 pp**

Away-GT alpha=.99:

**52.5%**

The effect is weaker than for persistent regional anomaly or spatial
coherence.

------------------------------------------------------------------------

# 14. What the heterogeneity suggests

The category results suggest that sensitivity depends on the structure
of the deterministic protocol rather than simply on the existence of a
numerical threshold.

The strongest response occurs in some protocols while another protocol
remains invariant.

This motivates a more precise scientific framing:

> The consequentiality of numerical derivation error is mediated by
> deterministic decision-boundary geometry.

However, this is a **research interpretation/hypothesis**, not something
the current experiment proves mechanistically.

The current experiment establishes the observed directional sensitivity.
A deeper mechanistic explanation of why individual Boolean protocol
structures respond differently would require additional analysis.

------------------------------------------------------------------------

# 15. Statistical methodology

## Primary comparison

The same 245 paired observations are compared between:

-   alpha=0 baseline
-   alpha=.99 toward-GT

The primary inferential test is an **exact two-sided McNemar test**
because the outcome is binary and paired.

## Directional comparison

The same 245 observations are compared between:

-   alpha=.99 away-GT
-   alpha=.99 toward-GT

Again, the exact two-sided McNemar test is used.

## Confidence intervals

Paired bootstrap risk-difference confidence intervals use:

-   **10,000 resamples**
-   seed: **20260626**
-   resampling at the paired observation level.

The bootstrap therefore preserves the within-observation dependence
between conditions.

------------------------------------------------------------------------

# 16. Secondary statistics

The Phase 1.5F artifact also generates:

-   alpha-response curve,
-   category-level endpoint effects,
-   category-level paired tests,
-   Holm-adjusted secondary directional p-values,
-   model-level endpoint summaries,
-   descriptive per-observation Spearman association with alpha.

The Spearman analysis is explicitly secondary/descriptive.

Constant-response observations are excluded because Spearman correlation
is undefined when the binary propagation vector is constant across the
alpha grid.

The primary inferential conclusions do not depend on this secondary
correlation analysis.

------------------------------------------------------------------------

# 17. Reproducibility status

The final statistical script reads only already-generated experiment
outputs.

It performs:

-   no model inference,
-   no API calls,
-   no benchmark generation,
-   no stochastic model sampling.

The analysis has been rerun after cleaning the secondary statistical
implementation.

The final run completes without runtime warnings and reproduces the
headline statistics:

-   Primary: **+12.65 pp**
-   Primary CI: **\[+4.49, +20.41\] pp**
-   Primary McNemar: **p=0.00265379**
-   Directional: **+27.76 pp**
-   Directional CI: **\[+20.00, +35.51\] pp**
-   Directional McNemar: **p=3.76518e-11**

------------------------------------------------------------------------

# 18. Exact frozen artifacts

The final Phase 1.5 analysis is represented by:

``` text
experiments/
└── experiment_05_derivation/
    ├── analyze_margin_sensitivity.py
    ├── analyze_margin_sensitivity_control.py
    ├── phase_1_5f_statistics.py
    └── results/
        ├── margin_sensitivity/
        │   ├── question_level_sensitivity.csv
        │   ├── aggregate_sensitivity_overall.csv
        │   ├── aggregate_sensitivity_by_model.csv
        │   ├── aggregate_sensitivity_by_category.csv
        │   └── margin_sensitivity_metadata.json
        │
        ├── margin_sensitivity_control/
        │   ├── question_level_control.csv
        │   ├── aggregate_control_overall.csv
        │   ├── aggregate_control_by_model.csv
        │   ├── aggregate_control_by_category.csv
        │   └── margin_sensitivity_control_metadata.json
        │
        └── phase_1_5f_statistics/
            ├── phase_1_5f_statistics.json
            ├── phase_1_5f_primary_effect.csv
            ├── phase_1_5f_directional_effect.csv
            ├── phase_1_5f_category_effects.csv
            ├── phase_1_5f_alpha_curve.csv
            ├── phase_1_5f_model_effects.csv
            └── phase_1_5f_report.md
```

These artifacts should now be treated as **frozen evidence**.

------------------------------------------------------------------------

# 19. What the experiment establishes

The strongest defensible claims are:

### Claim 1 --- Numerical errors can be consequential even inside deterministic verification.

Among the 245 observed metric-error observations, 56.33% were already
consequential under the original protocol configuration.

This establishes that deterministic verification does not automatically
absorb numerical derivation error.

### Claim 2 --- Consequentiality is sensitive to decision-boundary position.

Moving thresholds toward the canonical metric state increased
propagation from 56.33% to 68.98%.

### Claim 3 --- The sensitivity is directionally asymmetric.

An equal-magnitude displacement away from the canonical metric state
reduced propagation to 41.22%, while toward-GT displacement increased it
to 68.98%.

### Claim 4 --- The response is heterogeneous across protocol families.

Some protocols show strong sensitivity, while reliability-aware
verification is invariant under the tested intervention.

------------------------------------------------------------------------

# 20. What the experiment does NOT establish

We must explicitly avoid these claims:

-   It does not establish that all numerical errors in real deployments
    behave this way.
-   It does not establish that threshold contraction is a causal
    intervention in an operational system.
-   It does not establish that the tested alpha transformation
    represents all possible protocol modifications.
-   It does not establish that the observed category differences are
    universal properties of the protocol families.
-   It does not prove that deterministic verification is superior to
    every alternative verification architecture.
-   It does not prove that the observed phenomenon generalizes beyond
    the ClimateTwinBench Hypothesis V2 benchmark.
-   It does not establish a universal monotonic relationship between
    alpha and propagation.
-   It does not justify including the alpha=1 degenerate endpoint in the
    primary analysis.

These boundaries should appear in the paper's limitations section.

------------------------------------------------------------------------

# 21. Candidate scientific framing

A strong framing is:

> **Numerical derivation errors do not have a fixed semantic consequence
> inside deterministic verification protocols. Their consequentiality
> depends on the position of the protocol's decision boundary relative
> to the canonical metric state.**

The empirical question then becomes:

> **When does a numerical derivation error remain harmless, and when
> does deterministic protocol geometry convert it into a consequential
> decision failure?**

This framing is stronger than simply presenting a benchmark of numerical
accuracy because it connects numerical error to downstream decision
behavior.

------------------------------------------------------------------------

# 22. Candidate contribution structure

The Phase 1.5 evidence supports three candidate contributions.

## Contribution A --- A controlled sensitivity methodology

A deterministic benchmark can separate:

1.  numerical derivation error,
2.  deterministic protocol execution,
3.  canonical decision correctness.

The threshold-displacement intervention provides a controlled way to
study how numerical errors interact with protocol boundaries.

## Contribution B --- Directional sensitivity

The same numerical errors produce materially different decision outcomes
when the verification boundary is displaced toward versus away from the
canonical metric state.

## Contribution C --- Protocol heterogeneity

Different deterministic verification structures exhibit different
sensitivity profiles, including near-invariant behavior in at least one
tested category.

------------------------------------------------------------------------

# 23. Recommended figures

The final paper should prioritize a small number of high-information
figures.

## Figure 1 --- Directional sensitivity curve

X-axis:

`alpha`

Y-axis:

`Propagation rate`

Two curves:

-   Toward-GT
-   Away-GT

Include uncertainty bands if the final figure-generation analysis
supports them.

Mark alpha=1 as an excluded/degenerated endpoint rather than plotting it
as part of the inferential curve.

## Figure 2 --- Protocol heterogeneity

Grouped category endpoint plot:

-   baseline
-   toward-GT .99
-   away-GT .99

This should make the persistent-regional and reliability-aware contrast
visually obvious.

## Figure 3 --- Paired transition structure

A 2x2 transition matrix or paired-flow visualization showing:

-   absorbed -\> propagated
-   propagated -\> absorbed
-   absorbed -\> absorbed
-   propagated -\> propagated

for the primary and directional comparisons.

------------------------------------------------------------------------

# 24. Recommended tables

## Table 1 --- Benchmark/protocol composition

Report:

-   six protocol categories,
-   number of questions,
-   deterministic decision structure,
-   number of model/question metric-error observations used.

## Table 2 --- Primary and directional effects

Include:

  -----------------------------------------------------------------------------------
  Contrast       Baseline     Endpoint   Difference              95% CI Exact McNemar
                                                                                    p
  ---------- ------------ ------------ ------------ ------------------- -------------
  Baseline         56.33%       68.98%    +12.65 pp    \[+4.49,+20.41\]    0.00265379
  -\> Toward                                                            
  .99                                                                   

  Away .99         41.22%       68.98%    +27.76 pp   \[+20.00,+35.51\]   3.76518e-11
  -\> Toward                                                            
  .99                                                                   
  -----------------------------------------------------------------------------------

## Table 3 --- Category heterogeneity

Include baseline, toward, away, and endpoint differences for all six
categories.

------------------------------------------------------------------------

# 25. What remains for the NeurIPS paper

Phase 1.5 itself is complete.

The next work is **not another sensitivity experiment by default**.

The next stage is to determine whether this experiment is sufficient as
the paper's central contribution and, if not, identify the smallest
genuinely necessary additional experiment.

The paper-development workflow should therefore be:

1.  Freeze Phase 1.5.
2.  Produce the evidence pack.
3.  Have independent reviewers inspect the frozen evidence.
4.  Identify reviewer attacks that are not already addressed.
5.  Decide whether a second experiment is necessary.
6.  Only then implement another experiment.

This prevents uncontrolled experiment proliferation.

------------------------------------------------------------------------

# 26. Reviewer attack checklist

Before submission, explicitly test the manuscript against:

### Construct validity

-   Is "metric error" defined unambiguously?
-   Is propagation separated from raw numerical accuracy?
-   Is the canonical GT decision independent of the perturbed threshold?

### Intervention validity

-   Why is the threshold displacement defined as
    (T+`\alpha`{=tex}(G-T))?
-   Why is the equal-magnitude opposite-direction control appropriate?
-   Why is alpha=.99 the endpoint?

### Statistical validity

-   Are the 245 observations truly paired?
-   Is McNemar appropriate for the binary paired endpoint?
-   Is bootstrap resampling performed at the observation level?
-   Are category tests clearly secondary and multiplicity-adjusted?

### Generalization

-   Are claims restricted to the benchmark and protocol family?
-   Are protocol-specific effects separated from universal claims?

### Degeneracy

-   Is alpha=1 explicitly discussed?
-   Is the equality-boundary pathology shown rather than hidden?

### Researcher degrees of freedom

-   Was the alpha grid specified before final inference?
-   Is the away-from-GT control part of the frozen design?
-   Are exploratory endpoint choices distinguished from primary
    inference?

------------------------------------------------------------------------

# 27. Final freeze statement

**Phase 1.5 is now a frozen experiment.**

The final primary result is:

\[ `\boxed{
56.33\% \rightarrow 68.98\%
\quad
(+12.65\text{ pp},
\ 95\%\,CI=[4.49,20.41],
\ p=0.00265379)
}`{=tex} \]

The final directional control result is:

\[ `\boxed{
41.22\% \rightarrow 68.98\%
\quad
(+27.76\text{ pp},
\ 95\%\,CI=[20.00,35.51],
\ p=3.76518\times10^{-11})
}`{=tex} \]

Both conditions preserve the canonical GT decision through alpha=.99.

The experiment therefore supports a focused conclusion:

> **Observed numerical derivation errors exhibit directional sensitivity
> inside deterministic verification protocols: moving decision
> thresholds toward the canonical metric state increases their
> consequentiality, while an equal-magnitude displacement away decreases
> it. The magnitude of this sensitivity varies substantially across
> protocol structures.**

This is the evidence that should now be handed to independent reviewers.

------------------------------------------------------------------------

# 28. Freeze protocol

From this point forward:

**Do not:**

-   modify the alpha grid,
-   add arbitrary perturbation types,
-   remove inconvenient categories,
-   rerun model inference merely to improve the result,
-   tune the endpoint after seeing results,
-   replace the canonical oracle,
-   include alpha=1 in the primary analysis.

**Do:**

-   preserve the generated CSV/JSON artifacts,
-   preserve the exact scripts,
-   preserve the final statistical report,
-   document all exploratory analyses separately,
-   use the frozen result when writing/reviewing the paper.

------------------------------------------------------------------------

## Final status

  Component                          Status
  ---------------------------------- -------------------------------
  Benchmark                          FROZEN
  Canonical oracle                   VALIDATED
  245-error observation set          FROZEN
  Toward-GT sensitivity experiment   FROZEN
  Away-GT directional control        FROZEN
  Alpha=.99 endpoint                 FROZEN
  Alpha=1 degeneracy                 DOCUMENTED / EXCLUDED
  Exact paired inference             COMPLETE
  Bootstrap uncertainty              COMPLETE
  Category analysis                  COMPLETE
  Clean statistical rerun            COMPLETE
  Phase 1.5 evidence                 **FROZEN**
  NeurIPS paper                      **NOT YET FROZEN**
  Additional experiment              **DO NOT ADD UNTIL REVIEWED**
