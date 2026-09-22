"""
ClimateTwinBench — Domain Reasoning Benchmark v2
=================================================
STRICT CONSTRAINT: Every answer is derivable programmatically from
dataset values alone. Ground truth is computed, never assumed.

PERMITTED SOURCES:
  anomaly_score, rainfall_mm, risk_tier_schema (defined below),
  national_yearly_stats (mean_anomaly, mean_rainfall, mean_temp,
  max_abs_anomaly per year), computed means/percentiles/ranks.

PROHIBITED (removed from v1):
  ✗ CAT 2  — option B said "notable monsoon deviation"
  ✗ CAT 4  — correct answer invoked "adaptive reserves" (ecology theory)
  ✗ CAT 5  — compared "real-world hydrological impact" (external hydrology)
  ✗ CAT 6 Q2 — monsoon cloud suppression of daytime heating
  ✗ CAT 6 Q3 — "most uniformly deficient monsoon"
  ✗ CAT 6 Q4 — Paris Agreement 1.5°C / pre-industrial 29.5°C baseline
  ✗ CAT 6 Q7 — "IMD gridding algorithm" artefact

50 questions / 7 subcategories
Run: python3 climatetwinbench_domain_v2.py
     (requires /mnt/user-data/uploads/benchmark.json)
"""

import json, random, re, numpy as np
from collections import Counter

# ─── serialisation helper ──────────────────────────────────────────────────
def to_py(obj):
    if isinstance(obj, dict):        return {k: to_py(v) for k, v in obj.items()}
    if isinstance(obj, list):        return [to_py(v) for v in obj]
    if isinstance(obj, np.integer):  return int(obj)
    if isinstance(obj, np.floating): return float(obj)
    if isinstance(obj, np.bool_):    return bool(obj)
    return obj

# ─── risk schema (defined BY the dataset; no external knowledge) ───────────
def risk_label(a):
    a = abs(a)
    return 'EXTREME' if a >= 10 else 'HIGH' if a >= 5 else 'MODERATE' if a >= 2 else 'LOW'

def risk_rank(l):  return {'LOW': 0, 'MODERATE': 1, 'HIGH': 2, 'EXTREME': 3}[l]
RISK_LABELS = ['LOW', 'MODERATE', 'HIGH', 'EXTREME']
SCHEMA_STR  = "LOW:|a|<2.00 | MODERATE:2.00≤|a|<5.00 | HIGH:5.00≤|a|<10.00 | EXTREME:|a|≥10.00"

# ─── option-shuffling: correct answer placed at a random position ──────────
def make_opts(correct_text, distractors, seed):
    """Return (opts_dict, answer_letter). Correct text placed randomly."""
    pool = [correct_text] + list(distractors[:3])
    random.Random(int(seed) & 0xFFFFFFFF).shuffle(pool)
    opts = dict(zip('ABCD', pool))
    ans  = next(k for k, v in opts.items() if v == correct_text)
    return opts, ans

# ─── ensure 3 unique distractors ──────────────────────────────────────────
def pad_distractors(wrong_list, correct, universe, seed):
    seen = set(wrong_list) | {correct}
    rng  = random.Random(int(seed) & 0xFFFFFFFF)
    pool = [str(x) for x in universe if str(x) not in seen]
    rng.shuffle(pool)
    out  = list(wrong_list)
    for x in pool:
        if len(out) >= 3: break
        out.append(x)
    return out[:3]

# ─── load data ─────────────────────────────────────────────────────────────
with open("../benchmark/benchmark.json", "r") as f:
    bench = json.load(f)

YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
ysr   = bench['statistics']['yearly_stats']
IA    = {int(y): s['mean_anomaly']    for y, s in ysr.items()}
IR    = {int(y): s['mean_rainfall']   for y, s in ysr.items()}
IT    = {int(y): s['mean_temp']       for y, s in ysr.items()}
IMA   = {int(y): s['max_abs_anomaly'] for y, s in ysr.items()}

cell_series = {}
for q in bench['questions']:
    ctx = q.get('context', {})
    lat, lon = ctx.get('latitude'), ctx.get('longitude')
    if lat and lon and 'rainfall_mm' in ctx and 'anomaly_score' in ctx:
        key = (round(lat, 2), round(lon, 2))
        if key not in cell_series:
            cell_series[key] = {
                'rainfall_mm':   ctx['rainfall_mm'],
                'anomaly_score': ctx['anomaly_score'],
            }

