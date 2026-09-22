import {
  ShieldCheck,
  TriangleAlert,
  AlertOctagon,
  X,
  Compass,
  AlertCircle
} from 'lucide-react'
import type { EvacuationRouteResponse, ShelterInfo } from '../../types'

interface EvacuationRoutePanelProps {
  route: EvacuationRouteResponse
  destinationShelter: ShelterInfo | null
  onClearRoute: () => void
  onPickAlternate?: () => void
}

export function EvacuationRoutePanel({
  route,
  destinationShelter,
  onClearRoute,
  onPickAlternate
}: EvacuationRoutePanelProps) {
  const isFloodIntersected = route.safety_status === 'FLOOD_INTERSECTION_DETECTED'

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 shadow-2xl backdrop-blur-xl ${
        isFloodIntersected
          ? 'border-red-500/80 bg-red-950/40 shadow-red-950/40'
          : 'border-emerald-500/60 bg-emerald-950/30 shadow-emerald-950/20'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isFloodIntersected
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
            }`}
          >
            {isFloodIntersected ? (
              <AlertOctagon size={24} className="animate-pulse" />
            ) : (
              <ShieldCheck size={24} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Evacuation Route Navigation
              </span>
              <span className="text-xs text-slate-400">
                {route.routing_engine.toUpperCase()}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Destination: {destinationShelter?.name || 'Selected Safe Facility'}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onClearRoute}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
          title="Dismiss Route"
        >
          <X size={16} />
        </button>
      </div>

      {/* Safety Status Banner */}
      <div className="mt-4">
        {isFloodIntersected ? (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-600/70 text-red-200">
            <div className="flex items-center gap-2 font-bold text-sm text-red-300">
              <TriangleAlert size={18} className="text-red-400 shrink-0 animate-bounce" />
              CRITICAL HAZARD: ROUTE INTERSECTS FLOOD INUNDATION CORRIDOR!
            </div>
            <p className="mt-1.5 text-xs text-red-200/90 leading-relaxed">
              {route.warning_message ||
                'This evacuation path traverses predicted submerged roadway segments. Moving floodwaters pose severe life threat.'}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono bg-red-900/40 p-2 rounded-lg border border-red-800/50">
              <span>Submerged intersections detected:</span>
              <strong className="text-red-300">{route.flood_intersections_count} waypoint(s) in floodway</strong>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
              <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
              EVACUATION ROUTE VERIFIED CLEAR OF FLOODWAY
            </div>
            <p className="mt-1 text-xs text-emerald-200/90 leading-relaxed">
              Route waypoints analyzed against U-Net satellite inundation masks and confirmed outside active flood polygons.
            </p>
          </div>
        )}
      </div>

      {/* Route Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Total Distance
          </div>
          <div className="text-lg font-mono font-bold text-white mt-0.5">
            {route.distance_km} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Est. Drive Time
          </div>
          <div className="text-lg font-mono font-bold text-white mt-0.5">
            {route.duration_minutes} <span className="text-xs font-normal text-slate-400">min</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
            Waypoints Checked
          </div>
          <div className="text-lg font-mono font-bold text-white mt-0.5">
            {route.waypoints_count}
          </div>
        </div>
      </div>

      {/* Evacuation Protocol Guidance & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
          <AlertCircle size={13} className="text-amber-400 shrink-0" />
          Turn Around Don't Drown: 15 cm of moving water can knock you down.
        </div>

        {isFloodIntersected && onPickAlternate && (
          <button
            type="button"
            onClick={onPickAlternate}
            className="px-3 py-1.5 rounded-lg font-semibold bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Compass size={13} />
            Pick Higher Ground Shelter
          </button>
        )}
      </div>
    </div>
  )
}
