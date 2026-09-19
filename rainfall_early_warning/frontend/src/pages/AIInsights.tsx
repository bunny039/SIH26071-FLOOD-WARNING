import { useState } from 'react'
import { BrainCircuit, ChevronDown, Eye, GitBranch, Radar, ShieldAlert, Sparkles, Target } from 'lucide-react'

const steps = [
  { key: 'OBSERVE', icon: Eye, title: 'Collect the signals', detail: 'IMD, ERA5, GPM, GFS and RADAR provide observations, atmospheric context, satellite rainfall and short-term precipitation structure.' },
  { key: 'UNDERSTAND', icon: GitBranch, title: 'Align the evidence', detail: 'The pipeline preprocesses and aligns spatial information, temporal information and weather variables before inference.' },
  { key: 'PREDICT', icon: Target, title: 'Estimate rainfall', detail: 'AI models estimate rainfall, heavy rainfall probability and peak intensity across the forecast horizon.' },
  { key: 'ASSESS', icon: ShieldAlert, title: 'Score inundation', detail: 'Predicted rainfall is combined with elevation, terrain and historical flood patterns to identify exposed areas.' },
  { key: 'WARN', icon: Radar, title: 'Make risk actionable', detail: 'The system produces risk levels, risk maps, affected zones and early warnings for decision makers.' },
] as const

const signals = [
  ['IMD', 'Observed weather conditions'],
  ['ERA5', 'Atmospheric and reanalysis context'],
  ['GPM', 'Satellite precipitation coverage'],
  ['GFS', 'Numerical weather prediction'],
  ['RADAR', 'Short-term precipitation structure'],
]

const technologies = ['Machine Learning', 'Deep Learning', 'Geospatial Analysis', 'Satellite Data', 'Weather Radar', 'Numerical Weather Prediction']

export function AIInsightsPage() {
  const [open, setOpen] = useState('OBSERVE')
  return <div className="flex flex-col gap-6">
    <header><p className="eyebrow">Explain · Responsible intelligence</p><h1 className="page-title mt-2">How AquaSentinel Thinks</h1><p className="page-subtitle">A transparent view of the Observe → Understand → Predict → Assess → Warn process.</p></header>
    <section className="glass-panel"><div className="panel-head"><div><h2 className="panel-title flex items-center gap-2"><BrainCircuit size={15} className="text-accent" />The reasoning pipeline</h2><p className="panel-kicker">Each stage contributes evidence a non-technical operator can inspect.</p></div><span className="badge"><span className="status-dot is-accent" />Explainable flow</span></div><div className="panel-body grid gap-2">{steps.map(({ key, icon: Icon, title, detail }, index) => <div key={key}><button type="button" className="flex w-full items-center gap-4 rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-4 text-left transition hover:border-line-strong" onClick={() => setOpen(open === key ? '' : key)} aria-expanded={open === key}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="block text-[0.66rem] font-bold tracking-[0.18em] text-accent">{String(index + 1).padStart(2, '0')} · {key}</span><span className="mt-1 block font-bold text-ink">{title}</span></span><ChevronDown size={17} className={open === key ? 'rotate-180 text-accent' : 'text-ink-3'} /></button>{open === key && <div className="ml-16 border-l border-accent/30 px-4 py-3 text-sm leading-relaxed text-ink-2">{detail}</div>}</div>)}</div></section>
    <section className="grid gap-5 xl:grid-cols-2"><div className="glass-panel"><div className="panel-head"><div><h2 className="panel-title">Signals it can inspect</h2><p className="panel-kicker">The evidence families represented in the current demonstration.</p></div></div><div className="panel-body grid gap-2">{signals.map(([code, detail]) => <div key={code} className="flex items-center gap-3 rounded-lg border border-line-subtle bg-surface-1/40 px-3 py-3"><span className="source-tag border-accent/30 bg-accent/10 text-accent">{code}</span><span className="text-sm text-ink-2">{detail}</span></div>)}</div></div><div className="glass-panel"><div className="panel-head"><h2 className="panel-title flex items-center gap-2"><Sparkles size={15} className="text-accent" />Technology in the stack</h2></div><div className="panel-body flex flex-wrap gap-2">{technologies.map((item) => <span key={item} className="badge">{item}</span>)}</div><div className="mx-5 mb-5 rounded-lg border border-line-subtle bg-surface-1/40 px-3 py-3 text-xs leading-relaxed text-ink-3">Model outputs are demonstration values. The production system will attach model version, timestamp, input quality and confidence metadata to each warning.</div></div></section>
  </div>
}