cells    = list(cell_series.items())
all_anom = np.array([a for s in cell_series.values() for a in s['anomaly_score']])
all_abs  = np.abs(all_anom)
p75, p95, p99 = np.percentile(all_abs, [75, 95, 99])

india_summary = '\n'.join(
    f"  {y}: mean_anomaly={IA[y]:+.4f}, mean_rainfall={IR[y]:.4f} mm/day,"
    f" mean_max_temp={IT[y]:.3f}°C, max_|anomaly|={IMA[y]:.3f}"
    for y in YEARS
)

qs = []; ctr = [0]
def nid():
    ctr[0] += 1
    return f'DR2-{ctr[0]:03d}'

# ══════════════════════════════════════════════════════════════════════════════
# A │ RISK TIER CLASSIFICATION │ 8 questions │ easy
#
# Ground truth  : risk_label(anomaly_score) — schema thresholds defined above.
# Distractors   : the 3 other tier labels (all shown with exact boundaries).
# What's tested : correct application of a numerical schema — no external facts.
# ══════════════════════════════════════════════════════════════════════════════
TIER_OPT_TEXT = {
    'LOW':      'LOW      — |anomaly_score| < 2.00',
    'MODERATE': 'MODERATE — 2.00 ≤ |anomaly_score| < 5.00',
    'HIGH':     'HIGH     — 5.00 ≤ |anomaly_score| < 10.00',
    'EXTREME':  'EXTREME  — |anomaly_score| ≥ 10.00',
}

tier_picks = {t: [] for t in RISK_LABELS}
for key, s in cells:
    for i, a in enumerate(s['anomaly_score']):
        t = risk_label(a)
        if len(tier_picks[t]) < 2:
            tier_picks[t].append((key, YEARS[i], a, s))
    if all(len(v) >= 2 for v in tier_picks.values()):
        break

for true_tier in RISK_LABELS:
    for (lat, lon), yr, a_val, s in tier_picks[true_tier]:
        anom_str = ', '.join(f'{y}:{a:+.3f}' for y, a in zip(YEARS, s['anomaly_score']))
        correct  = TIER_OPT_TEXT[true_tier]
        wrong    = [TIER_OPT_TEXT[t] for t in RISK_LABELS if t != true_tier]
        opts, ans = make_opts(correct, wrong, hash((lat, lon, yr, 'A')))
        qs.append(to_py({
            'id': nid(), 'category': 'domain_reasoning',
            'subcategory': 'risk_tier_classification', 'difficulty': 'easy',
            'question': (
                f"Risk tier schema (defined by this dataset):\n  {SCHEMA_STR}\n\n"
                f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025:\n  {anom_str}\n\n"
                f"In {yr} the cell's anomaly_score was {a_val:+.3f}.\n\n"
                f"Which risk tier applies?"
            ),
            'options': opts, 'answer': ans,
            'explanation': f'|{a_val:.3f}| = {abs(a_val):.3f}. Schema → {true_tier}.',
            'context': {
                'latitude': lat, 'longitude': lon, 'years': YEARS,
                'anomaly_score': s['anomaly_score'],
                'target_year': yr, 'target_anomaly': float(a_val),
                'true_tier': true_tier,
            }
        }))
print(f"Cat A done: {len(qs)}")


# ══════════════════════════════════════════════════════════════════════════════
# B │ CELL–NATIONAL SIGNAL DIVERGENCE │ 10 questions │ hard
#
# Ground truth  : sign(cell_anomaly) × sign(national_mean_anomaly) → 4 labels.
# Labels defined ENTIRELY in the question stem — zero external knowledge needed.
# Distractors   : the 3 other compound labels (all printed with definitions).
# What's tested : reading signs of two provided numbers and mapping to label.
# ══════════════════════════════════════════════════════════════════════════════
DIV_LABELS = {
    'SD':  'Systemic Dry       — cell anomaly NEGATIVE AND national mean NEGATIVE',
    'LWD': 'Localised Wet/Dry  — cell anomaly POSITIVE,   national mean NEGATIVE',
    'SW':  'Systemic Wet       — cell anomaly POSITIVE AND national mean POSITIVE',
    'LDW': 'Localised Dry/Wet  — cell anomaly NEGATIVE,   national mean POSITIVE',
}
def div_key(ca, na):
    return {(True, True): 'SW', (True, False): 'LWD',
            (False, False): 'SD', (False, True): 'LDW'}[(ca > 0, na > 0)]

