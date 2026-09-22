import {
  AlertTriangle,
  ShieldCheck,
  Info,
  Layers,
  CloudRain,
  Calendar,
  Activity,
  Droplets,
  Clock,
  Compass
} from 'lucide-react'
import type { FloodAnalyzeResponse } from '../../types'

interface FloodEarlyWarningPanelProps {
  data: FloodAnalyzeResponse
  onViewMapClick?: () => void
  onFindSheltersClick?: () => void
}

export function FloodEarlyWarningPanel({
  data,
  onViewMapClick,
  onFindSheltersClick
}: FloodEarlyWarningPanelProps) {
  const { flood_severity, risk_assessment, inundation_percentage, inundated_area_km2, timestamp } = data
  const { evidence_separation, explainability, advisory, operational_action } = risk_assessment

  // Color mapping based on risk level
  const isHighOrCritical = flood_severity === 'HIGH' || flood_severity === 'CRITICAL'
  const isModerate = flood_severity === 'MODERATE'

  const borderClass = isHighOrCritical
    ? 'border-red-500/50 shadow-red-950/20'
    : isModerate
    ? 'border-amber-500/40 shadow-amber-950/20'
    : 'border-emerald-500/30 shadow-emerald-950/10'

  const headerBgClass = isHighOrCritical
    ? 'bg-gradient-to-r from-red-950/60 via-red-900/30 to-slate-900/40'
    : isModerate
    ? 'bg-gradient-to-r from-amber-950/50 via-amber-900/20 to-slate-900/40'
    : 'bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900/40'

  const badgeBgClass = isHighOrCritical
    ? 'bg-red-500/20 text-red-300 border-red-500/40'
    : isModerate
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'

  return (
    <div className={`rounded-2xl border ${borderClass} bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300`}>
      {/* Top Banner: Early Warning Status */}
      <div className={`px-6 py-5 border-b border-slate-800 ${headerBgClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${badgeBgClass} shadow-inner`}>
              {isHighOrCritical ? (
                <AlertTriangle size={26} className="text-red-400 animate-pulse" />
              ) : isModerate ? (
                <Activity size={26} className="text-amber-400" />
              ) : (
                <ShieldCheck size={26} className="text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-widest border uppercase ${badgeBgClass}`}>
                  {flood_severity} SEVERITY
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock size={12} />
                  {new Date(timestamp).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {risk_assessment.risk_title}
              </h2>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            {onViewMapClick && (
              <button
                type="button"
                onClick={onViewMapClick}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Layers size={14} className="text-cyan-400" />
                View Inundation Map
              </button>
            )}
            {onFindSheltersClick && (
              <button
                type="button"
                onClick={onFindSheltersClick}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30 transition flex items-center gap-1.5"
              >
                <Compass size={14} />
                Find Safe Shelters
              </button>
            )}
          </div>
        </div>

        {/* Operational Advisory */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-300 block uppercase text-[10px] tracking-wider mb-0.5">
              Public Advisory:
            </span>
            <span className="text-slate-300 leading-relaxed">{advisory}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300 block uppercase text-[10px] tracking-wider mb-0.5">
              Disaster Response Action:
            </span>
            <span className="text-slate-300 leading-relaxed">{operational_action}</span>
          </div>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Droplets size={13} className="text-cyan-400" /> Inundation
          </div>
          <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">
            {inundation_percentage.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {inundated_area_km2.toFixed(1)} km² submerged
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CloudRain size={13} className="text-blue-400" /> Live Rainfall
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">
            {evidence_separation.OBSERVED_DATA.live_rainfall_mm.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Last 3h AWS Station
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar size={13} className="text-indigo-400" /> 24h NWP Forecast
          </div>
          <div className="text-2xl font-black text-indigo-400 mt-1 font-mono">
            {evidence_separation.PREDICTED_DATA.forecast_24h_rainfall_mm.toFixed(1)} <span className="text-xs font-normal text-slate-400">mm</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            IMD GFS Ensemble
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="text-amber-400" /> Composite Risk
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {risk_assessment.composite_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Multi-Sensor Formula
          </div>
        </div>
      </div>

      {/* Explainability & Contributing Reasons */}
      <div className="p-6 space-y-5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Info size={16} className="text-blue-400" />
              Multi-Sensor Explainability & Rationale
            </h3>
            {explainability.multi_sensor_verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                <ShieldCheck size={12} /> Multi-Sensor Convergence Confirmed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            {explainability.summary}
          </p>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            {explainability.contributing_reasons.map((reason, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/70 text-xs text-slate-300"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Strict Evidence Separation Table */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers size={13} className="text-purple-400" />
              Audited Evidence Separation (Strict Sensor Provenance)
            </h4>
            <span className="text-[10px] text-slate-500 italic">Zero fabricated telemetry</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2">Evidence Category</th>
                  <th className="px-3 py-2">Sensor / Data Stream</th>
                  <th className="px-3 py-2">Quantified Value</th>
                  <th className="px-3 py-2">Provenance Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                <tr>
                  <td className="px-3 py-2 font-semibold text-blue-400">1. OBSERVED DATA</td>
                  <td className="px-3 py-2 text-slate-300">Live Weather AWS + Antecedent 7-Day</td>
                  <td className="px-3 py-2 font-mono text-white">
                    {evidence_separation.OBSERVED_DATA.live_rainfall_mm} mm (3h) | {evidence_separation.OBSERVED_DATA.antecedent_7d_rainfall_mm} mm (7d)
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">
                    {evidence_separation.OBSERVED_DATA.source}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-indigo-400">2. PREDICTED DATA</td>
                  <td className="px-3 py-2 text-slate-300">Numerical Weather Prediction (NWP)</td>
                  <td className="px-3 py-2 font-mono text-white">
                    {evidence_separation.PREDICTED_DATA.forecast_24h_rainfall_mm} mm (Next 24h)
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">
                    {evidence_separation.PREDICTED_DATA.source}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-cyan-400">3. MODEL OUTPUT</td>
                  <td className="px-3 py-2 text-slate-300">U-Net Satellite Segmentation</td>
                  <td className="px-3 py-2 font-mono text-white">
                    {evidence_separation.MODEL_OUTPUT.inundation_percentage ?? 0}% ({evidence_separation.MODEL_OUTPUT.inundated_area_km2 ?? 0} km²)
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">
                    {evidence_separation.MODEL_OUTPUT.model_name}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2 font-semibold text-amber-400">4. DERIVED INDICATOR</td>
                  <td className="px-3 py-2 text-slate-300">Convergence Synthesis Engine</td>
                  <td className="px-3 py-2 font-mono text-amber-300 font-bold">
                    Score: {evidence_separation.DERIVED_RISK_INDICATOR.score} ({evidence_separation.DERIVED_RISK_INDICATOR.tier})
                  </td>
                  <td className="px-3 py-2 text-[11px] text-slate-400">
                    {evidence_separation.DERIVED_RISK_INDICATOR.config_source}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
