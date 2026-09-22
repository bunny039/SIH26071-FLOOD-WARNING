# Phase 1.5 Alpha=1.0 Diagnostic

## Reproducible result

The frozen Phase 1.5 sensitivity artifact contains:

- N = 245 metric-error observations.
- Alpha grid = [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99].
- Alpha=.99 canonical GT decision changes = 0.
- Alpha=1.0 is absent from the frozen sensitivity artifact.

## Alpha=1.0 status

The historical value of **222/245** alpha=1.0 canonical decision
changes is **not independently reproducible from the frozen
question-level CSV alone**.

This is intentional rather than an attempt to infer the missing value.

The frozen CSV does not preserve enough underlying metric/threshold
state to rerun the canonical decision function at alpha=1.0.

Therefore:

> The 222/245 figure must remain an unverified historical diagnostic
> until it is reproduced directly from the canonical oracle and the
> underlying benchmark metric/threshold state.

It must not be presented as a reproducibility result of the frozen
Phase 1.5 artifact.

## Important distinction

The alpha<=.99 Phase 1.5 results remain unaffected.

The frozen analysis establishes that canonical GT decisions do not
change through alpha=.99.

The alpha=1.0 equality-boundary behavior is a separate diagnostic.

