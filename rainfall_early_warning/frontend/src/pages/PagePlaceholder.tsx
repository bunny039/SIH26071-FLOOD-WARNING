import { Construction } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface PagePlaceholderProps {
  title: string
  subtitle: string
  phase: string
  icon?: LucideIcon
}

/**
 * Lightweight stand-in rendered while a product module awaits its phase.
 * Removed route-by-route as real pages are built (Phases 3–10).
 */
export function PagePlaceholder({ title, subtitle, phase, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="eyebrow">NEXORA · AQUASENTINEL</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </header>

      <section className="glass-panel">
        <div className="panel-body flex flex-col items-start gap-5 px-6 py-8 sm:px-8">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            {Icon ? <Icon size={22} aria-hidden="true" /> : <Construction size={22} aria-hidden="true" />}
          </span>

          <div className="flex flex-col gap-1.5">
            <span className="badge">
              <span className="status-dot is-accent" aria-hidden="true" />
              In build sequence
            </span>
            <h2 className="panel-title mt-2 text-ink">This module is queued for {phase}.</h2>
          </div>

          <p className="max-w-2xl text-[0.88rem] leading-relaxed text-ink-2">
            The Phase 2 shell is now live across the application — sidebar
            navigation, the location selector and the live IST clock in the
            header are operational. The {title} interface will replace this
            panel when its phase is built.
          </p>

          <div className="divider-rule w-full" role="separator" />

          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">Nav · Active</span>
            <span className="badge">Clock · Ticking</span>
            <span className="badge">Location · Selectable</span>
            <span className="badge">Shell · Responsive</span>
          </div>
        </div>
      </section>
    </div>
  )
}