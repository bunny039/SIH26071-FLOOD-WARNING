import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, RotateCw, TriangleAlert } from 'lucide-react'
import { DataSourceCard } from '../components/cards/DataSourceCard'
import { MetricCard } from '../components/cards/MetricCard'
import { RiskCard } from '../components/cards/RiskCard'
import { RainfallChart } from '../components/charts/RainfallChart'
import { WeatherMap } from '../components/maps/WeatherMap'
import { dataSources, forecastData, weatherData } from '../data/mockData'
import { getWeatherData } from '../services/api'
import type { CurrentConditions } from '../types'
import { fractionToPercent, formatClock, riskTone } from '../utils/risk'

/**
 * COMMAND CENTER — hero page.
 * OBSERVE → PREDICT → ASSESS → WARN in one view. All values are mock;
 * they are swapped for FastAPI responses through services/api.ts.
 */
export function Dashboard() {
  const [conditions, setConditions] = useState<CurrentConditions>(weatherData)
  const [refreshing, setRefreshing] = useState(false)

  async function refreshConditions() {
    setRefreshing(true)
    try {
      const fresh = await getWeatherData()
      setConditions({ ...fresh, updatedAt: new Date().toISOString() })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ---------------- Header ---------------- */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Observe → Predict → Assess → Warn</p>
          <h1 className="page-title mt-2">AquaSentinel Command Center</h1>
          <p className="page-subtitle">AI-powered rainfall and inundation intelligence</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="badge">
            <span className="status-dot is-accent" aria-hidden="true" />
            Live mock feed
          </span>
          <button
            type="button"
            className="btn"
            onClick={refreshConditions}
            disabled={refreshing}
            aria-label="Refresh prediction data"
          >
            <RotateCw size={14} className={refreshing ? 'is-spinning' : ''} aria-hidden="true" />
            {refreshing ? 'Updating…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ---------------- Top risk summary ---------------- */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Top risk summary">
        <RiskCard
          level={conditions.riskLevel}
          label="Current Risk"
          subtitle="Preparedness actions recommended across the city core."
        />
        <MetricCard
          label="Heavy Rain Probability"
          value={fractionToPercent(conditions.heavyRainProbability)}
          note="IDD threshold 64.5 mm / 6h"
        />
        <MetricCard
          label="Flood Probability"
          value={fractionToPercent(conditions.floodProbability)}
          note="Highest in Zone A"
        />
        <MetricCard
          label="Forecast Horizon"
          value={
            <>
              {conditions.forecastHorizon}
              <span className="unit">hr</span>
            </>
          }
          note="Next 6 hours · 10 AM – 3 PM IST"
        />
      </section>

      {/* __DASH_PART2__ */}

      {/* ---------------- Map + live risk panel ---------------- */}
      <section className="grid gap-5 xl:grid-cols-3" aria-label="Risk map and live snapshot">
        <div className="glass-panel flex flex-col xl:col-span-2">
          <div className="panel-head flex-wrap">
            <div>
              <h2 className="panel-title">Live Risk Map</h2>
              <p className="panel-kicker">
                Flood probability · zone-averaged · demonstration data only
              </p>
            </div>
            <span className="badge">26.14°N · 91.74°E</span>
          </div>
          <div className="p-3 pt-2">
            <WeatherMap height={520} />
          </div>
        </div>

        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Live Risk Snapshot</h2>
              <p className="panel-kicker">
                Updated {formatClock(conditions.updatedAt)} IST · Guwahati
              </p>
            </div>
            <span className={`risk-pill ${riskTone(conditions.riskLevel)}`}>
              <span className="pill-dot" aria-hidden="true" />
              {conditions.riskLevel}
            </span>
          </div>
          <div className="panel-body flex flex-1 flex-col">
            <StatBar
              label="Rainfall (last 6h)"
              value={`${conditions.rainfall} mm`}
              pct={78}
              color="var(--color-accent)"
            />
            <StatBar
              label="Peak intensity"
              value={`${conditions.peakIntensity} mm/hr`}
              pct={62}
              color="var(--color-moderate)"
            />
            <StatBar
              label="Flood probability"
              value={fractionToPercent(conditions.floodProbability)}
              pct={74}
              color="var(--color-high)"
            />
            <StatBar
              label="Potential affected area"
              value={`${conditions.affectedArea.toFixed(1)} km²`}
              pct={87}
              color="var(--color-severe)"
            />

            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Temp" value={`${conditions.temperatureC.toFixed(1)}°C`} />
              <MiniStat label="Humidity" value={`${conditions.humidity}%`} />
              <MiniStat label="Wind" value={`${conditions.windSpeedKph} km/h`} />
            </div>

            <div className="mt-auto pt-5">
              <div className="divider-rule" role="separator" />
              <p className="pt-3 text-[0.68rem] leading-relaxed text-ink-3">
                Fused signals from IMD · ERA5 · GPM · GFS · RADAR. Values are
                demonstration placeholders for the ML pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* __DASH_PART3__ */}

      {/* ---------------- Forecast + data feeds ---------------- */}
      <section className="grid gap-5 xl:grid-cols-3" aria-label="Forecast and data feeds">
        <div className="glass-panel flex flex-col xl:col-span-2">
          <div className="panel-head flex-wrap">
            <div>
              <h2 className="panel-title">Next 6 Hours · Rainfall Forecast</h2>
              <p className="panel-kicker">
                Hourly rainfall, peak intensity and the AI risk trend
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <LegendChip color="#45c9fb" label="Rainfall" />
              <LegendChip color="#f6c85f" label="Intensity" />
              <LegendChip color="#fb9638" label="Risk trend" dashed />
            </div>
          </div>
          <div className="panel-body">
            <RainfallChart data={forecastData} height={300} />
          </div>
        </div>

        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title">Multi-Source Feed</h2>
              <p className="panel-kicker">Fusion inputs feeding this forecast</p>
            </div>
          </div>
          <div className="panel-body flex flex-1 flex-col gap-2">
            {dataSources.map((source) => (
              <DataSourceCard key={source.id} source={source} />
            ))}
            <p className="mt-auto pt-3 text-[0.68rem] leading-relaxed text-ink-3">
              All feeds nominal — demonstration statuses. Real connectivity
              arrives with the FastAPI backend.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- Warning banner ---------------- */}
      <section className="warn-banner" aria-label="Heavy rainfall warning">
        <span className="warn-banner-icon" aria-hidden="true">
          <TriangleAlert size={22} />
        </span>
        <div className="warn-banner-copy">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="warn-banner-title">⚠ HEAVY RAINFALL ALERT</span>
            <span className={`risk-pill ${riskTone('HIGH')}`}>
              <span className="pill-dot" aria-hidden="true" />
              HIGH
            </span>
          </div>
          <p className="warn-banner-msg">
            “High-intensity rainfall is expected over parts of Guwahati within the
            next 2–3 hours.”
          </p>
        </div>
        <Link className="warn-banner-link" to="/flood-risk">
          View detailed risk
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    </div>
  )
}

function StatBar({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="stat-row">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className="stat-track" aria-hidden="true">
        <div className="stat-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat">
      <span className="mini-stat-label">{label}</span>
      <span className="mini-stat-value">{value}</span>
    </div>
  )
}

function LegendChip({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-ink-3">
      <span
        className="legend-swatch"
        style={{
          background: dashed ? 'transparent' : color,
          borderColor: color,
          backgroundImage: dashed
            ? `linear-gradient(90deg, transparent 0 45%, ${color} 45% 55%, transparent 55%)`
            : undefined,
        }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}