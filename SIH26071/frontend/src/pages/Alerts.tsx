import { useEffect, useState } from 'react'
import { BellRing, Filter, RotateCw } from 'lucide-react'
import { alertData } from '../data/mockData'
import { getAlerts } from '../services/api'
import type { AlertRecord, RiskLevel } from '../types'
import { riskTone } from '../utils/risk'

const filters: Array<'ALL' | RiskLevel> = ['ALL', 'SEVERE', 'HIGH', 'MODERATE', 'LOW']

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>(alertData)
  const [filter, setFilter] = useState<(typeof filters)[number]>('ALL')
  const [loading, setLoading] = useState(false)

  async function refreshAlerts() {
    setLoading(true)
    setAlerts(await getAlerts())
    setLoading(false)
  }

  useEffect(() => { void refreshAlerts() }, [])

  const visibleAlerts = filter === 'ALL' ? alerts : alerts.filter((alert) => alert.severity === filter)
  const activeAlert = alerts.find((alert) => alert.status === 'Active') ?? alerts[0]

  return <div className="flex flex-col gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Warn · Decision support</p><h1 className="page-title mt-2">Early Warning Center</h1><p className="page-subtitle">Monitor and manage weather-related risk alerts for Guwahati.</p></div><button type="button" className="btn" onClick={() => void refreshAlerts()} disabled={loading}><RotateCw size={14} className={loading ? 'is-spinning' : ''} />{loading ? 'Refreshing' : 'Refresh alerts'}</button></header>
    {activeAlert && <section className="warn-banner"><span className="warn-banner-icon"><BellRing size={21} /></span><div className="warn-banner-copy"><div className="flex flex-wrap items-center gap-2"><span className="warn-banner-title">ACTIVE WARNING · {activeAlert.location.toUpperCase()}</span><span className={`risk-pill ${riskTone(activeAlert.severity)}`}><span className="pill-dot" />{activeAlert.severity}</span></div><p className="warn-banner-msg">{activeAlert.message}. Expected window: {activeAlert.window}.</p></div></section>}
    <section className="glass-panel"><div className="panel-head flex-wrap"><div><h2 className="panel-title flex items-center gap-2"><Filter size={15} className="text-accent" />Alert monitor</h2><p className="panel-kicker">{visibleAlerts.length} alerts match the selected severity.</p></div><div className="chart-tabs" role="tablist" aria-label="Alert severity filter">{filters.map((key) => <button key={key} type="button" role="tab" aria-selected={filter === key} className={filter === key ? 'chart-tab is-on' : 'chart-tab'} onClick={() => setFilter(key)}>{key[0] + key.slice(1).toLowerCase()}</button>)}</div></div><div className="panel-body grid gap-3">{visibleAlerts.length ? visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />) : <div className="rounded-xl border border-dashed border-line-strong px-5 py-8 text-center text-sm text-ink-3">No alerts match this severity filter.</div>}</div></section>
    <section className="glass-panel"><div className="panel-head"><div><h2 className="panel-title">Alert history</h2><p className="panel-kicker">Recent system events from the demonstration feed.</p></div></div><div className="overflow-x-auto"><table className="alert-table"><thead><tr><th>Time</th><th>Location</th><th>Alert</th><th>Severity</th><th>Status</th></tr></thead><tbody>{alerts.map((alert) => <tr key={alert.id}><td>{alert.time}</td><td>{alert.location}</td><td>{alert.message}</td><td><span className={`risk-pill ${riskTone(alert.severity)}`}><span className="pill-dot" />{alert.severity}</span></td><td><span className={`alert-status is-${alert.status.toLowerCase()}`}>{alert.status}</span></td></tr>)}</tbody></table></div></section>
  </div>
}

function AlertCard({ alert }: { alert: AlertRecord }) { return <article className="rounded-xl border border-line-subtle bg-surface-1/40 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className={`risk-pill ${riskTone(alert.severity)}`}><span className="pill-dot" />{alert.severity}</span><span className="font-bold text-ink">{alert.location}</span><span className="text-xs text-ink-3">{alert.time}</span></div><span className={`alert-status is-${alert.status.toLowerCase()}`}>{alert.status}</span></div><p className="mt-3 text-sm text-ink-2">{alert.message}</p><p className="mt-2 text-xs uppercase tracking-widest text-ink-3">Expected window · {alert.window}</p></article> }
