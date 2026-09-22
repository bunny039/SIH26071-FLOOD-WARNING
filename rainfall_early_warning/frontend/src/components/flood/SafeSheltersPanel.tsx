import { useState } from 'react'
import {
  ShieldCheck,
  TriangleAlert,
  Navigation,
  Phone,
  Users,
  Mountain,
  Footprints,
  Car
} from 'lucide-react'
import type { ShelterInfo } from '../../types'

interface SafeSheltersPanelProps {
  shelters: ShelterInfo[]
  selectedShelterId?: string | null
  onSelectShelter: (shelter: ShelterInfo) => void
  isLoading?: boolean
}

export function SafeSheltersPanel({
  shelters,
  selectedShelterId,
  onSelectShelter,
  isLoading = false
}: SafeSheltersPanelProps) {
  const [filterSafeOnly, setFilterSafeOnly] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<'distance' | 'elevation' | 'capacity'>('distance')

  const filteredShelters = shelters
    .filter((s) => (filterSafeOnly ? s.is_clear_of_flood : true))
    .sort((a, b) => {
      if (sortBy === 'distance') return a.distance_km - b.distance_km
      if (sortBy === 'elevation') return b.elevation_m - a.elevation_m
      if (sortBy === 'capacity') return b.capacity - a.capacity
      return 0
    })

  const safeCount = shelters.filter((s) => s.is_clear_of_flood).length
  const floodedCount = shelters.length - safeCount

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Emergency Relief Shelters & Safe Locations
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {shelters.length} Found
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Facilities cross-referenced against satellite flood inundation masks.
          </p>
        </div>

        {/* Safety Summary Tally */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-semibold flex items-center gap-1">
            <ShieldCheck size={13} /> {safeCount} Safe
          </span>
          {floodedCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 font-semibold flex items-center gap-1">
              <TriangleAlert size={13} /> {floodedCount} in Floodway
            </span>
          )}
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs">
        {/* Toggle Safe Only */}
        <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
          <input
            type="checkbox"
            checked={filterSafeOnly}
            onChange={(e) => setFilterSafeOnly(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 cursor-pointer w-3.5 h-3.5"
          />
          <span className="font-medium">Show verified flood-clear shelters only</span>
        </label>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="distance">Nearest Distance</option>
            <option value="elevation">Highest Elevation</option>
            <option value="capacity">Largest Capacity</option>
          </select>
        </div>
      </div>

      {/* Shelters List */}
      <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1 mt-1">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div>Querying regional disaster facilities...</div>
          </div>
        ) : filteredShelters.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60 p-4">
            No shelters matched the current filter.
          </div>
        ) : (
          filteredShelters.map((shelter) => {
            const isSelected = selectedShelterId === shelter.id
            const isClear = shelter.is_clear_of_flood

            return (
              <div
                key={shelter.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/30 shadow-lg shadow-blue-950/30 ring-1 ring-blue-500'
                    : isClear
                    ? 'border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-800/40'
                    : 'border-red-900/40 bg-red-950/10 hover:bg-red-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white">{shelter.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {shelter.type}
                      </span>
                    </div>

                    {/* Flood Exclusion Check Badge */}
                    <div className="mt-1.5 flex items-center gap-2">
                      {isClear ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
                          <ShieldCheck size={12} className="text-emerald-400" />
                          VERIFIED CLEAR OF FLOOD ZONE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-950/90 text-red-300 border border-red-700/60">
                          <TriangleAlert size={12} className="text-red-400 animate-pulse" />
                          HAZARD: LOCATED IN FLOOD CORRIDOR
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route Action Button */}
                  <button
                    type="button"
                    onClick={() => onSelectShelter(shelter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shrink-0 shadow-sm ${
                      isSelected
                        ? 'bg-blue-500 text-white font-bold'
                        : isClear
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-amber-600/80 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <Navigation size={13} />
                    {isSelected ? 'Routing Active' : 'Route to Shelter'}
                  </button>
                </div>

                {/* Metrics row */}
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-slate-800/60 pt-2.5">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Navigation size={13} className="text-blue-400 shrink-0" />
                    <span>
                      <strong className="text-slate-200">{shelter.distance_km} km</strong> ({shelter.direction})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Mountain size={13} className="text-purple-400 shrink-0" />
                    <span>
                      Elev: <strong className="text-slate-200">{shelter.elevation_m} m</strong> MSL
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users size={13} className="text-cyan-400 shrink-0" />
                    <span>
                      Cap: <strong className="text-slate-200">{shelter.capacity}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="flex items-center gap-1" title="Walking travel time">
                      <Footprints size={12} /> {shelter.estimated_travel_time.walking_minutes}m
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="flex items-center gap-1" title="Driving travel time">
                      <Car size={12} /> {shelter.estimated_travel_time.driving_minutes}m
                    </span>
                  </div>
                </div>

                {/* Contact Helpline */}
                {shelter.contact && (
                  <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Phone size={11} className="text-emerald-400" />
                    Helpline: {shelter.contact}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
