import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  MapPin,
  BellRing
} from 'lucide-react'
import type { AlertRecord, RiskLevel } from '../types'

const INITIAL_ALERTS: AlertRecord[] = [
  {
    id: 'ALT-101',
    location: 'Bhubaneswar Urban Core',
    time: '2026-09-19 16:30 IST',
    predicted_rainfall: 124.5,
    severity: 'SEVERE',
    message: 'Extremely heavy rainfall predicted (>115.5 mm). High risk of flash waterlogging and arterial drainage overflow.',
    forecast_period: '24 hours',
    window: 'Next 24h',
    status: 'Active',
    acknowledged: false,
  },
  {
    id: 'ALT-102',
    location: 'Cuttack Mahanadi Basin',
    time: '2026-09-19 16:00 IST',
    predicted_rainfall: 88.2,
    severity: 'WARNING',
    message: 'Heavy precipitation forecast (64.5 - 115.5 mm). Moderate localized inundation in low-lying sectors expected.',
    forecast_period: '12 hours',
    window: 'Next 12h',
    status: 'Active',
    acknowledged: false,
  },
  {
    id: 'ALT-103',
    location: 'Guwahati Brahmaputra Foothills',
    time: '2026-09-19 15:15 IST',
    predicted_rainfall: 94.6,
    severity: 'WARNING',
    message: 'Intense orographic downpour anticipated. Vulnerable hill slopes advised to monitor surface runoff.',
    forecast_period: '24 hours',
    window: 'Next 24h',
    status: 'Active',
    acknowledged: false,
  },
  {
    id: 'ALT-104',
    location: 'Puri Coastal Strip',
    time: '2026-09-19 14:00 IST',
    predicted_rainfall: 48.0,
    severity: 'WATCH',
    message: 'Moderate rainfall expected (15.6 - 64.4 mm). Intermittent thunderstorm bands and coastal gusts.',
    forecast_period: '24 hours',
    window: 'Next 24h',
    status: 'Monitoring',
    acknowledged: true,
  },
  {
    id: 'ALT-105',
    location: 'Kolkata Metropolitan Area',
    time: '2026-09-19 12:30 IST',
    predicted_rainfall: 14.2,
    severity: 'NORMAL',
    message: 'Light scattered showers (<15.5 mm). Normal seasonal precipitation, no municipal action required.',
    forecast_period: '48 hours',
    window: 'Next 48h',
    status: 'Resolved',
    acknowledged: true,
  },
]

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>(INITIAL_ALERTS)
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')

  const handleAcknowledge = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    )
  }

  const filteredAlerts = alerts.filter((a) => {
    if (selectedFilter === 'ALL') return true
    return a.severity === selectedFilter
  })

  const getSeverityStyle = (severity: RiskLevel) => {
    switch (severity) {
      case 'SEVERE':
        return {
          border: 'border-red-500/40',
          bg: 'bg-red-500/10',
          badge: 'bg-red-500/20 text-red-400 border-red-500/40',
          iconColor: 'text-red-400',
        }
      case 'WARNING':
      case 'HIGH':
        return {
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          iconColor: 'text-amber-400',
        }
      case 'WATCH':
      case 'MODERATE':
        return {
          border: 'border-yellow-500/40',
          bg: 'bg-yellow-500/10',
          badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
          iconColor: 'text-yellow-400',
        }
      default:
        return {
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
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
            <BellRing size={20} className="text-cyan-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Early Warning Alert Center
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time hazard warnings classified by IMD standard precipitation thresholds
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'SEVERE', 'WARNING', 'WATCH', 'NORMAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedFilter === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- Alert Cards List ---------------- */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const style = getSeverityStyle(alert.severity)
          return (
            <div
              key={alert.id}
              className={`rounded-2xl border ${style.border} ${style.bg} p-5 backdrop-blur-md transition-all shadow-lg`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-0.5 text-xs font-extrabold border ${style.badge}`}>
                    {alert.severity}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{alert.id}</span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> {alert.time}
                  </span>
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

              <div className="mt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-cyan-400" />
                    <h3 className="text-base font-bold text-white">{alert.location}</h3>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{alert.message}</p>
                </div>

                <div className="flex items-center gap-6 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 shrink-0">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Predicted Depth</span>
                    <div className="text-lg font-extrabold text-white">
                      {alert.predicted_rainfall ?? 85.0} <span className="text-xs text-cyan-400 font-normal">mm</span>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Forecast Window</span>
                    <div className="text-sm font-semibold text-slate-200">{alert.forecast_period ?? '24 hours'}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
