import {
  ArrowRight,
  Boxes,
  Database,
  Layers,
  MonitorDown,
  Palette,
  ShieldAlert,
  Type,
} from 'lucide-react'

/**
 * Phase 1 — design-system foundation page.
 * Rendered inside the application shell so the visual system can be
 * reviewed before the product pages are built in later phases.
 */

const riskLevels = [
  {
    level: 'LOW',
    tone: 'is-low',
    note: 'Conditions within normal operational range.',
  },
  {
    level: 'MODERATE',
    tone: 'is-moderate',
    note: 'Monitoring advised across the forecast horizon.',
  },
  {
    level: 'HIGH',
    tone: 'is-high',
    note: 'Preparedness actions should be initiated.',
  },
  {
    level: 'SEVERE',
    tone: 'is-severe',
    note: 'Immediate protective action recommended.',
  },
] as const

const swatches = [
  { name: 'Canvas', hex: '#050d18' },
  { name: 'Abyss', hex: '#02060c' },
  { name: 'Surface 1', hex: '#0a1e33' },
  { name: 'Surface 2', hex: '#0e2a45' },
  { name: 'Surface 3', hex: '#143a5c' },
  { name: 'Line strong', hex: 'rgba(108, 205, 255, 0.32)' },
  { name: 'Ink', hex: '#eaf6ff' },
  { name: 'Ink 2', hex: '#a3bed3' },
  { name: 'Ink 3', hex: '#6b87a0' },
  { name: 'Accent', hex: '#45c9fb' },
  { name: 'Safe', hex: '#4ed69a' },
  { name: 'Moderate', hex: '#f6c85f' },
  { name: 'High', hex: '#fb9638' },
  { name: 'Severe', hex: '#f0565f' },
] as const

const sources = [
  { name: 'IMD', desc: 'Weather observations' },
  { name: 'ERA5', desc: 'Atmospheric conditions' },
  { name: 'GPM', desc: 'Satellite precipitation' },
  { name: 'GFS', desc: 'Numerical forecast' },
  { name: 'RADAR', desc: 'Precipitation structure' },
] as const

const storySteps = [
  { step: 'OBSERVE', desc: 'Sensor & satellite intake' },
  { step: 'PREDICT', desc: 'AI rainfall estimation' },
  { step: 'ASSESS', desc: 'Inundation risk scoring' },
  { step: 'WARN', desc: 'Community early warnings' },
] as const

