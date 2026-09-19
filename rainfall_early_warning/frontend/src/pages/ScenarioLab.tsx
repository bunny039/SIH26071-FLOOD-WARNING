import React, { useState } from 'react'
import { Beaker, ArrowRight, Activity, Thermometer, Wind, Droplets, RefreshCw } from 'lucide-react'
import { runSimulation, getSamplePrediction } from '../services/api'
import type { BackendPredictionResponse } from '../types'

interface SimParams {
  temperature: number
  relative_humidity: number
  surface_pressure: number
  wind_speed: number
  convective_cape: number
  total_cloud_cover: number
}

const ScenarioLab = () => {
  const [loading, setLoading] = useState(false)
  const [simState, setSimState] = useState<'idle' | 'running' | 'done'>('idle')
  
  const [baseline, setBaseline] = useState<BackendPredictionResponse | null>(null)
  const [scenario, setScenario] = useState<BackendPredictionResponse | null>(null)
  
  // Default base params
  const [params, setParams] = useState<SimParams>({
    temperature: 29.2,
    relative_humidity: 88.5,
    surface_pressure: 1004.8,
    wind_speed: 28.0,
    convective_cape: 1850.0,
    total_cloud_cover: 0.92
  })

  // Load a baseline to compare against
  const loadBaseline = async () => {
    setLoading(true)
    const res = await getSamplePrediction()
    if (res) {
      setBaseline(res)
      setParams({
        temperature: res.meteorological_inputs.temperature_c,
        relative_humidity: res.meteorological_inputs.relative_humidity_pct,
        surface_pressure: res.meteorological_inputs.surface_pressure_hpa,
        wind_speed: res.meteorological_inputs.wind_speed_kmh || 28.0,
        convective_cape: res.meteorological_inputs.convective_cape_jkg,
        total_cloud_cover: res.meteorological_inputs.total_cloud_cover
      })
    }
    setLoading(false)
  }

  // Initial load
  React.useEffect(() => {
    loadBaseline()
  }, [])

  const handleSimulate = async () => {
    setSimState('running')
    // Small artificial delay to show processing steps if desired
    await new Promise(r => setTimeout(r, 600))
    
    try {
      const res = await runSimulation({
        location: "Bhubaneswar", // Keep location constant for simulation
        forecast_horizon: "24 hours",
        temperature: params.temperature,
        relative_humidity: params.relative_humidity,
        surface_pressure: params.surface_pressure,
        wind_speed: params.wind_speed,
        convective_cape: params.convective_cape,
        total_cloud_cover: params.total_cloud_cover
      })
      setScenario(res.data)
      setSimState('done')
    } catch (e) {
      console.error(e)
      setSimState('idle')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light text-cyan-400 flex items-center gap-3 tracking-wide">
          <Beaker className="w-8 h-8" />
          SCENARIO SIMULATOR
        </h1>
        <div className="flex items-center gap-2 text-sm text-cyan-400 bg-cyan-950/30 px-3 py-1 rounded border border-cyan-900/50">
          <Activity className="w-4 h-4" />
          WHAT-IF ANALYSIS ACTIVE
        </div>
      </div>

      <p className="text-slate-400">
        Modify atmospheric input variables to observe how the U-Net model responds. This demonstrates the model's sensitivity to thermodynamic and kinetic parameters.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters Panel */}
        <div className="lg:col-span-4 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg text-white font-medium">Model Inputs</h2>
            <button onClick={loadBaseline} className="text-cyan-400 hover:text-cyan-300 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 flex items-center gap-2"><Thermometer className="w-4 h-4 text-orange-400"/> Temperature (°C)</span>
                <span className="text-white">{params.temperature.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="15" max="45" step="0.1" 
                value={params.temperature}
                onChange={e => setParams({...params, temperature: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Relative Humidity */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400"/> Rel. Humidity (%)</span>
                <span className="text-white">{params.relative_humidity.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="30" max="100" step="0.5" 
                value={params.relative_humidity}
                onChange={e => setParams({...params, relative_humidity: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* CAPE */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400"/> CAPE (J/kg)</span>
                <span className="text-white">{params.convective_cape.toFixed(0)}</span>
              </div>
              <input 
                type="range" min="0" max="4000" step="50" 
                value={params.convective_cape}
                onChange={e => setParams({...params, convective_cape: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Wind Speed */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300 flex items-center gap-2"><Wind className="w-4 h-4 text-emerald-400"/> Wind Speed (km/h)</span>
                <span className="text-white">{params.wind_speed.toFixed(1)}</span>
              </div>
              <input 
                type="range" min="0" max="150" step="1" 
                value={params.wind_speed}
                onChange={e => setParams({...params, wind_speed: parseFloat(e.target.value)})}
                className="w-full accent-cyan-500"
              />
            </div>
          </div>

          <button 
            onClick={handleSimulate}
            disabled={simState === 'running'}
            className="w-full mt-8 bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-medium tracking-wide transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {simState === 'running' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>RUN SCENARIO <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        {/* Results Comparison Panel */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Baseline Card */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-slate-800 text-xs text-slate-300 rounded-bl-lg">BASELINE</div>
              <h3 className="text-xl text-slate-200 mb-4">Original Forecast</h3>
              
              {loading || !baseline ? (
                <div className="flex-1 flex items-center justify-center text-slate-500">Loading baseline...</div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                  <div className="text-6xl font-light" style={{color: baseline.risk_color}}>
                    {baseline.predicted_rainfall.toFixed(1)} <span className="text-2xl text-slate-500">mm</span>
                  </div>
                  <div className="px-4 py-1 rounded-full text-sm font-medium border" 
                       style={{borderColor: baseline.risk_color, color: baseline.risk_color, backgroundColor: `${baseline.risk_color}15`}}>
                    {baseline.risk_level}
                  </div>
                </div>
              )}
            </div>

            {/* Scenario Card */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-900 text-xs text-cyan-200 rounded-bl-lg border-b border-l border-cyan-800">SCENARIO</div>
              <h3 className="text-xl text-white mb-4">Simulated Result</h3>
              
              {simState === 'idle' && !scenario ? (
                <div className="flex-1 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg m-4">
                  Run a scenario to compare
                </div>
              ) : simState === 'running' ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
                  <span className="text-cyan-400 text-sm animate-pulse">EXECUTING U-NET MODEL...</span>
                </div>
              ) : scenario ? (
                <div className="flex flex-col items-center justify-center flex-1 space-y-4">
                  <div className="text-6xl font-light" style={{color: scenario.risk_color}}>
                    {scenario.predicted_rainfall.toFixed(1)} <span className="text-2xl text-slate-500">mm</span>
                  </div>
                  <div className="px-4 py-1 rounded-full text-sm font-medium border" 
                       style={{borderColor: scenario.risk_color, color: scenario.risk_color, backgroundColor: `${scenario.risk_color}15`}}>
                    {scenario.risk_level}
                  </div>
                </div>
              ) : null}
            </div>

          </div>

          {/* Detailed Diff (Only show if scenario exists) */}
          {scenario && baseline && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 p-6">
              <h3 className="text-lg text-white mb-4 border-b border-slate-800 pb-2">Impact Analysis</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-950/50 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Rainfall Delta</div>
                  <div className={`text-2xl ${scenario.predicted_rainfall > baseline.predicted_rainfall ? 'text-red-400' : 'text-emerald-400'}`}>
                    {scenario.predicted_rainfall > baseline.predicted_rainfall ? '+' : ''}
                    {(scenario.predicted_rainfall - baseline.predicted_rainfall).toFixed(1)} mm
                  </div>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">Risk Shift</div>
                  <div className="text-lg text-white flex items-center justify-center gap-2">
                    <span style={{color: baseline.risk_color}}>{baseline.risk_level}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                    <span style={{color: scenario.risk_color}}>{scenario.risk_level}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/50 rounded-lg">
                  <div className="text-slate-400 text-sm mb-1">High Risk Pixels</div>
                  <div className="text-xl text-white">
                    {scenario.grid_summary?.high_risk_pixel_count || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default ScenarioLab
