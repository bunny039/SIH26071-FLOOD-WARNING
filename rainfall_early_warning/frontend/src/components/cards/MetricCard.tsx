import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  note?: ReactNode
}

/** Compact instrument-style metric for the risk summary strip. */
export function MetricCard({ label, value, note }: MetricCardProps) {
  return (
    <div className="metric-card glass-panel">
      <div className="metric-label">{label}</div>
      <div className="metric-value mt-3">{value}</div>
      {note && (
        <div className="metric-note mt-4">
          <span className="note-dot" aria-hidden="true" />
          {note}
        </div>
      )}
    </div>
  )
}