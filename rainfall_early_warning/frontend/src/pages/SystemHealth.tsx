import { useEffect, useState } from 'react'
import { Activity, Server, Database, BrainCircuit, CheckCircle, XCircle, Clock } from 'lucide-react'
import { getSystemStatus } from '../services/api'

const SystemHealth = () => {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      const data = await getSystemStatus()
      if (data) {
        setStatus(data)
      }
      setLoading(false)
    }
    fetchStatus()
    
    // Auto-refresh every 15s
    const interval = setInterval(fetchStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !status) {
    return <div className="text-cyan-400 flex items-center gap-2"><Activity className="animate-spin w-5 h-5"/> Fetching system telemetry...</div>
  }

  const renderStatusIcon = (state: string) => {
    if (state === 'ONLINE' || state === 'AVAILABLE') return <CheckCircle className="w-5 h-5 text-emerald-400" />
    return <XCircle className="w-5 h-5 text-slate-500" />
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light text-cyan-400 flex items-center gap-3 tracking-wide">
          <Server className="w-8 h-8" />
          SYSTEM TELEMETRY
        </h1>
        <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded border ${status?.status === 'OPERATIONAL' ? 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' : 'text-orange-400 bg-orange-950/30 border-orange-900/50'}`}>
          <Activity className="w-4 h-4" />
          {status?.status || 'DEGRADED'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Infrastructure */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            Core Infrastructure
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-slate-300 font-medium">Frontend Server</span>
                <span className="text-xs text-slate-500">React / Vite</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-cyan-400">{status?.components?.frontend?.latency_ms || '--'} ms</span>
                {renderStatusIcon(status?.components?.frontend?.status || 'OFFLINE')}
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-slate-300 font-medium">FastAPI Backend</span>
                <span className="text-xs text-slate-500">Python 3.10 / Uvicorn</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-cyan-400">{status?.components?.backend?.latency_ms || '--'} ms</span>
                {renderStatusIcon(status?.components?.backend?.status || 'OFFLINE')}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-slate-300 font-medium">Data Pipeline</span>
                <span className="text-xs text-slate-500">Sync: {status?.components?.data_pipeline?.last_sync || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-4">
                {renderStatusIcon(status?.components?.data_pipeline?.status || 'OFFLINE')}
              </div>
            </div>
          </div>
        </div>

        {/* Prediction Engine */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            AI Prediction Engine
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
              <div className="flex flex-col">
                <span className="text-slate-300 font-medium">U-Net Architecture</span>
                <span className="text-xs text-slate-500">{status?.components?.prediction_engine?.model_version || 'Not detected'}</span>
              </div>
              <div className="flex items-center gap-4">
                {renderStatusIcon(status?.components?.prediction_engine?.status || 'OFFLINE')}
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-purple-950/20 border border-purple-900/30 rounded-lg">
              <h3 className="text-sm font-medium text-purple-300 mb-2">Model Validation (Synthetic RMSE)</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-light text-white">40.2</span>
                <span className="text-slate-400 mb-1">mm</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Evaluated on 10 random synthetic days. Re-run backend/evaluate_model.py for actual physics evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="md:col-span-2 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
          <h2 className="text-lg text-white font-medium mb-6 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Data Ingestion Sources
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['GPM', 'ERA5', 'Radar'].map((source) => (
              <div key={source} className="p-4 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-slate-200 font-medium">{source}</span>
                  {renderStatusIcon(status?.data_sources?.[source]?.status || 'NOT CONNECTED')}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-4">
                  <Clock className="w-3 h-3" />
                  Last update: {status?.data_sources?.[source]?.last_update || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemHealth
