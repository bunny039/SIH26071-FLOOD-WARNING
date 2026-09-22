#!/usr/bin/env python3
"""
repository_audit.py

Automated repository audit for ClimateTwinIndia paper.
Generates repository_audit.md with FACTS, UNSUPPORTED, TODO, and checklist.

Usage:
    python repository_audit.py [repo_root]

If repo_root is not provided, uses current working directory.
"""

import os
import sys
import json
import re
import datetime
from pathlib import Path
from collections import defaultdict, Counter
import ast  # for Python code analysis

# ============================================================================
# Configuration
# ============================================================================

# Extensions to consider
PYTHON_EXT = ('.py')
NOTEBOOK_EXT = ('.ipynb')
JSON_EXT = ('.json')
IMG_EXT = ('.png', '.pdf', '.svg')
TXT_EXT = ('.txt', '.out')

# Directories to ignore (relative paths)
IGNORE_DIRS = {'.git', '__pycache__', '.ipynb_checkpoints', 'venv', 'env', '.env'}

# File size threshold (in bytes) to consider a Python file an empty stub
STUB_THRESHOLD = 200

# Regular expressions for detecting key functions
ACCURACY_FUNCS = ['accuracy', 'compute_accuracy', 'accuracy_score', 'confusion_matrix']
EVAL_KEYWORDS = ['accuracy', 'eval', 'evaluate', 'score', 'confusion', 'metric']

# ----------------------------------------------------------------------------
# Helper functions
# ----------------------------------------------------------------------------

def is_binary_file(file_path):
    """Check if a file is binary (we only want to read text files)."""
    try:
        with open(file_path, 'rb') as f:
            chunk = f.read(1024)
            if b'\0' in chunk:
                return True
        return False
    except:
        return True

