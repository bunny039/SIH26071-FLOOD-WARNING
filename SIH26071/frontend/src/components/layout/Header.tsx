import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MapPin, Menu } from 'lucide-react'
import { currentLocationId, demoClockAnchor, locations } from '../../data/mockData'

/* Mock clock: anchored to a fixed IST timestamp, ticking forward in real time. */
const clockAnchor = new Date(demoClockAnchor)
const clockStartedAt = Date.now()

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function useSentinelClock() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  /* Recompute from the anchor on every render (tick drives re-renders). */
  const now = new Date(clockAnchor.getTime() + (Date.now() - clockStartedAt))
  return {
    time: timeFormatter.format(now),
    date: dateFormatter.format(now).toUpperCase(),
  }
}

interface HeaderProps {
  onOpenMobileNav: () => void
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(currentLocationId)
  const menuRef = useRef<HTMLDivElement>(null)
  const { time, date } = useSentinelClock()

  const selected = locations.find((loc) => loc.id === selectedId) ?? locations[0]

  /* Close the location menu on outside click. */
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <header className="top-head">
      <div className="top-head-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <div className="loc-wrap" ref={menuRef}>
          <button
            type="button"
            className="loc-button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <MapPin size={15} className="text-accent" aria-hidden="true" />
            <span className="loc-label">
              {selected.name}, {selected.state}, {selected.country}
            </span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={open ? 'loc-caret open' : 'loc-caret'}
            />
          </button>

          {open && (
            <div className="loc-menu" role="listbox" aria-label="Select location">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  role="option"
                  aria-selected={loc.id === selectedId}
                  className={loc.id === selectedId ? 'loc-option is-selected' : 'loc-option'}
                  onClick={() => {
                    setSelectedId(loc.id)
                    setOpen(false)
                  }}
                >
                  <MapPin
                    size={14}
                    aria-hidden="true"
                    className={loc.id === selectedId ? 'text-accent' : 'text-ink-3'}
                  />
                  <span className="loc-opt-name">
                    {loc.name}
                    <span className="loc-opt-state"> · {loc.state}</span>
                  </span>
                  <span className="loc-opt-coord">
                    {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="top-head-right">
        <span className="badge hide-sm">
          <span className="status-dot is-accent" aria-hidden="true" />
          Demo feed
        </span>
        <div className="clock-block">
          <span className="clock-time">
            {time}
            <span className="clock-tz">IST</span>
          </span>
          <span className="clock-date">{date}</span>
        </div>
      </div>
    </header>
  )
}