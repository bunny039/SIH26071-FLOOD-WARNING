import { useEffect, useState } from 'react'
import { CloudRain, Info, RotateCw } from 'lucide-react'
import { DataSourceCard } from '../components/cards/DataSourceCard'
import { MetricCard } from '../components/cards/MetricCard'
import { RainfallChart } from '../components/charts/RainfallChart'
import { dataSources, rainfallFactors, weatherData } from '../data/mockData'
import { getForecast, getRainfallPrediction } from '../services/api'
import type { ForecastPoint, RainfallPrediction } from '../types'
import { fractionToPercent } from '../utils/risk'

export function RainfallPage() {
  const [prediction, setPrediction] = useState<RainfallPrediction | null>(null)
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [loading, setLoading] = useState(true)

  async function loadRainfall() {
    setLoading(true)
    const [nextPrediction, nextForecast] = await Promise.all([getRainfallPrediction(), getForecast()])
    setPrediction(nextPrediction)
    setForecast(nextForecast)
    setLoading(false)
  }

  useEffect(() => { void loadRainfall() }, [])

  const displayPrediction = prediction ?? {
    rainfallPrediction: weatherData.rainfallPrediction,
    heavyRainProbability: weatherData.heavyRainProbability,
    peakIntensity: weatherData.peakIntensity,
    modelConfidence: 0.89,
    timestamp: weatherData.updatedAt,
  }

  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Predict · Atmospheric signal</p><h1 className="page-title mt-2">Rainfall Intelligence</h1><p className="page-subtitle">AI-based heavy rainfall prediction from aligned observations, satellite and forecast data.</p></div><button type="button" className="btn" onClick={() => void loadRainfall()} disabled={loading}><RotateCw size={14} className={loading ? 'is-spinning' : ''} />{loading ? 'Updating' : 'Refresh prediction'}</button></header>
    <section className="grid grid-cols-2 gap-4 xl:grid-cols-4"><MetricCard label="Predicted Rainfall" value={<>{displayPrediction.rainfallPrediction}<span className="unit">mm</span></>} note="Next 6 hours" /><MetricCard label="Heavy Rain Probability" value={fractionToPercent(displayPrediction.heavyRainProbability)} note="Above 64.5 mm threshold" /><MetricCard label="Peak Intensity" value={<>{displayPrediction.peakIntensity}<span className="unit">mm/hr</span></>} note="12 PM forecast peak" /><MetricCard label="Model Confidence" value={fractionToPercent(displayPrediction.modelConfidence)} note="Demonstration confidence" /></section>
    <section className="glass-panel"><div className="panel-head"><div><h2 className="panel-title flex items-center gap-2"><CloudRain size={15} className="text-accent" />Six-hour rainfall forecast</h2><p className="panel-kicker">Switch metrics to inspect the signal behind the prediction.</p></div><span className="badge"><span className="status-dot is-accent" />{loading ? 'Loading mock model' : 'Mock model output'}</span></div><div className="panel-body">{forecast.length ? <RainfallChart data={forecast} height={360} variant="metric" /> : <div className="grid h-90 place-items-center text-sm text-ink-3">Waiting for forecast data…</div>}</div></section>
    <section className="grid gap-5 xl:grid-cols-2"><div className="glass-panel"><div className="panel-head"><div><h2 className="panel-title">Multi-source inputs</h2><p className="panel-kicker">All statuses are simulated until FastAPI integration.</p></div></div><div className="panel-body grid gap-2">{dataSources.map((source) => <DataSourceCard key={source.id} source={source} />)}</div></div><div className="glass-panel"><div className="panel-head"><div><h2 className="panel-title">Why is heavy rainfall expected?</h2><p className="panel-kicker">Relative influence on this demonstration forecast.</p></div><Info size={16} className="text-ink-3" /></div><div className="panel-body grid gap-5">{rainfallFactors.map((factor) => <div key={factor.label}><div className="flex items-center justify-between gap-3 text-[0.78rem]"><span className="text-ink-2">{factor.label}</span><span className="font-bold text-ink">{factor.influence}</span></div><div className="stat-track mt-2"><div className="stat-fill bg-accent" style={{ width: `${factor.score}%` }} /></div></div>)}</div></div></section>
  </div>
}