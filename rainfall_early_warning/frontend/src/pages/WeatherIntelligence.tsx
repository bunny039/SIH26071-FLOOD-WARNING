import {
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Zap,
  Cloud,
  Layers
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

export function WeatherIntelligencePage() {

  const trendData = [
    { hour: '00:00', rainfall: 4.2, temp: 26.2, humidity: 91, pressure: 1007.8 },
    { hour: '03:00', rainfall: 9.5, temp: 25.8, humidity: 94, pressure: 1007.1 },
    { hour: '06:00', rainfall: 22.8, temp: 26.5, humidity: 92, pressure: 1006.5 },
    { hour: '09:00', rainfall: 45.1, temp: 28.1, humidity: 88, pressure: 1005.9 },
    { hour: '12:00', rainfall: 78.4, temp: 29.5, humidity: 85, pressure: 1004.8 },
    { hour: '15:00', rainfall: 89.2, temp: 29.0, humidity: 86, pressure: 1005.2 },
    { hour: '18:00', rainfall: 96.0, temp: 27.8, humidity: 89, pressure: 1006.0 },
    { hour: '21:00', rainfall: 100.5, temp: 27.0, humidity: 90, pressure: 1006.9 },
  ]

  const variables = [
    {
      id: 'rainfall',
      name: 'Accumulated Rainfall',
      channelInfo: 'NASA GPM-IMERG (precipitationCal)',
      value: '100.5 mm',
      status: 'High Accumulation',
      icon: CloudRain,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      description: 'Physical ground truth target de-normalized from U-Net CNN predictions.'
    },
    {
      id: 'temp',
      name: '2m Surface Temperature (t2m)',
      channelInfo: 'ERA5 Channel 3 (Z-Score Normalized)',
      value: '29.2 °C',
      status: 'Tropical Convective',
      icon: Thermometer,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      description: 'Sensible heat flux driver of regional boundary layer moisture convergence.'
    },
    {
      id: 'humidity',
      name: 'Relative Humidity Profile (r)',
      channelInfo: 'ERA5 Channels across 7 vertical levels',
      value: '88.5 %',
      status: 'Near Saturation',
      icon: Droplets,
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      description: 'Column moisture content across 300, 500, 600, 700, 850, 925, 950 hPa levels.'
    },
    {
      id: 'pressure',
      name: 'Surface Pressure (sp)',
      channelInfo: 'ERA5 Channel 2',
      value: '1004.8 hPa',
      status: 'Depression / Low Pressure',
      icon: Gauge,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      description: 'Barometric indicator of monsoon depression and cyclonic vorticity.'
    },
    {
      id: 'wind',
      name: 'Wind Components (u, v)',
      channelInfo: 'ERA5 Channels u300-u950 & v300-v950',
      value: '28.0 km/h',
      status: 'Strong Convergence',
      icon: Wind,
      color: 'text-teal-400',
      border: 'border-teal-500/30',
      description: 'Zonal and meridional kinematic wind fields supplying maritime moisture advection.'
    },
    {
      id: 'cape',
      name: 'Convective CAPE',
      channelInfo: 'ERA5 Channel 0',
      value: '1850 J/kg',
      status: 'Severe Instability',
      icon: Zap,
      color: 'text-yellow-400',
      border: 'border-yellow-500/30',
      description: 'Convective Available Potential Energy fueling deep storm updrafts.'
    },
    {
      id: 'cloud',
      name: 'Total Cloud Cover (tcc)',
      channelInfo: 'ERA5 Channel 5',
      value: '0.92 (92%)',
      status: 'Overcast Cloud Shield',
      icon: Cloud,
      color: 'text-slate-300',
      border: 'border-slate-600/30',
      description: 'Integrated cloud fraction modulating solar radiative cooling.'
    },
    {
      id: 'spatiotemporal',
      name: 'Spatio-Temporal Cyclic Encodings',
      channelInfo: 'Channels 54, 55, 56 (Sin, Cos, Month)',
      value: 'Day 205 (July)',
      status: 'Monsoon Peak',
      icon: Layers,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      description: 'Sin(2π·DOY/365)·lat and Cos(2π·DOY/365)·lat encoding regional climatological seasonality.'
    }
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ---------------- Header ---------------- */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Weather Intelligence
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Meteorological parameters and vertical atmospheric layers consumed by the AquaSentinel U-Net pipeline.
          Only parameters physically present in the research model are featured.
        </p>
      </div>

      {/* ---------------- Trend Chart ---------------- */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              24-Hour Multi-Parameter Meteorological Trend
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evolution of physical parameters leading to heavy rainfall accumulation
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 text-cyan-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-cyan-400" /> Rainfall (mm)
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400 font-semibold ml-3">
              <span className="h-2 w-2 rounded-full bg-rose-400" /> Temp (°C)
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="rainfall"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 4, fill: '#06b6d4' }}
                name="Rainfall (mm)"
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f43f5e' }}
                name="Temperature (°C)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ---------------- Meteorological Variables Grid ---------------- */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4">
          Atmospheric Input Channels (57 Total)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {variables.map((v) => {
            const Icon = v.icon
            return (
              <div
                key={v.id}
                className={`rounded-2xl border ${v.border} bg-slate-900/50 p-5 backdrop-blur-md flex flex-col justify-between transition-all hover:border-cyan-400/50`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl bg-slate-950 ${v.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {v.channelInfo.split(' ')[0]}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{v.name}</h3>
                  <div className="text-xl font-extrabold text-white mt-1">{v.value}</div>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{v.description}</p>
                </div>

                <div className="border-t border-slate-800/80 pt-3 mt-4 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Atmospheric State:</span>
                  <span className="font-semibold text-cyan-300">{v.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
