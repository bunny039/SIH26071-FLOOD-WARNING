# Phase 1.5G Optimizer and Restart Diagnostics

## Purpose

This is a secondary robustness diagnostic for the Phase 1.5G mixed-effects
model. It does not replace, redefine, or otherwise affect the frozen
primary Phase 1.5D/E/F paired McNemar analysis, which remains the primary
inferential result for Phase 1.5. No model or API inference was performed
to produce this diagnostic; it operates entirely on the already-generated,
already-committed Phase 1.5G model-data artifacts:

- `phase_1_5g_primary_model_data.csv`
- `phase_1_5g_directional_model_data.csv`

## Canonical estimator

The canonical Phase 1.5G estimator remains:

- `BinomialBayesMixedGLM.from_formula("propagated ~ condition", {"question": "0 + C(question_id)"}, vcp_p=1.0, fe_p=2.0)`
- `fit_vb(fit_method="BFGS", minim_opts={"maxiter": 10000, "gtol": 1e-7})`
- seed = `20260626` (`PHASE_1_5G_SEED`)
- question-level random intercept only (no model-level random effect)
- mean-field variational Bayes posterior approximation

The canonical fit itself is unchanged by this diagnostic.

## Diagnostic design

6 optimizers × 4 deterministic seeds × 2 endpoints = 48 attempted fits.

Optimizers: `BFGS`, `L-BFGS-B`, `CG`, `Newton-CG`, `trust-constr`, `Nelder-Mead`

Seeds: `20260626`, `20260627`, `20260628`, `20260629`

Endpoints: `primary` (baseline → toward-GT alpha=.99), `directional`
(away-GT alpha=.99 → toward-GT alpha=.99)

Full per-run results are recorded in the accompanying
`phase_1_5g_optimizer_diagnostics.csv`.

## Primary endpoint

Canonical (BFGS, seed 20260626): OR = 1.838698

Across all gradient-based optimizers and all four seeds (BFGS, L-BFGS-B,
CG, Newton-CG, trust-constr — excluding Nelder-Mead), OR ranged
1.838623–1.838870.

## Directional endpoint

Canonical (BFGS, seed 20260626): OR = 3.843138

Across all gradient-based optimizers and all four seeds, OR ranged
3.842627–3.843219.

## Convergence warning

The canonical BFGS fit emitted `UserWarning: VB fitting did not converge`
for both endpoints. Gradient norms recovered directly from
`result.optim_retvals` at the canonical (BFGS, seed 20260626) solution
were approximately:

- primary: 1.75e-7
- directional: 7.41e-7

both on the same order as the requested `gtol=1e-7`, consistent with a
scipy precision-loss termination status rather than a failure to locate
the optimum. Alternative gradient-based methods (L-BFGS-B, Newton-CG,
trust-constr, CG) reached materially equivalent estimates to the
canonical BFGS fit across all four seeds. The warning is not associated
with a materially different fitted solution in the optimizer/restart
diagnostics performed here.

## Nelder-Mead

Nelder-Mead produced a degenerate near-null solution at every seed for
both endpoints (OR ≈ 1.0000, beta ≈ 0.00001–0.00005), far from the
gradient-based consensus. This is not treated as evidence against the
canonical fit or against the gradient-based consensus. The model's
random-intercept specification (`0 + C(question_id)`) introduces
approximately one parameter per question — a high-dimensional posterior
surface on which a derivative-free simplex method such as Nelder-Mead is
not an appropriate comparator. This result is reported for completeness
and transparency, not suppressed.

## Restart stability

Primary: OR spread ≈ 0.00025 across gradient-based optimizers/seeds
(≈0.013% relative variation).

Directional: OR spread ≈ 0.00059 across gradient-based optimizers/seeds
(≈0.015% relative variation).

The gradient-based fits are stable to approximately 4–5 significant
figures across both endpoints.

## Limitations

- This is a secondary robustness analysis only.
- It does not establish causal validity.
- It does not establish deployment performance.
- It does not prove generalization to other benchmarks.
- It does not resolve the external real-world identity of the `gpt`
  label (see the GPT-label provenance note elsewhere in this pipeline's
  output); this diagnostic makes no claim about that identity.
- Mean-field VB remains an approximate inference method; the reported
  intervals are approximate credible intervals under that approximation,
  not exact posterior or frequentist intervals.
- Optimizer stability does not substitute for, and carries no bearing
  on, the primary paired McNemar analysis (Phase 1.5D/E/F), which does
  not depend on this model.

## Conclusion

The canonical Phase 1.5G estimates were stable across the deterministic
initialization seeds and gradient-based optimization methods examined in
the secondary diagnostic. The canonical BFGS fit emitted a
precision-loss warning, but alternative gradient-based methods reached
materially equivalent estimates. This supports treating the warning as
an optimization-termination diagnostic rather than evidence of a
materially different solution.
