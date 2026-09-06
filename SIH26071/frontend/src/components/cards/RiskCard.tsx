import type { RiskLevel } from '../../types'
import { RISK_HEX, RISK_ORDER, riskTone } from '../../utils/risk'

interface RiskCardProps {
  level: RiskLevel
  label?: string
  subtitle?: string
}

/**
 * Emphasised current-risk block with a four-segment level scale.
 * Used on the Command Center risk summary.
 */
export function RiskCard({ level, label = 'Current Risk', subtitle }: RiskCardProps) {
  return (
    <div className="metric-card glass-panel risk-card">
      <div className="metric-label">{label}</div>
      <div className="mt-3">
        <span className={`risk-pill ${riskTone(level)}`}>
          <span className="pill-dot" aria-hidden="true" />
          {level}
        </span>
      </div>

      <div className="risk-scale mt-4" aria-label={`Risk on a scale from LOW to SEVERE, current: ${level}`}>
        {RISK_ORDER.map((step) => (
          <span
            key={step}
            className={step === level ? 'risk-scale-seg is-on' : 'risk-scale-seg'}
            style={{ background: step === level ? RISK_HEX[step] : undefined }}
          >
            {step}
          </span>
        ))}
      </div>

      {subtitle && <div className="risk-note mt-3">{subtitle}</div>}
    </div>
  )
}