import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'

/** Shared primary navigation list (desktop sidebar + mobile drawer). */
export function NavList() {
  return (
    <nav className="nav-list" aria-label="Primary navigation">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          title={item.description}
          className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
        >
          <item.icon
            className="nav-link-icon"
            size={17}
            strokeWidth={1.9}
            aria-hidden="true"
          />
          <span className="nav-link-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}