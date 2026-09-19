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
  const [presentationMode, setPresentationMode] = useState(false)

  const openNav = useCallback(() => setNavOpen(true), [])
  const closeNav = useCallback(() => setNavOpen(false), [])

  if (presentationMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col relative text-white font-sans overflow-hidden">
        <button 
          onClick={() => setPresentationMode(false)}
          className="absolute top-4 right-4 z-50 px-3 py-1.5 bg-slate-900 rounded-lg hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors text-xs font-medium flex items-center gap-2"
          title="Exit Presentation Mode"
        >
          EXIT PRESENTATION MODE
        </button>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <div key={pathname} className="main-content page-enter">
              {children}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-frame relative">
      <Sidebar />

      <div className="main-col">
        <Header onOpenMobileNav={openNav} />
        
        {/* Presentation Toggle Bar */}
        <div className="bg-slate-950 border-b border-slate-900 px-6 py-1.5 flex justify-end">
          <button 
            onClick={() => setPresentationMode(true)}
            className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-cyan-400 transition-colors"
          >
            ● Presentation Mode
          </button>
        </div>

        <main className="main-scroll relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div key={pathname} className="main-content page-enter relative z-10">
            {children}
          </div>
        </main>
      </div>

      <MobileNav open={navOpen} onClose={closeNav} />
    </div>
  )
}