export function FoundationPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="eyebrow">NEXORA · AquaSentinel — Phase 1 · Design Foundation</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">
              <span className="status-dot" aria-hidden="true" />
              Foundation operational
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="page-title">
            The AquaSentinel command-center
            <span className="text-accent"> foundation</span>
          </h1>
          <p className="page-subtitle">
            A dark meteorological design system built for a disaster-intelligence
            product: glass-like surfaces, restrained cyan accents, and a strict
            semantic color language for risk. Sidebar navigation, the header and
            all product pages are built on top of this system in subsequent phases.
          </p>
        </div>
      </header>

      {/* Product story strip */}
      <section className="glass-panel glass-panel--flush" aria-label="Product pipeline">
        <div className="panel-body flex flex-wrap items-stretch justify-center gap-x-3 gap-y-2 py-5">
          {storySteps.map((step, index) => (
            <div key={step.step} className="flex items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 font-mono text-[0.66rem] font-bold tracking-[0.14em] ${
                    index === 0
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : 'border-line-subtle bg-surface-1/60 text-ink-2'
                  }`}
                >
                  {step.step}
                </span>
                <span className="hidden text-[0.68rem] leading-tight text-ink-3 lg:block">
                  {step.desc}
                </span>
              </div>
              {index < storySteps.length - 1 && (
                <ArrowRight size={14} className="text-ink-3" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Visual system">
        {/* Color tokens */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <Palette size={14} className="text-accent" aria-hidden="true" />
                Color system
              </h2>
              <p className="panel-kicker">
                Every token is registered as a Tailwind theme color and consumed by
                every page.
              </p>
            </div>
          </div>
          <div className="panel-body grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="swatch">
                <span
                  className="swatch-chip"
                  style={{ background: swatch.hex }}
                  aria-hidden="true"
                />
                <div>
                  <div className="swatch-name">{swatch.name}</div>
                  <div className="swatch-hex">{swatch.hex}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk language */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <ShieldAlert size={14} className="text-accent" aria-hidden="true" />
                Risk language
              </h2>
              <p className="panel-kicker">
                One semantic scale across maps, charts, alerts and the sidebar.
              </p>
            </div>
          </div>
          <div className="panel-body grid gap-2.5">
            {riskLevels.map((risk) => (
              <div
                key={risk.level}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3"
              >
                <span className={`risk-pill ${risk.tone}`}>
                  <span className="pill-dot" aria-hidden="true" />
                  {risk.level}
                </span>
                <span className="max-w-[24ch] text-right text-[0.78rem] leading-snug text-ink-2">
                  {risk.note}
                </span>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="badge">
                <span className="status-dot is-accent" aria-hidden="true" />
                Watch
              </span>
              <span className="badge">
                <span className="status-dot is-warn" aria-hidden="true" />
                Advisory
              </span>
              <span className="badge">
                <span className="status-dot is-muted" aria-hidden="true" />
                Historical
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2" aria-label="Interface components">
        {/* Typography */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <Type size={14} className="text-accent" aria-hidden="true" />
                Type scale
              </h2>
              <p className="panel-kicker">
                Inter for interface copy, system mono for instrument values.
              </p>
            </div>
          </div>
          <div className="panel-body flex flex-col gap-5">
            <div>
              <div className="text-[2rem] font-extrabold leading-tight tracking-[-0.03em] text-ink">
                Intelligence, when every minute matters.
              </div>
              <div className="mt-1.5 text-[0.68rem] font-bold tracking-[0.2em] text-ink-3">
                DISPLAY · 32PX · 800 WEIGHT
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-ink-2">Heavy rainfall forecast</div>
              <div className="mt-1.5 text-[0.68rem] font-bold tracking-[0.2em] text-ink-3">
                PANEL TITLE · 14PX · 750 WEIGHT
              </div>
            </div>
            <div>
              <p className="max-w-[52ch] text-[0.88rem] leading-relaxed text-ink-2">
                AquaSentinel fuses observations, satellite precipitation, radar and
                numerical weather prediction into a single spatial view of flood risk —
                then explains, in plain language, why an area is at risk.
              </p>
            </div>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3">
                <span className="data-value text-2xl font-bold text-ink">82.4 mm</span>
                <span className="data-value text-2xl font-bold text-high">87%</span>
                <span className="data-value text-2xl font-bold text-severe">74%</span>
                <span className="data-value text-2xl font-bold text-accent">31 mm/hr</span>
              </div>
              <div className="mt-1.5 text-[0.68rem] font-bold tracking-[0.2em] text-ink-3">
                MONO · TABULAR FIGURES
              </div>
            </div>
          </div>
        </div>

        {/* Metrics + actions */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <MonitorDown size={14} className="text-accent" aria-hidden="true" />
                Signals & controls
              </h2>
              <p className="panel-kicker">
                Demonstration values — replaced by API responses in later phases.
              </p>
            </div>
          </div>
          <div className="panel-body flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3.5">
                <div className="metric-label">Current risk</div>
                <div className="mt-2">
                  <span className="risk-pill is-severe">
                    <span className="pill-dot" aria-hidden="true" />
                    HIGH
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3.5">
                <div className="metric-label">Heavy rain probability</div>
                <div className="metric-value mt-2">
                  87<span className="unit">%</span>
                </div>
              </div>
              <div className="rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3.5">
                <div className="metric-label">Flood probability</div>
                <div className="metric-value mt-2">
                  74<span className="unit">%</span>
                </div>
              </div>
              <div className="rounded-xl border border-line-subtle bg-surface-1/40 px-4 py-3.5">
                <div className="metric-label">Forecast horizon</div>
                <div className="metric-value mt-2 text-xl">
                  6<span className="unit">hr</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" className="btn btn-primary">
                Issue early warning
              </button>
              <button type="button" className="btn">
                Review sources
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3" aria-label="Sources and shell">
        {/* Data sources */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <Database size={14} className="text-accent" aria-hidden="true" />
                Data sources
              </h2>
              <p className="panel-kicker">
                Mock connection state — wired to real statuses later.
              </p>
            </div>
          </div>
          <div className="panel-body grid flex-1 content-start gap-2">
            {sources.map((source) => (
              <div key={source.name} className="source-chip">
                <div className="min-w-0">
                  <div className="source-name">{source.name}</div>
                  <div className="source-desc">{source.desc}</div>
                </div>
                <span className="ml-auto source-state">
                  &#9679; Data&nbsp;available
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shell anatomy */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <Layers size={14} className="text-accent" aria-hidden="true" />
                Application shell
              </h2>
              <p className="panel-kicker">
                Fixed command-center grid — sidebar, header and content regions.
              </p>
            </div>
          </div>
          <div className="panel-body flex flex-1 flex-col gap-3">
            <div className="flex h-44 overflow-hidden rounded-xl border border-line-subtle">
              <div className="flex w-1/4 flex-col border-r border-line-subtle bg-surface-1/50 p-2.5">
                <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-1 text-[0.5rem] font-bold tracking-[0.18em] text-accent">
                  BRAND
                </span>
                <div className="mt-2 space-y-1.5">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-1.5 rounded-full bg-ink-3/40"
                      aria-hidden="true"
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-1 flex-col">
                <div className="border-b border-line-subtle bg-surface-1/40 px-2.5 py-2">
                  <span className="text-[0.5rem] font-bold tracking-[0.18em] text-ink-3">
                    HEADER · LOCATION / CLOCK
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-1 p-2">
                  <span className="h-2 w-16 rounded-sm bg-ink-3/30" aria-hidden="true" />
                  <span className="h-2 w-24 rounded-sm bg-ink-3/30" aria-hidden="true" />
                  <span className="h-2 w-20 rounded-sm bg-accent/30" aria-hidden="true" />
                </div>
              </div>
            </div>
            <p className="text-[0.78rem] leading-relaxed text-ink-2">
              The sidebar and header content are built in Phase 2; the grid and
              shell that hosts them is live now.
            </p>
          </div>
        </div>

        {/* API-ready boundary */}
        <div className="glass-panel flex flex-col">
          <div className="panel-head">
            <div>
              <h2 className="panel-title flex items-center gap-2">
                <Boxes size={14} className="text-accent" aria-hidden="true" />
                API-ready structure
              </h2>
              <p className="panel-kicker">
                A single mock-data boundary that FastAPI responses will replace.
              </p>
            </div>
          </div>
          <div className="panel-body flex flex-1 flex-col gap-2">
            {[
              { label: 'src/types/index.ts', desc: 'RiskLevel + ApiPrediction contracts' },
              { label: 'src/data/mockData.ts', desc: 'All page data, seeded in later phases' },
              { label: 'src/services/api.ts', desc: 'getWeather / getPrediction / getAlerts' },
              { label: 'src/components/...', desc: 'Layout, cards, charts, maps, alerts' },
            ].map((block) => (
              <div
                key={block.label}
                className="flex flex-col gap-1 rounded-xl border border-line-subtle bg-surface-1/40 px-3.5 py-2.5"
              >
                <span className="font-mono text-[0.72rem] font-semibold text-accent">
                  {block.label}
                </span>
                <span className="text-[0.76rem] text-ink-2">{block.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="flex flex-wrap items-center justify-between gap-3 px-1 pb-2">
        <p className="text-[0.78rem] text-ink-3">
          Phase 1 complete — Sidebar, Header, Command Center, maps and charts are next.
        </p>
        <span className="font-mono text-[0.62rem] tracking-[0.22em] text-ink-3">
          NEXORA · AQUASENTINEL · SIH 2026
        </span>
      </footer>
    </div>
  )
}