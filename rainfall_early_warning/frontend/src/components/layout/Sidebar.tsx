import { BrandMark } from './BrandMark'
import { NavList } from './NavList'
import { systemStatus } from '../../data/mockData'

/** Persistent desktop navigation rail. Hidden below 1024px (see CSS). */
export function Sidebar() {
  return (
    <aside className="side-rail">
      <div className="side-rail-inner">
        <BrandMark />

        <hr className="nav-divider" role="separator" />

        <p className="nav-label">Monitoring</p>
        <NavList />
      </div>

      <div className="side-foot">
        <div className="sys-status">
          <p className="sys-eyebrow">System Status</p>
          <div className="sys-state">
            <span className="status-dot" aria-hidden="true" />
            <span>{systemStatus.label}</span>
          </div>
          <p className="sys-detail">{systemStatus.detail}</p>
        </div>
        <p className="side-version">AQUASENTINEL v0.2 · DEMO</p>
      </div>
    </aside>
  )
}