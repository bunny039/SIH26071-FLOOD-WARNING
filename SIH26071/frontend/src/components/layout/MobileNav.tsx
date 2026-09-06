import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { NavList } from './NavList'
import { systemStatus } from '../../data/mockData'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

/** Slide-over navigation drawer for screens below 1024px. */
export function MobileNav({ open, onClose }: MobileNavProps) {
  const location = useLocation()
  const previousPath = useRef(location.pathname)

  /* Lock body scroll while the drawer is open. */
  useEffect(() => {
    if (open) {
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previous
      }
    }
  }, [open])

  /* Close after navigation. */
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      previousPath.current = location.pathname
      onClose()
    }
  }, [location.pathname, onClose])

  /* Close on Escape. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!open) return null

  return (
    <div className="mobile-nav-layer">
      <div className="mobile-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="mobile-drawer-head">
          <BrandMark />
          <button
            type="button"
            className="mobile-menu-btn is-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mobile-drawer-nav">
          <p className="nav-label">Monitoring</p>
          <NavList />
        </div>

        <div className="mobile-drawer-foot">
          <div className="sys-status">
            <div className="sys-state">
              <span className="status-dot" aria-hidden="true" />
              <span>{systemStatus.label}</span>
            </div>
            <p className="sys-detail">{systemStatus.detail}</p>
          </div>
        </div>
      </div>
    </div>
  )
}