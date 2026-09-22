import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2, MapPin } from 'lucide-react'
import { searchLocations } from '../../services/api'
import type { LocationSearchResult } from '../../types'

interface LocationSearchBarProps {
  onSelectLocation: (loc: LocationSearchResult) => void
  placeholder?: string
}

export function LocationSearchBar({
  onSelectLocation,
  placeholder = 'Search Indian state, district, city, or town...'
}: LocationSearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LocationSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Debounce query
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const matches = await searchLocations(query)
        setResults(matches)
        setIsOpen(matches.length > 0)
      } catch (err) {
        console.error('Location search error:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (loc: LocationSearchResult) => {
    setQuery(loc.name)
    setIsOpen(false)
    onSelectLocation(loc)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-lg z-30">
      <div className="relative flex items-center">
        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
          ) : (
            <Search className="w-4 h-4 text-cyan-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-cyan-500/50 focus:border-cyan-500 rounded-xl text-sm text-slate-100 placeholder-slate-400 shadow-xl shadow-black/40 focus:outline-none transition-all"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800/60 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {results.map((loc, idx) => (
            <button
              key={`${loc.name}-${loc.latitude}-${loc.longitude}-${idx}`}
              onClick={() => handleSelect(loc)}
              className="w-full px-4 py-3 text-left hover:bg-slate-800/80 transition-colors flex items-start gap-3 group"
            >
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors mt-0.5 shrink-0">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                    {loc.name}
                  </span>
                  {loc.state && (
                    <span className="text-xs text-slate-400 truncate">
                      {loc.state}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {loc.display_name}
                </div>
              </div>
              <div className="text-[11px] font-mono text-slate-400 self-center shrink-0">
                {loc.latitude.toFixed(2)}°, {loc.longitude.toFixed(2)}°
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
