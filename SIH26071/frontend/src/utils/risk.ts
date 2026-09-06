import type { RiskLevel } from '../types'

/** Semantic risk colors — single source of truth across UI, map and charts. */
export const RISK_HEX: Record<RiskLevel, string> = {
  LOW: '#4ed69a',
  MODERATE: '#f6c85f',
  HIGH: '#fb9638',
  SEVERE: '#f0565f',
}

export const RISK_ORDER: RiskLevel[] = ['LOW', 'MODERATE', 'HIGH', 'SEVERE']

/** Risk color as an rgba string for Leaflet fills/strokes. */
export function riskColor(level: RiskLevel, alpha = 1): string {
  const hex = RISK_HEX[level]
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** CSS class suffix matching the pre-defined risk-pill tones. */
export function riskTone(level: RiskLevel): string {
  return `is-${level.toLowerCase()}`
}

/** Converts a 0–1 fraction into a display percentage. */
export function fractionToPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`
}

/** Maps a 0–100 score to a risk level. */
export function riskScoreTone(score: number): RiskLevel {
  if (score >= 85) return 'SEVERE'
  if (score >= 60) return 'HIGH'
  if (score >= 40) return 'MODERATE'
  return 'LOW'
}

const istClockFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Formats an ISO timestamp as an IST clock string, e.g. "10:15". */
export function formatClock(iso: string): string {
  return istClockFormatter.format(new Date(iso))
}