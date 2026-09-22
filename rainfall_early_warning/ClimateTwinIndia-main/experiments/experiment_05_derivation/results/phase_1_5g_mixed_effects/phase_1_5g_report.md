# ClimateTwin Phase 1.5G — Mixed-Effects Robustness

## Purpose

This analysis re-evaluates the frozen Phase 1.5 endpoints using a
binomial generalized linear mixed model with a question-level random
intercept.

No model inference or benchmark generation was performed.

**Phase 1.5G is a SECONDARY robustness analysis.** The frozen paired
McNemar test (Phase 1.5D/E/F) remains the primary inferential analysis.
Nothing in this file changes, supersedes, or is required to support that
primary result.

## Primary endpoint

Baseline -> toward-GT alpha=0.99

- N pairs: 245
- Baseline propagation: 56.326531%
- Toward propagation: 68.979592%
- Difference: +12.6531 pp
- Exact McNemar p: 0.0026537861
- Mixed-model OR: 1.838698
- Approx. 95% credible interval (mean-field VB):
  [1.384961,
   2.441086]
- Posterior P(beta > 0):
  0.999987

Question random-intercept SD:
0.736829

VB warning emitted: True
Optimizer message: scipy.optimize.minimize did not report full convergence (UserWarning: VB fitting did not converge)

## Directional control

Away-GT alpha=0.99 -> toward-GT alpha=0.99

- N pairs: 245
- Away propagation: 41.224490%
- Toward propagation: 68.979592%
- Difference: +27.7551 pp
- Exact McNemar p: 3.7651773e-11
- Mixed-model OR: 3.843138
- Approx. 95% credible interval (mean-field VB):
  [2.877542,
   5.132751]
- Posterior P(beta > 0):
  1.000000

Question random-intercept SD:
0.910654

VB warning emitted: True
Optimizer message: scipy.optimize.minimize did not report full convergence (UserWarning: VB fitting did not converge)

## Convergence diagnostic note

Fitting uses `statsmodels.genmod.bayes_mixed_glm.BinomialBayesMixedGLM`
with `fit_vb(fit_method="BFGS")`. This fit can intermittently raise
`UserWarning: VB fitting did not converge`, which is a direct pass-through
of `scipy.optimize.minimize`'s own `OptimizeResult.success` flag for the
BFGS backend on this ELBO surface — it does not, by itself, indicate a
different or worse solution. Independent checks across multiple optimizers
(BFGS, L-BFGS-B, Newton-CG) and multiple random restarts on this dataset
found the objective value and the odds-ratio estimate stable to several
significant figures regardless of whether this warning fired. The
NumPy random state used for the VB starting values is fixed
(`PHASE_1_5G_SEED = 20260626`) so that whether the warning fires
on a given re-run is itself deterministic, but this seed is independent
of, and does not affect, any Phase 1.5D/E/F seed or result.

This diagnostic describes optimizer behavior only. It is not a claim
about the scientific validity of the primary McNemar endpoint, which does
not depend on this model.

Full per-run results for this optimizer/restart diagnostic are recorded
in `phase_1_5g_optimizer_diagnostics.csv` and summarized in
`phase_1_5g_optimizer_diagnostics.md`, alongside this file.

## Interval terminology

The reported interval is an **approximate 95% credible interval under the
mean-field variational-Bayes Gaussian posterior approximation** — it is
not an exact posterior credible interval and not a frequentist confidence
interval. Mean-field VB approximates the joint posterior with an
independent-factor Gaussian, which is a known source of understated
posterior variance relative to the true (intractable) posterior. This
interval should be read as a plausible lower bound on true posterior
uncertainty rather than an exact quantification of it.

## Interpretation

The mixed-effects model is a robustness analysis addressing repeated
observations associated with the same benchmark question.

The original paired McNemar tests remain the frozen Phase 1.5 primary
analysis. This model does not replace them.

The result should be interpreted as evidence about directional
sensitivity of deterministic decision outcomes under controlled
threshold displacement, not as a causal deployment claim.

## GPT-label sensitivity and provenance

The paired results restricted to the canonical `gpt`-labeled subset are
reported separately because the observed metric-error population is
strongly concentrated in that label in the frozen Phase 1.5 artifacts.

Repository notebooks and narrative documentation (e.g.
`project_master.md`, `10_derivation_analysis.ipynb`) associate the
canonical `gpt` subset with GPT-OSS-120B. However, the evaluation
infrastructure (`evaluate_derivation.py`, `analyze_margin_sensitivity.py`)
also contains a distinct `gpt_oss_120b` label backed by its own,
non-identical raw-output file. This script reports results only for the
canonical `gpt`-labeled subset and does not itself assert a specific
model identity for that label.

## Reproducibility

All inputs are already-generated Phase 1.5 CSV files.
No model/API inference was performed.

The NumPy random state for the VB starting-value initialization is fixed
via `PHASE_1_5G_SEED = 20260626`, set immediately before each
`fit_vb()` call. This is a Phase 1.5G-only seed and is independent of any
Phase 1.5D/E/F seed.
