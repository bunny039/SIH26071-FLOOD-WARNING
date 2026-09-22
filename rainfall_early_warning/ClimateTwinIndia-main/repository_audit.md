# Repository Audit Report

Generated: 2026-06-26T23:28:31.038143

Repository root: E:\ClimateTwinIndia

## Repository Summary

* Total files: 89
* Python files: 22
* Notebooks: 5
* JSON files: 11
* Image files: 4
* Evaluation files: 14

## Python Modules

| File | Lines | Functions | Classes | Notes |
|------|-------|-----------|---------|-------|
| repository_audit.py | 621 | 12 | 1 |  |
| src\alerts.py | 19 | 1 | 0 | GENERATOR |
| src\benchmark_generator.py | 0 | 0 | 0 | STUB |
| src\climate_analysis.py | 184 | 13 | 0 |  |
| src\climate_database.py | 17 | 2 | 0 |  |
| src\climate_state.py | 22 | 2 | 1 |  |
| src\climatology.py | 10 | 3 | 0 |  |
| src\coordinates.py | 4 | 1 | 0 | STUB |
| src\database_builder.py | 74 | 1 | 0 |  |
| src\domain_reasoning_v2.py | 610 | 9 | 0 |  |
| src\export_public_benchmark.py | 31 | 0 | 0 |  |
| src\forecasting.py | 0 | 0 | 0 | STUB |
| src\hypothesis_benchmark_generator.py | 1147 | 43 | 1 | GENERATOR |
| src\ingest.py | 59 | 2 | 0 |  |
| src\loaders.py | 33 | 2 | 0 |  |
| src\preprocess.py | 0 | 0 | 0 | STUB |
| src\region.py | 17 | 2 | 0 |  |
| src\risk_dashboard.py | 0 | 0 | 0 | STUB |
| src\risk_engine.py | 20 | 2 | 0 |  |
| src\state_engine.py | 22 | 1 | 0 |  |
| src\trust.py | 28 | 2 | 0 |  |
| src\utils.py | 0 | 0 | 0 | STUB |

### Benchmark Generators

* `src\alerts.py`
* `src\benchmark_generator.py`
* `src\hypothesis_benchmark_generator.py`

### Evaluation Scripts

* None detected.

### Empty Stubs

* `src\benchmark_generator.py`
* `src\coordinates.py`
* `src\forecasting.py`
* `src\preprocess.py`
* `src\risk_dashboard.py`
* `src\utils.py`

## Benchmark JSON Analysis

## Model Evaluation Results

### chatgpt

* File: `evaluation\chatgpt_hypothesis_answers.txt`
* Responses: 240
* Accuracy: 64.2% (154/240)
* Confusion matrix (true vs predicted):
| True \ Pred | A | B | C |
|-------------|---|---|---|
| A | 48 | 14 | 13 |
| B | 12 | 55 | 19 |
| C | 11 | 17 | 51 |


### claude

* File: `evaluation\claude_hypothesis_answers.txt`
* Responses: 240
* Accuracy: 100.0% (240/240)
* Confusion matrix (true vs predicted):
| True \ Pred | A | B | C |
|-------------|---|---|---|
| A | 75 | 0 | 0 |
| B | 0 | 86 | 0 |
| C | 0 | 0 | 79 |


### deepseek

* File: `evaluation\deepseek_hypothesis_answers.txt`
* Responses: 240
* Accuracy: 100.0% (240/240)
* Confusion matrix (true vs predicted):
| True \ Pred | A | B | C |
|-------------|---|---|---|
| A | 75 | 0 | 0 |
| B | 0 | 86 | 0 |
| C | 0 | 0 | 79 |


### gemini

* File: `evaluation\gemini_hypothesis_answers.txt`
* Responses: 240
* Accuracy: 32.5% (78/240)
* Confusion matrix (true vs predicted):
| True \ Pred | A | B | C |
|-------------|---|---|---|
| A | 25 | 28 | 22 |
| B | 27 | 27 | 32 |
| C | 28 | 25 | 26 |