def safe_read_text(file_path):
    """Read text file with fallback encoding."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        try:
            with open(file_path, 'r', encoding='latin-1') as f:
                return f.read()
        except:
            return None

def count_lines_and_functions(code):
    """Count lines of code and detect functions/classes."""
    if not code:
        return 0, 0, 0, {}
    try:
        tree = ast.parse(code)
    except SyntaxError:
        # Could be invalid Python; use simple regex fallback
        lines = code.count('\n') + 1
        funcs = len(re.findall(r'^\s*def\s+', code, re.MULTILINE))
        classes = len(re.findall(r'^\s*class\s+', code, re.MULTILINE))
        return lines, funcs, classes, {}
    # Use AST for accurate counting
    lines = len(code.splitlines())
    funcs = 0
    classes = 0
    names = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            funcs += 1
            names['function'] = names.get('function', []) + [node.name]
        elif isinstance(node, ast.ClassDef):
            classes += 1
            names['class'] = names.get('class', []) + [node.name]
    return lines, funcs, classes, names

# ============================================================================
# Audit classes
# ============================================================================

class RepositoryAudit:
    def __init__(self, root_dir):
        self.root = Path(root_dir).resolve()
        self.report = {
            'files': [],
            'python_files': [],
            'notebooks': [],
            'json_files': [],
            'image_files': [],
            'evaluation_files': [],
            'stubs': [],
            'generators': [],
            'evaluation_scripts': [],
            'benchmarks': {},
            'evaluation_results': {},
            'reproducibility': {},
            'checks': {}
        }
        self.unsupported_claims = []
        self.todo_items = []

    def run(self):
        self.traverse()
        self.analyze_python_files()
        self.analyze_json_files()
        self.analyze_evaluation_outputs()
        self.analyze_notebooks()
        self.analyze_reproducibility()
        self.compile_report()

    def traverse(self):
        """Recursively collect all files."""
        for root, dirs, files in os.walk(self.root):
            # Skip ignored dirs
            rel_root = Path(root).relative_to(self.root)
            if any(part in IGNORE_DIRS for part in rel_root.parts):
                continue
            for f in files:
                file_path = Path(root) / f
                rel_path = file_path.relative_to(self.root)
                try:
                    stat = file_path.stat()
                except:
                    continue
                info = {
                    'path': str(rel_path),
                    'size': stat.st_size,
                    'mtime': datetime.datetime.fromtimestamp(stat.st_mtime).isoformat()
                }
                self.report['files'].append(info)

                ext = file_path.suffix.lower()
                if ext in PYTHON_EXT:
                    self.report['python_files'].append(info)
                elif ext in NOTEBOOK_EXT:
                    self.report['notebooks'].append(info)
                elif ext in JSON_EXT:
                    self.report['json_files'].append(info)
                elif ext in IMG_EXT:
                    self.report['image_files'].append(info)
                elif ext in TXT_EXT and 'evaluation' in str(rel_path):
                    self.report['evaluation_files'].append(info)

    def analyze_python_files(self):
        """Analyze Python files for generator, evaluation, etc."""
        for info in self.report['python_files']:
            path = Path(self.root) / info['path']
            if is_binary_file(path):
                continue
            code = safe_read_text(path)
            if code is None:
                continue
            lines, funcs, classes, names = count_lines_and_functions(code)
            info['lines'] = lines
            info['functions'] = funcs
            info['classes'] = classes
            info['function_names'] = names.get('function', [])
            info['class_names'] = names.get('class', [])

            # Detect stubs
            if info['size'] < STUB_THRESHOLD and lines <= 5:
                self.report['stubs'].append(info['path'])
            # Detect generators
            if 'generator' in info['path'].lower() or any('generate' in name for name in info['function_names']):
                self.report['generators'].append(info['path'])
            # Detect evaluation scripts
            if 'eval' in info['path'].lower() or any(kw in info['path'].lower() for kw in EVAL_KEYWORDS):
                self.report['evaluation_scripts'].append(info['path'])
            # Also check function names for accuracy/confusion
            if any(f in info['function_names'] for f in ACCURACY_FUNCS):
                self.report['evaluation_scripts'].append(info['path'])

    def analyze_json_files(self):
        """Parse benchmark JSON files."""
        for info in self.report['json_files']:
            path = Path(self.root) / info['path']
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except:
                continue
            # Identify if it's a benchmark
            if 'questions' in data:
                qs = data['questions']

            # Some JSONs store only a count instead of a list
            if not isinstance(qs, list):
                continue
                bname = path.stem
                self.report['benchmarks'][bname] = {
                    'path': info['path'],
                    'n_questions': len(qs),
                    'categories': Counter(),
                    'subcategories': Counter(),
                    'difficulties': Counter(),
                    'answers': Counter(),
                    'protocols': Counter(),
                    'avg_prompt_len': 0,
                }
                total_len = 0
                for q in qs:
                    if 'category' in q:
                        self.report['benchmarks'][bname]['categories'][q['category']] += 1
                    if 'subcategory' in q:
                        self.report['benchmarks'][bname]['subcategories'][q['subcategory']] += 1
                    if 'difficulty' in q:
                        self.report['benchmarks'][bname]['difficulties'][q['difficulty']] += 1
                    if 'answer' in q:
                        self.report['benchmarks'][bname]['answers'][q['answer']] += 1
                    if 'protocol' in q:
                        self.report['benchmarks'][bname]['protocols'][q['protocol']] += 1
                    # Estimate prompt length (combine question + options + evidence)
                    prompt_parts = [q.get('question', ''), q.get('evidence', ''), q.get('protocol', '')]
                    for opt in q.get('options', {}).values():
                        prompt_parts.append(opt)
                    total_len += sum(len(p) for p in prompt_parts)
                if len(qs) > 0:
                    self.report['benchmarks'][bname]['avg_prompt_len'] = total_len / len(qs)

    def analyze_evaluation_outputs(self):
        """Parse answer files and compute accuracy."""
        if not self.report['evaluation_files']:
            return
        # For each evaluation file, try to parse answers
        for info in self.report['evaluation_files']:
            path = Path(self.root) / info['path']
            content = safe_read_text(path)
            if content is None:
                continue
            # Try to detect model name from filename
            fname = path.stem.lower()
            model = 'unknown'
            for m in ['chatgpt', 'gpt4', 'claude', 'gemini', 'deepseek']:
                if m in fname:
                    model = m
                    break
            # Parse answers: lines like "HYP-001: A" or "HYP-001 A"
            answers = {}
            for line in content.splitlines():
                line = line.strip()
                if not line:
                    continue
                # Pattern: "HYP-XXX" followed by colon or space and a single letter
                m = re.match(r'(HYP-\d+)\s*[:]?\s*([A-C])', line)
                if m:
                    qid, ans = m.groups()
                    answers[qid] = ans
                else:
                    # Maybe JSON-like format
                    try:
                        data = json.loads(line)
                        if 'id' in data and 'answer' in data:
                            answers[data['id']] = data['answer']
                    except:
                        pass
            self.report['evaluation_results'][model] = {
                'file': info['path'],
                'n_responses': len(answers),
                'answers': answers,
            }

        # Now compute accuracy against ground truth from benchmark JSONs
        # Find hypothesis benchmark
        hyp_bench = None
        for bname, bdata in self.report['benchmarks'].items():
            if 'hypothesis' in bname.lower():
                hyp_bench = bdata
                break
        if not hyp_bench:
            # Try to load from benchmark directory if not parsed yet
            hyp_path = self.root / 'benchmark' / 'ClimateTwinBench_Hypothesis.json'
            if hyp_path.exists():
                try:
                    with open(hyp_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    qs = data.get('questions', [])
                    if qs:
                        hyp_bench = {
                            'questions': qs,
                            'answers': {q['id']: q['answer'] for q in qs if 'id' in q and 'answer' in q}
                        }
                except:
                    pass
        if hyp_bench and 'answers' in hyp_bench:
            ground_truth = hyp_bench['answers']
            for model, eval_data in self.report['evaluation_results'].items():
                preds = eval_data['answers']
                correct = 0
                total = 0
                confusion = {label: {label: 0 for label in ['A','B','C']} for label in ['A','B','C']}
                per_cat = defaultdict(lambda: {'correct': 0, 'total': 0})
                per_diff = defaultdict(lambda: {'correct': 0, 'total': 0})
                for qid, true_ans in ground_truth.items():
                    if qid not in preds:
                        continue
                    pred = preds[qid]
                    total += 1
                    if pred == true_ans:
                        correct += 1
                    if pred in confusion and true_ans in confusion[pred]:
                        confusion[true_ans][pred] += 1
                    # Category and difficulty (from benchmark JSON)
                    # We need to find the question details; we can load the full benchmark again
                # Store results
                eval_data['accuracy'] = correct / total if total > 0 else 0
                eval_data['confusion'] = confusion
                eval_data['total'] = total
                eval_data['correct'] = correct

    def analyze_notebooks(self):
        """Extract summary info from notebooks."""
        for info in self.report['notebooks']:
            path = Path(self.root) / info['path']
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    nb = json.load(f)
                cells = nb.get('cells', [])
                markdown = sum(1 for c in cells if c.get('cell_type') == 'markdown')
                code = sum(1 for c in cells if c.get('cell_type') == 'code')
                info['markdown_cells'] = markdown
                info['code_cells'] = code
            except:
                pass

    def analyze_reproducibility(self):
        """Search for seeds, config files, entry points."""
        seeds = []
        configs = []
        cli = []
        for info in self.report['python_files']:
            path = Path(self.root) / info['path']
            code = safe_read_text(path)
            if code is None:
                continue
            # Search for seed-like assignments
            if re.search(r'\bSEED\s*=|seed\s*=', code) or re.search(r'\brandom\.seed\s*\(', code):
                seeds.append(info['path'])
            if re.search(r'\bif __name__\s*==\s*["\']__main__["\']', code):
                cli.append(info['path'])
        # Config files
        for f in self.report['files']:
            if f['path'].endswith(('.yaml', '.yml', '.json', '.cfg')):
                configs.append(f['path'])
        self.report['reproducibility'] = {
            'seeds': seeds,
            'configs': configs,
            'cli': cli,
        }

    def compile_report(self):
        """Generate the Markdown report."""
        lines = []
        lines.append("# Repository Audit Report\n")
        lines.append(f"Generated: {datetime.datetime.now().isoformat()}\n")
        lines.append(f"Repository root: {self.root}\n")

        # Summary
        lines.append("## Repository Summary\n")
        lines.append(f"* Total files: {len(self.report['files'])}")
        lines.append(f"* Python files: {len(self.report['python_files'])}")
        lines.append(f"* Notebooks: {len(self.report['notebooks'])}")
        lines.append(f"* JSON files: {len(self.report['json_files'])}")
        lines.append(f"* Image files: {len(self.report['image_files'])}")
        lines.append(f"* Evaluation files: {len(self.report['evaluation_files'])}\n")

        # Python analysis
        lines.append("## Python Modules\n")
        lines.append("| File | Lines | Functions | Classes | Notes |")
        lines.append("|------|-------|-----------|---------|-------|")
        for info in self.report['python_files']:
            note = ""
            if info['path'] in self.report['stubs']:
                note = "STUB"
            elif info['path'] in self.report['generators']:
                note = "GENERATOR"
            elif info['path'] in self.report['evaluation_scripts']:
                note = "EVALUATION"
            lines.append(f"| {info['path']} | {info.get('lines',0)} | {info.get('functions',0)} | {info.get('classes',0)} | {note} |")
        lines.append("")

        # Generators
        lines.append("### Benchmark Generators\n")
        if self.report['generators']:
            for g in self.report['generators']:
                lines.append(f"* `{g}`")
        else:
            lines.append("* None detected.")
        lines.append("")

        # Evaluation scripts
        lines.append("### Evaluation Scripts\n")
        if self.report['evaluation_scripts']:
            for e in self.report['evaluation_scripts']:
                lines.append(f"* `{e}`")
        else:
            lines.append("* None detected.")
        lines.append("")

        # Stubs
        lines.append("### Empty Stubs\n")
        if self.report['stubs']:
            for s in self.report['stubs']:
                lines.append(f"* `{s}`")
        else:
            lines.append("* None detected.")
        lines.append("")

        # Benchmark JSON analysis
        lines.append("## Benchmark JSON Analysis\n")
        for bname, bdata in self.report['benchmarks'].items():
            lines.append(f"### {bname}\n")
            lines.append(f"* Path: `{bdata['path']}`")
            lines.append(f"* Questions: {bdata['n_questions']}")
            if bdata['n_questions'] > 0:
                lines.append(f"* Average prompt length (chars): {bdata['avg_prompt_len']:.1f}")
                lines.append("* Categories:")
                for cat, cnt in bdata['categories'].items():
                    lines.append(f"  * {cat}: {cnt}")
                lines.append("* Subcategories:")
                for sub, cnt in bdata['subcategories'].items():
                    lines.append(f"  * {sub}: {cnt}")
                lines.append("* Difficulties:")
                for diff, cnt in bdata['difficulties'].items():
                    lines.append(f"  * {diff}: {cnt}")
                lines.append("* Answers:")
                for ans, cnt in bdata['answers'].items():
                    lines.append(f"  * {ans}: {cnt}")
                if bdata['protocols']:
                    lines.append("* Protocols:")
                    for proto, cnt in bdata['protocols'].items():
                        lines.append(f"  * {proto}: {cnt}")
                lines.append("")
            else:
                lines.append("* No questions found.\n")

        # Evaluation results
        lines.append("## Model Evaluation Results\n")
        if self.report['evaluation_results']:
            for model, res in self.report['evaluation_results'].items():
                lines.append(f"### {model}\n")
                lines.append(f"* File: `{res['file']}`")
                lines.append(f"* Responses: {res['n_responses']}")
                if 'accuracy' in res:
                    lines.append(f"* Accuracy: {res['accuracy']*100:.1f}% ({res['correct']}/{res['total']})")
                    # Confusion matrix
                    if 'confusion' in res:
                        lines.append("* Confusion matrix (true vs predicted):")
                        cm = res['confusion']
                        # Table: true labels rows, pred labels columns
                        lines.append("| True \\ Pred | A | B | C |")
                        lines.append("|-------------|---|---|---|")
                        for true_lab in ['A','B','C']:
                            row = [str(cm[true_lab][pred_lab]) for pred_lab in ['A','B','C']]
                            lines.append(f"| {true_lab} | " + " | ".join(row) + " |")
                        lines.append("")
                else:
                    lines.append("* Accuracy not computed (ground truth missing)")
                lines.append("")
        else:
            lines.append("* No evaluation outputs found.\n")

        # Notebooks
        lines.append("## Notebooks\n")
        if self.report['notebooks']:
            for nb in self.report['notebooks']:
                lines.append(f"* `{nb['path']}`")
                if 'markdown_cells' in nb:
                    lines.append(f"  * Markdown cells: {nb['markdown_cells']}, Code cells: {nb['code_cells']}")
        else:
            lines.append("* None detected.\n")

        # Figures
        lines.append("## Figures\n")
        if self.report['image_files']:
            for img in self.report['image_files']:
                lines.append(f"* `{img['path']}` ({img['size']} bytes)")
        else:
            lines.append("* No figures found.\n")

        # Reproducibility
        lines.append("## Reproducibility Information\n")
        lines.append("* Seeds found in:")
        if self.report['reproducibility']['seeds']:
            for s in self.report['reproducibility']['seeds']:
                lines.append(f"  * `{s}`")
        else:
            lines.append("  * None detected.")
        lines.append("* Config files:")
        if self.report['reproducibility']['configs']:
            for c in self.report['reproducibility']['configs']:
                lines.append(f"  * `{c}`")
        else:
            lines.append("  * None detected.")
        lines.append("* CLI entry points:")
        if self.report['reproducibility']['cli']:
            for c in self.report['reproducibility']['cli']:
                lines.append(f"  * `{c}`")
        else:
            lines.append("  * None detected.")
        lines.append("")

        # Section: FACT, UNSUPPORTED, TODO
        lines.append("## Audit Findings\n")
        lines.append("### FACT (Supported by Repository)\n")
        facts = []
        # From the analysis, list facts
        if any('hypothesis_benchmark_generator.py' in p for p in self.report['generators']):
            facts.append("The Hypothesis benchmark generator (`hypothesis_benchmark_generator.py`) is implemented.")
        if any('domain_reasoning_v2.py' in p for p in self.report['generators']):
            facts.append("The Domain benchmark generator (`domain_reasoning_v2.py`) is implemented.")
        if self.report['benchmarks']:
            facts.append(f"Benchmark JSON files are present: {', '.join(self.report['benchmarks'].keys())}.")
        if self.report['evaluation_files']:
            facts.append(f"Model evaluation outputs exist: {', '.join([e['path'] for e in self.report['evaluation_files']])}.")
        if self.report['reproducibility']['seeds']:
            facts.append("Seed values are used in generation (found in code).")
        # Count if number of questions in hypothesis matches expected 240
        for bname, bdata in self.report['benchmarks'].items():
            if 'hypothesis' in bname.lower():
                facts.append(f"The {bname} benchmark contains {bdata['n_questions']} questions.")
        for f in facts:
            lines.append(f"* {f}")
        if not facts:
            lines.append("* No clear facts detected. (Check repository content.)")
        lines.append("")

        lines.append("### UNSUPPORTED (Claims Not Defended)\n")
        unsupported = []
        if not any('benchmark_generator.py' in p for p in self.report['python_files']) or any('benchmark_generator.py' in p for p in self.report['stubs']):
            unsupported.append("Numerical benchmark generator is missing or empty (claimed in paper).")
        if not self.report['evaluation_scripts']:
            unsupported.append("No evaluation script is present to compute accuracy from outputs.")
        if not any('confusion' in str(e) for e in self.report['evaluation_files']): # not reliable
            unsupported.append("Confusion matrix not computed in current code.")
        if not self.report['image_files']:
            unsupported.append("No publication-ready figures are generated from benchmark results.")
        # Check if public/private split is implemented? We can check if export_public_benchmark.py exists.
        if not any('export_public' in p['path'] for p in self.report['python_files']):
            unsupported.append("Public/private split generation is not clearly implemented.")
        for u in unsupported:
            lines.append(f"* {u}")
        if not unsupported:
            lines.append("* All claims appear supported (or need verification).")
        lines.append("")

        lines.append("### TODO (Required Before Submission)\n")
        todos = []
        if not self.report['evaluation_scripts']:
            todos.append("Implement evaluation script to compute accuracy, confusion matrices, and per-subcategory breakdown.")
        if not self.report['image_files']:
            todos.append("Generate figures (e.g., accuracy bar charts, confusion matrix heatmap, answer distribution) from benchmark data and evaluation results.")
        if not self.report['evaluation_results']:
            todos.append("Run evaluation on multiple models (ChatGPT, Claude, Gemini, DeepSeek) and collect outputs.")
        # Check if numerical benchmark is needed; if not, drop from paper.
        if any('benchmark_generator.py' in p for p in self.report['stubs']):
            todos.append("Either implement Numerical benchmark generator or remove it from the paper.")
        # Check if reproducibility is fully documented
        if not self.report['reproducibility']['configs']:
            todos.append("Add configuration files for reproducibility (seeds, paths, etc.)")
        if not todos:
            todos.append("No critical TODOs identified. (But review the report for completeness.)")
        for t in todos:
            lines.append(f"* {t}")
        lines.append("")

        lines.append("## Paper Readiness Checklist\n")
        checklist = [
            ("Hypothesis benchmark generator", any('hypothesis' in p for p in self.report['generators'])),
            ("Domain benchmark generator", any('domain' in p for p in self.report['generators'])),
            ("Numerical benchmark generator", any('benchmark_generator.py' in p and p not in self.report['stubs'] for p in [f['path'] for f in self.report['python_files']])),
            ("Evaluation script", bool(self.report['evaluation_scripts'])),
            ("Model evaluation results", bool(self.report['evaluation_results'])),
            ("Benchmark statistics", bool(self.report['benchmarks'])),
            ("Figures", bool(self.report['image_files'])),
            ("Public/private split", any('public' in p for p in self.report['json_files'])),
            ("Reproducibility (seeds, configs)", bool(self.report['reproducibility']['seeds'])),
        ]
        lines.append("| Item | Status |")
        lines.append("|------|--------|")
        for item, status in checklist:
            status_str = "✅" if status else "❌"
            lines.append(f"| {item} | {status_str} |")
        lines.append("")

        lines.append("---")
        lines.append("*This report is automatically generated. Please verify manually for completeness.*")

        # Write to file
        report_path = Path.cwd() / 'repository_audit.md'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        print(f"Audit report written to {report_path}")

# ============================================================================
# Main
# ============================================================================

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    audit = RepositoryAudit(root)
    audit.run()