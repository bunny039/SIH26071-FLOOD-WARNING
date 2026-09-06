import { useState } from 'react'
import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ForecastPoint } from '../../types'

interface RainfallChartProps { data: ForecastPoint[]; height?: number; variant?: 'posed' | 'metric'; showTabs?: boolean }
type ChartMetric = 'rainfall' | 'intensity' | 'probability'

function ChartTip({ active, payload, label }: { active?: boolean; payload?: ReadonlyArray<{ payload?: ForecastPoint }>; label?: string }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  return <div className="chart-tip"><div className="chart-tip-head"><span className="chart-tip-dot" style={{ background: '#45c9fb' }} />{label}</div><div className="chart-tip-grid"><span>Rainfall</span><b>{point.rainfall.toFixed(1)} mm</b><span>Intensity</span><b>{point.intensity} mm/hr</b><span>Probability</span><b>{Math.round(point.probability * 100)}%</b><span>Risk index</span><b>{point.riskScore} / 100</b></div><div className="chart-tip-risk">{point.riskLevel} RISK</div></div>
}

export function RainfallChart({ data, height = 280, variant = 'posed', showTabs = false }: RainfallChartProps) {
  const [metric, setMetric] = useState<ChartMetric>('rainfall')
  const metricMode = variant === 'metric' || showTabs
  const chartData = data.map((point) => ({ ...point, probabilityPct: Math.round(point.probability * 100) }))
  return <div className="chart-block" aria-label={metricMode ? `${metric} forecast chart` : 'Rainfall, intensity and risk trend chart'}>
    {metricMode && <div className="chart-tabs" role="tablist" aria-label="Chart metric">{(['rainfall', 'intensity', 'probability'] as ChartMetric[]).map((key) => <button key={key} type="button" role="tab" aria-selected={metric === key} className={metric === key ? 'chart-tab is-on' : 'chart-tab'} onClick={() => setMetric(key)}>{key[0].toUpperCase() + key.slice(1)}</button>)}</div>}
    <div className="chart-canvas" style={{ height }}><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}><defs><linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5ad0ff" stopOpacity={0.95} /><stop offset="100%" stopColor="#1687c4" stopOpacity={0.65} /></linearGradient><linearGradient id="intGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f6c85f" stopOpacity={0.45} /><stop offset="100%" stopColor="#f6c85f" stopOpacity={0.03} /></linearGradient></defs><CartesianGrid stroke="rgba(126, 196, 236, 0.08)" strokeDasharray="3 6" vertical={false} /><XAxis dataKey="hourLabel" tick={{ fill: '#6b87a0', fontSize: 11 }} axisLine={false} tickLine={false} interval={0} /><YAxis yAxisId="left" domain={[0, metricMode && metric === 'probability' ? 100 : 40]} tick={{ fill: '#6b87a0', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis yAxisId="right" orientation="right" domain={[0, 100]} hide /><Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(69, 201, 251, 0.06)' }} />{!metricMode ? <><Bar yAxisId="left" dataKey="rainfall" fill="url(#rainGrad)" radius={[5, 5, 0, 0]} barSize={30} /><Line yAxisId="right" type="monotone" dataKey="intensity" stroke="#f6c85f" strokeWidth={2} dot={{ r: 3, fill: '#f6c85f', strokeWidth: 0 }} /><Line yAxisId="right" type="monotone" dataKey="riskScore" stroke="#fb9638" strokeWidth={2} strokeDasharray="5 5" dot={false} /></> : metric === 'rainfall' ? <Bar yAxisId="left" dataKey="rainfall" fill="url(#rainGrad)" radius={[5, 5, 0, 0]} barSize={34} /> : metric === 'intensity' ? <Area yAxisId="left" type="monotone" dataKey="intensity" stroke="#f6c85f" strokeWidth={2} fill="url(#intGrad)" dot={{ r: 3, fill: '#f6c85f', strokeWidth: 0 }} /> : <Line yAxisId="left" type="monotone" dataKey="probabilityPct" stroke="#8ce3ff" strokeWidth={2.5} dot={{ r: 3, fill: '#8ce3ff', strokeWidth: 0 }} />}</ComposedChart></ResponsiveContainer></div>
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-[0.62rem] font-bold uppercase tracking-widest text-ink-3">
      {metricMode ? <span><span className="legend-swatch mr-1.5" style={{ background: metric === 'intensity' ? '#f6c85f' : metric === 'probability' ? '#8ce3ff' : '#45c9fb' }} />{metric} · mock forecast</span> : <><span><span className="legend-swatch mr-1.5" style={{ background: '#45c9fb' }} />Rainfall</span><span><span className="legend-swatch mr-1.5" style={{ background: '#f6c85f' }} />Intensity</span><span><span className="legend-swatch mr-1.5" style={{ background: '#fb9638' }} />Risk trend</span></>}
    </div>
  </div>
}