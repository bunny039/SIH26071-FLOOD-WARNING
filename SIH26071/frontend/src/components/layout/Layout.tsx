import { useCallback, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './Header'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

/**
 * Application shell (Phase 2).
 * Persistent sidebar on desktop, header with location/clock, and a
 * scrollable content region. The content wrapper is keyed by pathname
 * so the entry transition replays on every navigation.
 */
export function Layout({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  const openNav = useCallback(() => setNavOpen(true), [])
  const closeNav = useCallback(() => setNavOpen(false), [])

  return (
    <div className="app-frame">
      <Sidebar />

      <div className="main-col">
        <Header onOpenMobileNav={openNav} />
        <main className="main-scroll">
          <div key={pathname} className="main-content page-enter">
            {children}
          </div>
        </main>
      </div>

      <MobileNav open={navOpen} onClose={closeNav} />
    </div>
  )
}