high_var = sorted(cells, key=lambda x: np.var(x[1]['anomaly_score']), reverse=True)
for (lat, lon), s in high_var[:10]:
    anom   = s['anomaly_score']
    idx    = int(np.argmax(np.abs(anom)))
    yr     = YEARS[idx]
    cell_a = float(anom[idx])
    nat_a  = float(IA[yr])
    dkey   = div_key(cell_a, nat_a)
    anom_str = ', '.join(f'{y}:{a:+.3f}' for y, a in zip(YEARS, anom))
    ia_str   = ', '.join(f'{y}:{v:+.4f}' for y, v in IA.items())
    correct  = DIV_LABELS[dkey]
    wrong    = [DIV_LABELS[k] for k in DIV_LABELS if k != dkey]
    opts, ans = make_opts(correct, wrong, hash((lat, lon, yr, 'B')))
    qs.append(to_py({
        'id': nid(), 'category': 'domain_reasoning',
        'subcategory': 'cell_national_divergence', 'difficulty': 'hard',
        'question': (
            f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025:\n  {anom_str}\n\n"
            f"India-wide mean anomaly_score 2019–2025:\n  {ia_str}\n\n"
            f"In {yr} (this cell's peak |anomaly| year):\n"
            f"  Cell anomaly_score    = {cell_a:+.3f}\n"
            f"  National mean anomaly = {nat_a:+.4f}\n\n"
            f"Four compound signal labels are defined as follows:\n"
            f"  Systemic Dry      : both cell AND national mean negative\n"
            f"  Localised Wet/Dry : cell POSITIVE, national mean NEGATIVE\n"
            f"  Systemic Wet      : both cell AND national mean positive\n"
            f"  Localised Dry/Wet : cell NEGATIVE, national mean POSITIVE\n\n"
            f"Which label applies to this cell's {yr} event?"
        ),
        'options': opts, 'answer': ans,
        'explanation': (
            f"Cell {cell_a:+.3f} ({'pos' if cell_a > 0 else 'neg'}), "
            f"National {nat_a:+.4f} ({'pos' if nat_a > 0 else 'neg'}). "
            f"→ {dkey}: {DIV_LABELS[dkey]}."
        ),
        'context': {
            'latitude': lat, 'longitude': lon, 'years': YEARS,
            'anomaly_score': anom, 'target_year': yr,
            'cell_anomaly': cell_a, 'national_anomaly': nat_a,
        }
    }))
print(f"Cat B done: {len(qs)}")


