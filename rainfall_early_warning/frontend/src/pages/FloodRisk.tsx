import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ArrowDown, ArrowRight, Mountain, RotateCw, Waves } from 'lucide-react'
import { MetricCard } from '../components/cards/MetricCard'
import { WeatherMap } from '../components/maps/WeatherMap'
import { floodRiskData, weatherData } from '../data/mockData'
import { getFloodRisk, getWeatherData } from '../services/api'
import type { CurrentConditions, FloodRiskData, RiskZone } from '../types'
import { fractionToPercent, riskTone } from '../utils/risk'

export function FloodRiskPage() {
  const [risk, setRisk] = useState<FloodRiskData>(floodRiskData)
  const [conditions, setConditions] = useState<CurrentConditions>(weatherData)
  const [selectedZone, setSelectedZone] = useState<RiskZone>(floodRiskData.zones[0])
  const [loading, setLoading] = useState(false)

  async function refreshRisk() {
    setLoading(true)
    const [nextRisk, nextConditions] = await Promise.all([getFloodRisk(), getWeatherData()])
    setRisk(nextRisk)
    setConditions(nextConditions)
    setSelectedZone(nextRisk.zones[0])
    setLoading(false)
  }

  useEffect(() => { void refreshRisk() }, [])

  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Assess · Spatial intelligence</p><h1 className="page-title mt-2">Flood Risk Intelligence</h1><p className="page-subtitle">Spatial prediction of inundation risk across Guwahati using rainfall, elevation and terrain context.</p></div><button type="button" className="btn" onClick={() => void refreshRisk()} disabled={loading}><RotateCw size={14} className={loading ? 'is-spinning' : ''} />{loading ? 'Updating' : 'Refresh risk'}</button></header>
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4"><MetricCard label="Highest Risk Zone" value="Zone A" note={risk.topRiskZone} /><MetricCard label="Flood Probability" value={fractionToPercent(risk.topZoneFloodProbability)} note="Top zone estimate" /><MetricCard label="Affected Area" value={<>{risk.topZoneAffectedArea}<span className="unit">km²</span></>} note="Potentially affected" /><MetricCard label="Current Rainfall" value={<>{conditions.rainfall}<span className="unit">mm</span></>} note="Last 6 hours" /></section>
    <section className="glass-panel"><div className="panel-head"><div><h2 className="panel-title flex items-center gap-2"><Waves size={15} className="text-accent" />Flood probability layer</h2><p className="panel-kicker">Compare rainfall, radar, elevation and flood risk layers in the interactive map.</p></div><span className={`risk-pill ${riskTone(selectedZone.riskLevel)}`}><span className="pill-dot" />{selectedZone.riskLevel}</span></div><div className="p-3"><WeatherMap height={620} /></div></section>
    <section className="grid gap-5 xl:grid-cols-2"><div className="glass-panel"><div className="panel-head"><div><h2 className="panel-title">Why is this area at risk?</h2><p className="panel-kicker">A judge-friendly explanation of the selected zone.</p></div></div><div className="panel-body flex flex-col items-center gap-2 text-center"><Reason icon={<Waves size={17} />} label="Heavy rainfall" detail={`${conditions.rainfall} mm observed and ${fractionToPercent(conditions.heavyRainProbability)} heavy-rain probability`} /><ArrowDown size={16} className="text-ink-3" /><Reason icon={<Mountain size={17} />} label="Low elevation" detail="Low-lying terrain drains slowly under intense rainfall" /><ArrowDown size={16} className="text-ink-3" /><Reason icon={<Waves size={17} />} label="Historical flood patterns" detail="Riverine and drainage corridors raise exposure" /><ArrowDown size={16} className="text-accent" /><div className="w-full rounded-xl border border-high/30 bg-high/10 px-4 py-3"><div className="font-bold text-high">Elevated inundation risk</div><div className="mt-1 text-xs text-ink-2">Multiple independent signals agree on the hotspot.</div></div></div></div><div className="glass-panel"><div className="panel-head"><div><h2 className="panel-title">Risk analysis</h2><p className="panel-kicker">Select a zone to inspect its demonstration estimate.</p></div></div><div className="panel-body grid gap-3"><div className="rounded-xl border border-high/25 bg-high/10 p-4"><div className="flex items-center justify-between gap-3"><span className="text-lg font-bold text-ink">Zone {selectedZone.id}</span><span className={`risk-pill ${riskTone(selectedZone.riskLevel)}`}><span className="pill-dot" />{selectedZone.riskLevel}</span></div><div className="mt-1 text-sm text-ink-2">{selectedZone.name}</div><div className="mt-4 grid grid-cols-2 gap-3"><Mini label="Flood probability" value={fractionToPercent(selectedZone.floodProbability)} /><Mini label="Affected area" value={`${selectedZone.affectedArea.toFixed(1)} km²`} /></div></div>{risk.zones.map((zone) => <button key={zone.id} type="button" className={`flex items-center justify-between rounded-lg border px-3 py-3 text-left transition ${selectedZone.id === zone.id ? 'border-accent/40 bg-accent/10' : 'border-line-subtle bg-surface-1/30 hover:border-line-strong'}`} onClick={() => setSelectedZone(zone)}><span><span className="font-bold text-ink">Zone {zone.id}</span><span className="ml-2 text-xs text-ink-3">{zone.name}</span></span><span className="flex items-center gap-2"><span className={`risk-pill ${riskTone(zone.riskLevel)}`}><span className="pill-dot" />{fractionToPercent(zone.floodProbability)}</span><ArrowRight size={14} className="text-ink-3" /></span></button>)}</div></div></section>
  </div>
}

function Reason({ icon, label, detail }: { icon: ReactNode; label: string; detail: string }) { return <div className="w-full rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3 text-left"><div className="flex items-center gap-2 font-bold text-ink">{icon}{label}</div><div className="mt-1 text-xs text-ink-3">{detail}</div></div> }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border border-line-subtle bg-surface-1/50 p-3"><div className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-3">{label}</div><div className="mt-1 font-mono text-lg font-bold text-ink">{value}</div></div> }
