import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  MapPin,
  BellRing,
  RotateCw,
  TrendingUp,
  Waves,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { getAlerts, acknowledgeAlertApi } from '../services/api'
import type { AlertRecord, RiskLevel } from '../types'

export function AlertsPage() {
  const navigate = useNavigate()
  const [alerts, setAlerts] = useState<AlertRecord[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [lastRefreshed, setLastRefreshed] = useState<string>('')

  const fetchLiveAlerts = async () => {
    setLoading(true)
    try {
      const data = await getAlerts()
      setAlerts(data)
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    } catch {
      // Keep existing alerts if error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveAlerts()
  }, [])

  const handleAcknowledge = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    )
    await acknowledgeAlertApi(id)
  }

  const filteredAlerts = alerts.filter((a) => {
    const sev = String(a.severity).toUpperCase()
    if (selectedFilter === 'ALL') return true
    if (selectedFilter === 'SEVERE') return sev === 'SEVERE' || sev === 'CRITICAL'
    if (selectedFilter === 'WARNING') return sev === 'WARNING' || sev === 'HIGH' || sev === 'ALERT'
    if (selectedFilter === 'WATCH') return sev === 'WATCH' || sev === 'MODERATE'
    if (selectedFilter === 'NORMAL') return sev === 'NORMAL' || sev === 'LOW'
    return sev === selectedFilter
  })

  const getSeverityStyle = (severity: RiskLevel | string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'SEVERE':
        return {
          border: 'border-red-500/40',
          bg: 'bg-red-950/20',
          badge: 'bg-red-500/20 text-red-400 border-red-500/40',
          iconColor: 'text-red-400',
        }
      case 'ALERT':
      case 'WARNING':
      case 'HIGH':
        return {
          border: 'border-orange-500/40',
          bg: 'bg-orange-950/20',
          badge: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          iconColor: 'text-orange-400',
        }
      case 'WATCH':
      case 'MODERATE':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-950/20',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          iconColor: 'text-amber-400',
        }
      default:
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-950/20',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          iconColor: 'text-emerald-400',
        }
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ---------------- Header ---------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Live Early Warning Feed
            </span>
            {lastRefreshed && (
              <span className="text-[11px] text-slate-500">Updated at {lastRefreshed}</span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1 flex items-center gap-2.5">
            <BellRing size={24} className="text-cyan-400" />
            Early Warning Alert Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time hazard warnings synthesized from ConvLSTM spatio-temporal deep learning and live Open-Meteo NWP radar observations
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={fetchLiveAlerts}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition disabled:opacity-50"
          >
            <RotateCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
            {loading ? 'Refreshing Feed...' : 'Refresh Alerts'}
          </button>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {['ALL', 'SEVERE', 'WARNING', 'WATCH', 'NORMAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  selectedFilter === cat
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Alert Cards List ---------------- */}
      {loading && alerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RotateCw size={24} className="animate-spin text-cyan-400" />
          <p className="text-sm">Synthesizing live multi-sensor early warning alerts...</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <Sparkles size={24} className="text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">No active alerts matching filter "{selectedFilter}"</p>
          <p className="text-xs text-slate-500">All regional drainage basins within selected severity tier are operating within normal limits.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const style = getSeverityStyle(alert.severity)
            return (
              <div
                key={alert.id}
                className={`rounded-2xl border ${style.border} ${style.bg} p-5 backdrop-blur-md transition-all shadow-lg hover:border-cyan-500/40`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`rounded-full px-3 py-0.5 text-xs font-extrabold border ${style.badge}`}>
                      {alert.severity}
                    </span>
                    <span className="font-mono text-xs text-slate-400">{alert.id}</span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {alert.time}
                    </span>
                    {alert.status && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                        {alert.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {alert.acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 size={14} /> Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:border-cyan-400 hover:bg-slate-700 hover:text-white"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-cyan-400 shrink-0" />
                      <h3 className="text-base font-bold text-white">{alert.location}</h3>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{alert.message}</p>
                    
                    {/* Action Links */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cityName = alert.city || alert.location.split(',')[0].trim()
                          const latParam = (alert as any).latitude ? `&lat=${(alert as any).latitude}&lon=${(alert as any).longitude}` : ''
                          navigate(`/predict?loc=${encodeURIComponent(cityName)}${latParam}`)
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
                      >
                        <TrendingUp size={13} />
                        Run Deep-Dive Forecast
                        <ArrowUpRight size={13} />
                      </button>

                      <span className="text-slate-600">·</span>

                      <button
                        type="button"
                        onClick={() => {
                          const cityName = alert.city || alert.location.split(',')[0].trim()
                          const latParam = (alert as any).latitude ? `lat=${(alert as any).latitude}&lon=${(alert as any).longitude}&loc=${encodeURIComponent(cityName)}` : `loc=${encodeURIComponent(cityName)}`
                          navigate(`/flood-risk?${latParam}`)
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
                      >
                        <Waves size={13} />
                        Inundation & Shelter Analysis
                        <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 rounded-xl border border-slate-800/80 bg-slate-950/70 px-5 py-3.5 shrink-0">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Predicted Depth</span>
                      <div className="text-xl font-extrabold text-white">
                        {alert.predicted_rainfall?.toFixed(1) ?? '85.0'}{' '}
                        <span className="text-xs text-cyan-400 font-normal">mm</span>
                      </div>
                    </div>
                    <div className="h-9 w-px bg-slate-800" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Forecast Window</span>
                      <div className="text-sm font-bold text-slate-200">{alert.forecast_period ?? '24 hours'}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

