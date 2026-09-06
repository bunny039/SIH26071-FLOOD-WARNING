import type { DataSource } from '../../types'

const toneHex: Record<DataSource['tone'], string> = {
  cyan: '#45c9fb',
  green: '#4ed69a',
  amber: '#f6c85f',
  violet: '#a78bfa',
  rose: '#f0565f',
}

interface DataSourceCardProps {
  source: DataSource
  compact?: boolean
}

/** Visibility chip for a fused data source (IMD / ERA5 / GPM / GFS / RADAR). */
export function DataSourceCard({ source, compact = false }: DataSourceCardProps) {
  const statusLabel = source.status === 'available' ? 'Available' : source.status === 'degraded' ? 'Degraded' : 'Offline'
  return (
    <div className="source-chip">
      <span
        className="source-tag"
        style={{
          color: toneHex[source.tone],
          borderColor: `${toneHex[source.tone]}55`,
          background: `${toneHex[source.tone]}14`,
        }}
        aria-hidden="true"
      >
        {source.code}
      </span>
      {!compact && (
        <div className="min-w-0 flex-1">
          <div className="source-name">{source.name}</div>
          <div className="source-desc">{source.description}</div>
        </div>
      )}
      <span className={`ml-auto source-state ${source.status !== 'available' ? 'is-degraded' : ''}`}>
        <span className={source.status === 'available' ? 'status-dot' : 'status-dot is-muted'} aria-hidden="true" />
        {statusLabel}
      </span>
    </div>
  )
}