# ══════════════════════════════════════════════════════════════════════════════
# C │ PEAK / VALLEY / MAX-CHANGE YEAR │ 8 questions │ medium
#
# Ground truth  : argmax or argmin of a fully-printed numerical series.
# Distractors   : 2nd, 3rd, 4th in the same ranking (plausible near-misses).
# Sub-types     : max |anomaly| (×2) | min |anomaly| (×2) |
#                 max rainfall (×2) | largest |Δanomaly| transition (×2).
# ══════════════════════════════════════════════════════════════════════════════
step = max(1, len(cells) // 8)
c_cells = [cells[i * step] for i in range(8)]

for i, ((lat, lon), s) in enumerate(c_cells):
    anom = np.array(s['anomaly_score'])
    rain = np.array(s['rainfall_mm'])
    anom_str = ', '.join(f'{y}:{a:+.3f}' for y, a in zip(YEARS, anom))
    rain_str = ', '.join(f'{y}:{r:.2f}'  for y, r in zip(YEARS, rain))

    if i < 2:       # C1: year of max |anomaly|
        order   = [YEARS[j] for j in np.argsort(np.abs(anom))[::-1]]
        correct = str(order[0]); wrong = [str(y) for y in order[1:4]]
        opts, ans = make_opts(correct, wrong, hash((lat, lon, 'C1')))
        body = (f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025:\n  {anom_str}\n\n"
                f"In which year did this cell record its HIGHEST |anomaly_score|?")
        expl = (f"|anomaly| by year: {', '.join(f'{y}:{abs(a):.3f}' for y,a in zip(YEARS,anom))}. "
                f"Maximum {float(np.max(np.abs(anom))):.3f} in {order[0]}.")

    elif i < 4:     # C2: year of min |anomaly|
        order   = [YEARS[j] for j in np.argsort(np.abs(anom))]
        correct = str(order[0]); wrong = [str(y) for y in order[1:4]]
        opts, ans = make_opts(correct, wrong, hash((lat, lon, 'C2')))
        body = (f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025:\n  {anom_str}\n\n"
                f"In which year was this cell's |anomaly_score| at its LOWEST?")
        expl = (f"|anomaly| by year: {', '.join(f'{y}:{abs(a):.3f}' for y,a in zip(YEARS,anom))}. "
                f"Minimum {float(np.min(np.abs(anom))):.3f} in {order[0]}.")

    elif i < 6:     # C3: year of highest rainfall
        order   = [YEARS[j] for j in np.argsort(rain)[::-1]]
        correct = str(order[0]); wrong = [str(y) for y in order[1:4]]
        opts, ans = make_opts(correct, wrong, hash((lat, lon, 'C3')))
        body = (f"Cell ({lat:.2f}°N, {lon:.2f}°E) — rainfall_mm 2019–2025:\n  {rain_str}\n\n"
                f"In which year did this cell receive the HIGHEST rainfall?")
        expl = (f"Rainfall by year: {rain_str}. "
                f"Maximum {float(rain.max()):.2f} mm in {order[0]}.")

    else:           # C4: transition with largest |Δanomaly|
        diffs  = np.abs(np.diff(anom))
        order  = [f'{YEARS[j]}→{YEARS[j+1]}' for j in np.argsort(diffs)[::-1]]
        correct = order[0]; wrong = order[1:4]
        opts, ans = make_opts(correct, wrong, hash((lat, lon, 'C4')))
        diff_str = ', '.join(f'{YEARS[j]}→{YEARS[j+1]}:{diffs[j]:.3f}' for j in range(len(diffs)))
        body = (f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025:\n  {anom_str}\n\n"
                f"Which year-to-year TRANSITION showed the LARGEST absolute change in anomaly_score?")
        expl = f"|Δanomaly| by transition: {diff_str}. Largest: {order[0]}."

    qs.append(to_py({
        'id': nid(), 'category': 'domain_reasoning',
        'subcategory': 'peak_valley_identification', 'difficulty': 'medium',
        'question': body, 'options': opts, 'answer': ans, 'explanation': expl,
        'context': {
            'latitude': lat, 'longitude': lon, 'years': YEARS,
            'anomaly_score': s['anomaly_score'], 'rainfall_mm': s['rainfall_mm'],
        }
    }))
print(f"Cat C done: {len(qs)}")


# ══════════════════════════════════════════════════════════════════════════════
# D │ RISK ESCALATION COUNTING │ 7 questions │ hard
#
# Ground truth  : count of year-to-year transitions where risk_rank increases.
# Distractors   : de-escalation count | total tier-changes | HIGH/EXTREME count.
#   → each distractor represents a distinct cognitive error:
#     ✗ counted descents instead of climbs
#     ✗ counted all changes (both directions)
#     ✗ counted years-at-risk instead of transitions
# ══════════════════════════════════════════════════════════════════════════════
d_cells = sorted(cells, key=lambda x: np.var(x[1]['anomaly_score']), reverse=True)[10:17]

for (lat, lon), s in d_cells:
    anom  = s['anomaly_score']
    tiers = [risk_label(a) for a in anom]
    ranks = [risk_rank(t) for t in tiers]

    n_esc  = sum(1 for i in range(6) if ranks[i+1] > ranks[i])   # correct answer
    n_dsc  = sum(1 for i in range(6) if ranks[i+1] < ranks[i])   # distractor: direction error
    n_chg  = n_esc + n_dsc                                         # distractor: bidirectional
    n_high = sum(1 for t in tiers if t in ('HIGH', 'EXTREME'))    # distractor: years-at-risk

    trace = ', '.join(
        f'{YEARS[i]}→{YEARS[i+1]}:'
        f'{"↑ESC" if ranks[i+1]>ranks[i] else "↓DSC" if ranks[i+1]<ranks[i] else "─"}'
        for i in range(6)
    )
    anom_str  = ', '.join(f'{y}:{a:+.3f}' for y, a in zip(YEARS, anom))
    tiers_str = ', '.join(f'{y}:{t}'       for y, t in zip(YEARS, tiers))
    correct   = str(n_esc)
    wrong     = list(dict.fromkeys(str(x) for x in [n_dsc, n_chg, n_high] if str(x) != correct))
    wrong     = pad_distractors(wrong, correct, range(7), hash((lat, lon, 'D')))
    opts, ans = make_opts(correct, wrong, hash((lat, lon, 'D2')))
    qs.append(to_py({
        'id': nid(), 'category': 'domain_reasoning',
        'subcategory': 'risk_escalation_counting', 'difficulty': 'hard',
        'question': (
            f"Risk tier schema: {SCHEMA_STR}\n"
            f"An ESCALATION is a transition where risk tier rank strictly increases\n"
            f"(e.g. LOW→MODERATE, MODERATE→HIGH, HIGH→EXTREME, or LOW→HIGH).\n\n"
            f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025:\n  {anom_str}\n\n"
            f"Applying the schema yields:\n  {tiers_str}\n\n"
            f"How many ESCALATIONS occurred across the 6 consecutive year-to-year transitions?"
        ),
        'options': opts, 'answer': ans,
        'explanation': (
            f"Transitions: {trace}.\n"
            f"↑Escalations={n_esc}, ↓De-escalations={n_dsc}, "
            f"Total changes={n_chg}, Years at HIGH/EXTREME={n_high}. Correct: {n_esc}."
        ),
        'context': {
            'latitude': lat, 'longitude': lon, 'years': YEARS,
            'anomaly_score': anom, 'risk_tiers': tiers,
            'escalation_count': n_esc, 'de_escalation_count': n_dsc,
        }
    }))
print(f"Cat D done: {len(qs)}")


# ══════════════════════════════════════════════════════════════════════════════
# E │ SIGN CONSISTENCY COUNT │ 7 questions │ hard
#
# Ground truth  : count of years where sign(cell_anomaly) == sign(national_mean).
# Distractors   : 7−agreements (complement) | years cell positive | years nat positive.
#   → each distractor is a real and plausible computation on the same data,
#     just answering a different (wrong) question.
# ══════════════════════════════════════════════════════════════════════════════
ia_pos = {y: IA[y] > 0 for y in YEARS}
e_cells = sorted(cells, key=lambda x: np.var(x[1]['anomaly_score']), reverse=True)[17:24]

for (lat, lon), s in e_cells:
    anom     = s['anomaly_score']
    cell_pos = [a > 0 for a in anom]
    nat_pos  = [ia_pos[y] for y in YEARS]

    n_agree    = sum(c == n for c, n in zip(cell_pos, nat_pos))   # correct
    n_disagree = 7 - n_agree                                        # distractor: complement
    n_c_pos    = sum(cell_pos)                                      # distractor: cell-only
    n_n_pos    = sum(nat_pos)                                       # distractor: national-only

    year_trace = ', '.join(
        f'{y}:{("AGREE" if c==n else "DIFF")}'
        for y, c, n in zip(YEARS, cell_pos, nat_pos)
    )
    anom_str = ', '.join(
        f'{y}:{a:+.3f}({"+" if a>0 else "−"})' for y, a in zip(YEARS, anom)
    )
    nat_str = ', '.join(
        f'{y}:{IA[y]:+.4f}({"+" if IA[y]>0 else "−"})' for y in YEARS
    )
    correct = str(n_agree)
    wrong   = list(dict.fromkeys(str(x) for x in [n_disagree, n_c_pos, n_n_pos] if str(x) != correct))
    wrong   = pad_distractors(wrong, correct, range(8), hash((lat, lon, 'E')))
    opts, ans = make_opts(correct, wrong, hash((lat, lon, 'E2')))
    qs.append(to_py({
        'id': nid(), 'category': 'domain_reasoning',
        'subcategory': 'sign_consistency_count', 'difficulty': 'hard',
        'question': (
            f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score 2019–2025 (sign in parentheses):\n"
            f"  {anom_str}\n\n"
            f"India-wide mean anomaly_score 2019–2025 (sign in parentheses):\n"
            f"  {nat_str}\n\n"
            f"In how many of the 7 years did the cell anomaly sign AGREE with the national mean sign\n"
            f"(both positive OR both negative)?"
        ),
        'options': opts, 'answer': ans,
        'explanation': (
            f"Year-by-year: {year_trace}.\n"
            f"Agreements={n_agree}, Disagreements={n_disagree}, "
            f"Cell-positive years={n_c_pos}, National-positive years={n_n_pos}."
        ),
        'context': {
            'latitude': lat, 'longitude': lon, 'years': YEARS,
            'anomaly_score': anom, 'agreement_count': n_agree,
        }
    }))
print(f"Cat E done: {len(qs)}")


# ══════════════════════════════════════════════════════════════════════════════
# F │ NATIONAL STATISTICS ORDERING │ 6 questions │ medium–hard
#
# Ground truth  : argmax / argmin / argmax-delta over national yearly arrays.
# Distractors   : 2nd, 3rd, 4th in same ranking.
# What's tested : reading and comparing a table of 7 printed values correctly.
# ══════════════════════════════════════════════════════════════════════════════
def nat_rank_q(arr, direction, label, seed_tag):
    """Return (opts, ans, winner_str, explain_str)."""
    sorted_idxs = np.argsort(arr)[::-1] if direction == 'max' else np.argsort(arr)
    order   = [str(YEARS[j]) for j in sorted_idxs]
    vals    = [arr[j]        for j in sorted_idxs]
    opts, ans = make_opts(order[0], order[1:4], hash(('F', label, seed_tag)))
    ranked  = ', '.join(f'{y}:{v:.4f}' for y, v in zip(order, vals))
    return opts, ans, order[0], f"{label} ranked ({direction}): {ranked}."

ia_arr  = np.array([IA[y]  for y in YEARS])
ir_arr  = np.array([IR[y]  for y in YEARS])
it_arr  = np.array([IT[y]  for y in YEARS])
ima_arr = np.array([IMA[y] for y in YEARS])

# F1: highest national mean_anomaly
opts, ans, top, expl = nat_rank_q(ia_arr, 'max', 'mean_anomaly', 'F1')
qs.append(to_py({'id': nid(), 'category': 'domain_reasoning',
    'subcategory': 'national_statistics_ordering', 'difficulty': 'medium',
    'question': f"India-wide yearly statistics 2019–2025:\n{india_summary}\n\n"
                f"Which year had the HIGHEST India-wide mean_anomaly_score?",
    'options': opts, 'answer': ans, 'explanation': expl,
    'context': {'yearly_stats': {str(y): ysr[str(y)] for y in YEARS}}}))

# F2: lowest national mean_anomaly
opts, ans, top, expl = nat_rank_q(ia_arr, 'min', 'mean_anomaly', 'F2')
qs.append(to_py({'id': nid(), 'category': 'domain_reasoning',
    'subcategory': 'national_statistics_ordering', 'difficulty': 'medium',
    'question': f"India-wide yearly statistics 2019–2025:\n{india_summary}\n\n"
                f"Which year had the LOWEST India-wide mean_anomaly_score?",
    'options': opts, 'answer': ans, 'explanation': expl,
    'context': {'yearly_stats': {str(y): ysr[str(y)] for y in YEARS}}}))

# F3: highest national mean_rainfall
opts, ans, top, expl = nat_rank_q(ir_arr, 'max', 'mean_rainfall', 'F3')
qs.append(to_py({'id': nid(), 'category': 'domain_reasoning',
    'subcategory': 'national_statistics_ordering', 'difficulty': 'medium',
    'question': f"India-wide yearly statistics 2019–2025:\n{india_summary}\n\n"
                f"Which year had the HIGHEST India-wide mean_rainfall (mm/day)?",
    'options': opts, 'answer': ans, 'explanation': expl,
    'context': {'yearly_stats': {str(y): ysr[str(y)] for y in YEARS}}}))

# F4: year containing the nationally-highest single-cell |anomaly|
opts, ans, top, expl = nat_rank_q(ima_arr, 'max', 'max_|anomaly|', 'F4')
qs.append(to_py({'id': nid(), 'category': 'domain_reasoning',
    'subcategory': 'national_statistics_ordering', 'difficulty': 'medium',
    'question': f"India-wide yearly statistics 2019–2025:\n{india_summary}\n\n"
                f"Which year contained the grid cell with the highest single-cell |anomaly_score| nationally?",
    'options': opts, 'answer': ans, 'explanation': expl,
    'context': {'yearly_stats': {str(y): ysr[str(y)] for y in YEARS}}}))

# F5: lowest national mean_max_temp
opts, ans, top, expl = nat_rank_q(it_arr, 'min', 'mean_max_temp', 'F5')
qs.append(to_py({'id': nid(), 'category': 'domain_reasoning',
    'subcategory': 'national_statistics_ordering', 'difficulty': 'medium',
    'question': f"India-wide yearly statistics 2019–2025:\n{india_summary}\n\n"
                f"Which year had the LOWEST India-wide mean_max_temperature?",
    'options': opts, 'answer': ans, 'explanation': expl,
    'context': {'yearly_stats': {str(y): ysr[str(y)] for y in YEARS}}}))

# F6: transition with largest positive Δ in national mean_anomaly
deltas      = [IA[YEARS[i+1]] - IA[YEARS[i]] for i in range(6)]
pair_labels = [f'{YEARS[i]}→{YEARS[i+1]}'    for i in range(6)]
order       = [pair_labels[j] for j in np.argsort(deltas)[::-1]]
opts, ans   = make_opts(order[0], order[1:4], hash(('F', 'delta', 'F6')))
delta_trace = ', '.join(f'{p}:{d:+.4f}' for p, d in zip(pair_labels, deltas))
qs.append(to_py({'id': nid(), 'category': 'domain_reasoning',
    'subcategory': 'national_statistics_ordering', 'difficulty': 'hard',
    'question': (
        f"India-wide mean_anomaly_score 2019–2025:\n"
        f"  {', '.join(f'{y}:{IA[y]:+.4f}' for y in YEARS)}\n\n"
        f"Which year-to-year TRANSITION showed the largest POSITIVE change\n"
        f"(Δ = value_later_year − value_earlier_year) in national mean_anomaly?"
    ),
    'options': opts, 'answer': ans,
    'explanation': f"Δ by transition: {delta_trace}. Largest positive Δ at {order[0]}.",
    'context': {'yearly_stats': {str(y): ysr[str(y)] for y in YEARS}}}))
print(f"Cat F done: {len(qs)}")


# ══════════════════════════════════════════════════════════════════════════════
# G │ CONSECUTIVE HIGH/EXTREME RUN │ 4 questions │ hard
#
# Ground truth  : length of longest unbroken sequence of years where |anomaly|≥5.
# Distractors   : total HIGH/EXTREME years (non-consecutive count — wrong aggregation)
#               | longest run including MODERATE (wrong threshold)
#               | second-longest consecutive run (off-by-one / different window).
# ══════════════════════════════════════════════════════════════════════════════
def run_stats(flags):
    """Returns (longest_run, second_longest_run)."""
    runs = []; cur = 0
    for f in flags:
        if f:  cur += 1
        elif cur > 0: runs.append(cur); cur = 0
    if cur > 0: runs.append(cur)
    runs.sort(reverse=True)
    return (runs[0] if runs else 0), (runs[1] if len(runs) > 1 else 0)

g_cells = sorted(cells, key=lambda x: np.var(x[1]['anomaly_score']), reverse=True)[24:28]

for (lat, lon), s in g_cells:
    anom   = s['anomaly_score']
    tiers  = [risk_label(a) for a in anom]
    he_flags  = [t in ('HIGH','EXTREME')             for t in tiers]
    hme_flags = [t in ('MODERATE','HIGH','EXTREME')  for t in tiers]

    n_he              = sum(he_flags)
    run_he, sec_he    = run_stats(he_flags)
    run_hme, _        = run_stats(hme_flags)

    anom_str  = ', '.join(f'{y}:{a:+.3f}({risk_label(a)})' for y, a in zip(YEARS, anom))
    flag_str  = ', '.join(f'{y}:{"HIGH+" if h else "—"}'   for y, h in zip(YEARS, he_flags))

    correct = str(run_he)
    wrong   = list(dict.fromkeys(str(x) for x in [n_he, run_hme, sec_he] if str(x) != correct))
    wrong   = pad_distractors(wrong, correct, range(8), hash((lat, lon, 'G')))
    opts, ans = make_opts(correct, wrong, hash((lat, lon, 'G2')))
    qs.append(to_py({
        'id': nid(), 'category': 'domain_reasoning',
        'subcategory': 'consecutive_extreme_run', 'difficulty': 'hard',
        'question': (
            f"Risk tier schema: {SCHEMA_STR}\n\n"
            f"Cell ({lat:.2f}°N, {lon:.2f}°E) — anomaly_score with risk labels (2019–2025):\n"
            f"  {anom_str}\n\n"
            f"What is the length of the LONGEST CONSECUTIVE RUN of years\n"
            f"classified as HIGH or EXTREME (|anomaly| ≥ 5.00)?"
        ),
        'options': opts, 'answer': ans,
        'explanation': (
            f"HIGH/EXTREME flags: {flag_str}.\n"
            f"Longest consecutive run = {run_he}. "
            f"(Total HIGH/EXTREME years = {n_he}; "
            f"longest run including MODERATE = {run_hme}; "
            f"second-longest HIGH/EXTREME run = {sec_he}.)"
        ),
        'context': {
            'latitude': lat, 'longitude': lon, 'years': YEARS,
            'anomaly_score': anom, 'risk_tiers': tiers,
            'max_consecutive_high_extreme_run': run_he,
        }
    }))
print(f"Cat G done: {len(qs)}")


# ─── automated constraint validation ──────────────────────────────────────────
FORBIDDEN = [
    r'paris agreement', r'1\.5.c', r'pre.industrial', r'29\.5.c',
    r'imd gridding', r'gridding algorithm', r'cloud suppression',
    r'monsoon suppress', r'monsoon cloud', r'adaptive reserve',
    r'el ni.o', r'la ni.a', r'enso', r'evapotranspir',
    r'hydrological impact', r'water budget',
]
violations = []
for q in qs:
    body = (q['question'] + ' '
            + ' '.join(q['options'].values()) + ' '
            + q['explanation']).lower()
    for pattern in FORBIDDEN:
        if re.search(pattern, body):
            violations.append((q['id'], pattern))

# ─── final stats ──────────────────────────────────────────────────────────────
total   = len(qs)
by_sub  = Counter(q['subcategory'] for q in qs)
by_diff = Counter(q['difficulty']  for q in qs)
by_ans  = Counter(q['answer']      for q in qs)

print(f"\n{'='*64}")
print(f"TOTAL: {total} questions")
print("\nBy subcategory:")
for sub, n in by_sub.most_common(): print(f"  {sub}: {n}")
print("\nBy difficulty:")
for d, n in by_diff.most_common():  print(f"  {d}: {n}")
print("\nAnswer distribution:")
for a, n in sorted(by_ans.items()): print(f"  {a}: {n} ({n/total*100:.1f}%)")

if violations:
    print(f"\n⚠  CONSTRAINT VIOLATIONS FOUND ({len(violations)}):")
    for qid, pat in violations: print(f"  {qid}: matched /{pat}/")
else:
    print(f"\n✓  All {total} questions pass strict constraint validation.")

# ─── save ─────────────────────────────────────────────────────────────────────
output = {
    'name': 'ClimateTwinBench_DomainReasoning_v2',
    'version': '2.0',
    'constraint': (
        'STRICT: Every answer derivable programmatically from dataset values alone. '
        'No external climate knowledge. No monsoon assumptions. No Paris thresholds. '
        'No pre-industrial baselines. No algorithm references. '
        'Ground truth sources: anomaly_score, rainfall_mm, '
        'risk_tier_schema (defined in code), national_yearly_stats.'
    ),
    'n_questions': total,
    'subcategories': dict(by_sub),
    'violation_count': len(violations),
    'questions': qs,
}
with open("../benchmark/ClimateTwinBench_Domain.json", "w") as f:
    json.dump(output, f, indent=2)
print(f"\nSaved → ../benchmark/ClimateTwinBench_Domain.json")