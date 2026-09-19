import {
  Database,
  Sliders,
  Cpu,
  Calculator,
  ShieldAlert,
  BellRing,
  LayoutDashboard,
  ArrowDown,
  BookOpen,
  Award
} from 'lucide-react'

export function HowItWorksPage() {
  const pipelineSteps = [
    {
      num: '01',
      title: 'DATA SOURCES',
      icon: Database,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      description: 'Ingestion of multi-source global data including ECMWF ERA5 reanalysis (59 atmospheric variables across pressure levels 300 to 950 hPa) and NASA GPM-IMERG satellite precipitation reanalysis.',
    },
    {
      num: '02',
      title: 'DATA PREPROCESSING',
      icon: Sliders,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      description: 'Spatial cubic spline re-sampling onto standard 64×64 spatial grids, per-channel atmospheric Z-score standardization (znorm), and cyclical day-of-year latitude coordinate embeddings (Sin & Cos).',
    },
    {
      num: '03',
      title: 'RAINFALL FORECASTING MODEL',
      icon: Cpu,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      description: 'U-Net 2D Convolutional Neural Network from the research repository (models64.py). Features 3 downsampling stages (MaxPool + Conv blocks) and 3 upsampling stages with skip connections, totaling 9,191,681 parameters.',
    },
    {
      num: '04',
      title: 'PREDICTION',
      icon: Calculator,
      color: 'text-teal-400',
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      description: 'The neural network outputs a 64×64 normalized precipitation matrix. Inverse min-max normalization (inorm) projects model activations back to physical 24-hour accumulated rainfall depth in millimeters (mm).',
    },
    {
      num: '05',
      title: 'RISK ANALYSIS',
      icon: ShieldAlert,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      description: 'Physical rainfall values are mapped to official meteorological hazard categories (IMD standard criteria): NORMAL (<15.5mm), WATCH (15.6–64.4mm), WARNING (64.5–115.5mm), and SEVERE (>115.5mm).',
    },
    {
      num: '06',
      title: 'EARLY WARNING',
      icon: BellRing,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      description: 'Automated dispatching of actionable warning advisories to disaster management authorities, municipal control rooms, and vulnerable regional zones.',
    },
    {
      num: '07',
      title: 'USER DASHBOARD',
      icon: LayoutDashboard,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      description: 'AquaSentinel Command Center providing real-time interactive forecasts, risk status cards, temporal rainfall trajectories, and Leaflet geographic overlays.',
    },
  ]

  return (
    <div className="flex flex-col gap-10 pb-12">
      {/* ---------------- Header ---------------- */}
      <div className="border-b border-slate-800 pb-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-2">
          <BookOpen size={14} />
          System Architecture & Scientific Methodology
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          How AquaSentinel Works
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl">
          AquaSentinel bridges state-of-the-art environmental deep learning with operational early action,
          encapsulating the peer-reviewed U-Net rainfall forecasting implementation into an integrated decision-support platform.
        </p>
      </div>

      {/* ---------------- Visual Flow Diagram ---------------- */}
      <div className="space-y-4 max-w-4xl mx-auto w-full">
        {pipelineSteps.map((step, idx) => {
          const Icon = step.icon
          const isLast = idx === pipelineSteps.length - 1

          return (
            <div key={step.num} className="flex flex-col items-center">
              <div className={`w-full rounded-2xl border ${step.border} bg-slate-900/60 p-6 backdrop-blur-md shadow-lg transition-all hover:border-cyan-400/50`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${step.bg} ${step.color}`}>
                      <Icon size={24} />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-cyan-400">STAGE {step.num}</span>
                      <h3 className="text-lg font-bold text-white tracking-tight">{step.title}</h3>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mt-3.5 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {!isLast && (
                <div className="my-2 flex flex-col items-center text-cyan-400/60">
                  <div className="h-4 w-0.5 bg-cyan-500/30" />
                  <ArrowDown size={18} className="text-cyan-400" />
                  <div className="h-4 w-0.5 bg-cyan-500/30" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ---------------- Research Provenance & Citation ---------------- */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-8 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-3">
          <Award size={20} className="text-amber-400" />
          <h2 className="text-lg font-bold text-white">Scientific Research Foundation</h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          The core precipitation model is integrated directly from the research repository:
          <br />
          <strong className="text-cyan-300">RainfallForecasting-main</strong> — <em>Data-driven rainfall prediction at a regional scale: a case study with Ghana</em> (Kalita, Vilallonga, & Atchade, 2024, Boston University FORMES Group).
        </p>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-400">
          Kalita, I., Vilallonga, L., & Atchade, Y. (2024). <em>Data-driven rainfall prediction at a regional scale: a case study with Ghana</em>. arXiv preprint arXiv:2410.14062.
        </div>
      </div>
    </div>
  )
}