### unknown

* File: `evaluation\meta_domain.txt`
* Responses: 0
* Accuracy: 0.0% (0/0)
* Confusion matrix (true vs predicted):
| True \ Pred | A | B | C |
|-------------|---|---|---|
| A | 0 | 0 | 0 |
| B | 0 | 0 | 0 |
| C | 0 | 0 | 0 |


## Notebooks

* `notebooks\01_imd_exploration.ipynb`
  * Markdown cells: 0, Code cells: 253
* `notebooks\03_temporal_analysis.ipynb`
  * Markdown cells: 0, Code cells: 36
* `notebooks\climatetwinbench_notebook.ipynb`
  * Markdown cells: 16, Code cells: 21
* `notebooks\climatetwinbench_notebook_V2.ipynb`
  * Markdown cells: 16, Code cells: 68
* `notebooks\evaluate_hypothesis.ipynb`
  * Markdown cells: 0, Code cells: 11
## Figures

* `docs\images\rainfall_trend.png` (25590 bytes)
* `docs\images\risk_hotspots_2025.png` (15130 bytes)
* `docs\images\wettest_day_2024.png` (39141 bytes)
* `notebooks\docs\images\rainfall_anomaly_2025.png` (15130 bytes)
## Reproducibility Information

* Seeds found in:
  * None detected.
* Config files:
  * `benchmark\benchmark.json`
  * `benchmark\benchmark_summary.json`
  * `benchmark\ClimateTwinBench_Domain.json`
  * `benchmark\ClimateTwinBench_Domain_public.json`
  * `benchmark\ClimateTwinBench_Hypothesis.json`
  * `benchmark\ClimateTwinBench_Hypothesis_public.json`
  * `benchmark\ClimateTwinBench_test.json`
  * `benchmark\ClimateTwinBench_train.json`
  * `benchmark\ClimateTwinBench_v1.json`
  * `benchmark\ClimateTwinBench_val.json`
  * `notebooks\benchmark.json`
* CLI entry points:
  * `repository_audit.py`
  * `src\hypothesis_benchmark_generator.py`

## Audit Findings

### FACT (Supported by Repository)

* The Hypothesis benchmark generator (`hypothesis_benchmark_generator.py`) is implemented.
* Model evaluation outputs exist: evaluation\chatgpt_answers.txt, evaluation\chatgpt_domain.txt, evaluation\chatgpt_hypothesis_answers.txt, evaluation\claude_answers.txt, evaluation\claude_domain.txt, evaluation\claude_hypothesis_answers.txt, evaluation\deepseek_answers.txt, evaluation\deepseek_domain.txt, evaluation\deepseek_hypothesis_answers.txt, evaluation\gemini_answers.txt, evaluation\gemini_domain.txt, evaluation\gemini_hypothesis_answers.txt, evaluation\meta_answers.txt, evaluation\meta_domain.txt.

### UNSUPPORTED (Claims Not Defended)

* Numerical benchmark generator is missing or empty (claimed in paper).
* No evaluation script is present to compute accuracy from outputs.
* Confusion matrix not computed in current code.

### TODO (Required Before Submission)

* Implement evaluation script to compute accuracy, confusion matrices, and per-subcategory breakdown.
* Either implement Numerical benchmark generator or remove it from the paper.

## Paper Readiness Checklist

| Item | Status |
|------|--------|
| Hypothesis benchmark generator | ✅ |
| Domain benchmark generator | ❌ |
| Numerical benchmark generator | ✅ |
| Evaluation script | ❌ |
| Model evaluation results | ✅ |
| Benchmark statistics | ❌ |
| Figures | ✅ |
| Public/private split | ❌ |
| Reproducibility (seeds, configs) | ❌ |

---
*This report is automatically generated. Please verify manually for completeness.*