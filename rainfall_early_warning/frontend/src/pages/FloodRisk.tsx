import { useState, useEffect, useRef } from 'react'
import {
  Waves,
  Search,
  RotateCw,
  Layers,
  ChevronDown,
  ShieldAlert,
  AlertTriangle
} from 'lucide-react'
import { InundationMap } from '../components/flood/InundationMap'
import { FloodEarlyWarningPanel } from '../components/flood/FloodEarlyWarningPanel'
import { SafeSheltersPanel } from '../components/flood/SafeSheltersPanel'
import { EvacuationRoutePanel } from '../components/flood/EvacuationRoutePanel'
import { ModelValidationCard } from '../components/flood/ModelValidationCard'
import {
  analyzeFloodRisk,
  getSafeShelters,
  getEvacuationRoute,
  getFloodCaseStudies
} from '../services/api'
import type {
  FloodAnalyzeResponse,
  ShelterInfo,
  EvacuationRouteResponse,
  FloodCaseStudyLocality
} from '../types'

// Default initial location: Ajit Singh Nagar, Vijayawada (Ground Zero of Sept 2024 Flood)
const DEFAULT_LAT = 16.5385
const DEFAULT_LON = 80.6432
const DEFAULT_NAME = 'Ajit Singh Nagar, Vijayawada'

export function FloodRiskPage() {
  // Coordinate & Selection State
  const [latitude, setLatitude] = useState<number>(DEFAULT_LAT)
  const [longitude, setLongitude] = useState<number>(DEFAULT_LON)
  const [locationName, setLocationName] = useState<string>(DEFAULT_NAME)
  const [scenarioMode, setScenarioMode] = useState<'normal' | 'monsoon_surge' | 'extreme_flood'>('extreme_flood')

  // Case Studies State
  const [caseStudyLocalities, setCaseStudyLocalities] = useState<FloodCaseStudyLocality[]>([])
  const [selectedLocalityName, setSelectedLocalityName] = useState<string>('Ajit Singh Nagar')

  // Analysis & ML Results State
  const [analysis, setAnalysis] = useState<FloodAnalyzeResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Shelters & Routing State
  const [shelters, setShelters] = useState<ShelterInfo[]>([])
  const [isLoadingShelters, setIsLoadingShelters] = useState<boolean>(false)
  const [selectedShelter, setSelectedShelter] = useState<ShelterInfo | null>(null)
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRouteResponse | null>(null)
  const [isRouting, setIsRouting] = useState<boolean>(false)

  // Ref to map container for quick scrolling
  const mapSectionRef = useRef<HTMLDivElement>(null)
  const sheltersSectionRef = useRef<HTMLDivElement>(null)

  // Load Case Study Localities on mount
  useEffect(() => {
    getFloodCaseStudies()
      .then((data) => {
        if (data && data.localities) {
          setCaseStudyLocalities(data.localities)
        }
      })
      .catch(() => {})
  }, [])

  // Run initial flood analysis on mount
  useEffect(() => {
    handleRunAnalysis(DEFAULT_LAT, DEFAULT_LON, DEFAULT_NAME, 'extreme_flood')
  }, [])

  // Handler: Run Flood Inundation & Risk Analysis
  async function handleRunAnalysis(
    lat: number,
    lon: number,
    name: string,
    mode: 'normal' | 'monsoon_surge' | 'extreme_flood' = scenarioMode
  ) {
    setIsAnalyzing(true)
    setAnalysisError(null)
    setEvacuationRoute(null)
    setSelectedShelter(null)

    try {
      const result = await analyzeFloodRisk({
        latitude: lat,
        longitude: lon,
        region: name,
        scenario_mode: mode
      })

      setAnalysis(result)

      // Fetch nearby shelters using flood geographic bounds for exclusion check
      setIsLoadingShelters(true)
      const shelterData = await getSafeShelters(
        lat,
        lon,
        25.0,
        result.geographic_bounds
      )
      setShelters(Array.isArray(shelterData) ? shelterData : ((shelterData as any).shelters || []))
      setIsLoadingShelters(false)
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to complete flood analysis')
      setIsLoadingShelters(false)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handler: Locality Selection from Case Study dropdown
  function handleSelectLocality(localityName: string) {
    const locality = caseStudyLocalities.find((l) => l.name === localityName)
    if (!locality) return

    setSelectedLocalityName(localityName)
    setLatitude(locality.center.lat)
    setLongitude(locality.center.lon)
    setLocationName(`${locality.name}, Vijayawada`)
    handleRunAnalysis(locality.center.lat, locality.center.lon, `${locality.name}, Vijayawada`, scenarioMode)
  }

  // Handler: Calculate Evacuation Route to Selected Shelter
  async function handleSelectShelterForRoute(shelter: ShelterInfo) {
    setSelectedShelter(shelter)
    setIsRouting(true)

    try {
      const routeData = await getEvacuationRoute(
        latitude,
        longitude,
        shelter.lat,
        shelter.lon,
        analysis?.geographic_bounds
      )
      setEvacuationRoute(routeData)

      // Scroll smoothly to map to view the route
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (err: any) {
      console.error('Routing calculation failed', err)
    } finally {
      setIsRouting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Banner */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-widest bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 uppercase">
              Operational Disaster System
            </span>
            <span className="text-xs text-slate-400 font-mono">U-Net v2.4 + IMD Multi-Sensor</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1.5 flex items-center gap-3">
            <Waves className="text-cyan-400" size={28} />
            Flood Inundation & Early Warning Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            High-resolution satellite flood segmentation, multi-sensor risk synthesis, verified safe shelter allocation, and flood-corridor-aware evacuation navigation.
          </p>
        </div>

        {/* Refresh / Re-analyze CTA */}
        <button
          type="button"
          onClick={() => handleRunAnalysis(latitude, longitude, locationName, scenarioMode)}
          disabled={isAnalyzing}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40 transition flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
          {isAnalyzing ? 'Computing Inundation...' : 'Re-Analyze Region'}
        </button>
      </header>

      {/* Control Bar: Location & Case Study Selector */}
      <section className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Case Study Quick Selector */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Monitored Disaster Locality (Sept 2024 Vijayawada)
            </label>
            <div className="relative">
              <select
                value={selectedLocalityName}
                onChange={(e) => handleSelectLocality(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white appearance-none focus:outline-none focus:border-cyan-500 cursor-pointer pr-8"
              >
                {caseStudyLocalities.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} — {loc.peak_flood_pct}% Inundation ({loc.peak_flood_km2} km²)
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Coordinate Inputs */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Latitude (°N)
              </label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Longitude (°E)
              </label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Scenario Simulation Mode */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Simulation Mode
            </label>
            <select
              value={scenarioMode}
              onChange={(e) => {
                const nextMode = e.target.value as any
                setScenarioMode(nextMode)
                handleRunAnalysis(latitude, longitude, locationName, nextMode)
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="extreme_flood">Extreme Flood (Sept 2024)</option>
              <option value="monsoon_surge">Monsoon Surge (+50mm)</option>
              <option value="normal">Normal Baseline</option>
            </select>
          </div>

          {/* Analyze Button */}
          <div className="md:col-span-2 flex items-end">
            <button
              type="button"
              onClick={() => handleRunAnalysis(latitude, longitude, locationName, scenarioMode)}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Search size={14} />
              Run Analysis
            </button>
          </div>
        </div>
      </section>

      {/* Fail-Safe Alert (If coordinates lack satellite coverage) */}
      {analysis && analysis.status === 'unavailable' && (
        <section className="p-4 rounded-2xl bg-amber-950/30 border border-amber-700/60 shadow-xl flex items-start gap-3.5">
          <ShieldAlert size={22} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm text-amber-300">
              Deterministic Fail-Safe Active: Satellite Data Unavailable for Coordinates
            </div>
            <p className="text-amber-200/90 mt-1 leading-relaxed">
              {analysis.message ||
                'High-resolution satellite SAR/optical tiles are not available for these coordinates. Under our disaster safety protocol, synthetic predictions are strictly prohibited.'}
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSelectLocality('Ajit Singh Nagar')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition"
              >
                Load Monitored Vijayawada Ground Truth Case Study
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Analysis Error Alert */}
      {analysisError && (
        <section className="p-4 rounded-2xl bg-red-950/40 border border-red-700/60 shadow-xl flex items-start gap-3.5">
          <AlertTriangle size={22} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm text-red-300">Analysis Error</div>
            <p className="text-red-200/90 mt-1 leading-relaxed">{analysisError}</p>
          </div>
        </section>
      )}

      {/* Main Interactive Map Section */}
      <section ref={mapSectionRef} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers size={18} className="text-cyan-400" />
            Satellite Inundation & Evacuation Map
          </h2>
          <span className="text-xs text-slate-400">
            Click shelter marker to view safety audit & calculate clear evacuation route
          </span>
        </div>

        <InundationMap
          center={[latitude, longitude]}
          zoom={13}
          overlayUri={analysis?.overlay_data_uri}
          bounds={analysis?.geographic_bounds}
          shelters={shelters}
          route={evacuationRoute}
          selectedShelterId={selectedShelter?.id}
          onSelectShelter={handleSelectShelterForRoute}
          userLocationName={locationName}
        />
      </section>

      {/* Routing Loading Indicator */}
      {isRouting && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-blue-500/50 flex items-center justify-center gap-2 text-xs text-blue-300">
          <RotateCw size={14} className="animate-spin" />
          Calculating safe evacuation path avoiding flood corridors...
        </div>
      )}

      {/* Active Evacuation Route Notification (if active) */}
      {evacuationRoute && (
        <EvacuationRoutePanel
          route={evacuationRoute}
          destinationShelter={selectedShelter}
          onClearRoute={() => {
            setEvacuationRoute(null)
            setSelectedShelter(null)
          }}
          onPickAlternate={() => {
            sheltersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        />
      )}

      {/* Early Warning & Multi-Sensor Risk Panel */}
      {analysis && analysis.status === 'success' && (
        <section>
          <FloodEarlyWarningPanel
            data={analysis}
            onViewMapClick={() => {
              mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            onFindSheltersClick={() => {
              sheltersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
        </section>
      )}

      {/* Safe Shelters & Evacuation Section */}
      <section ref={sheltersSectionRef} className="grid grid-cols-1 gap-6">
        <SafeSheltersPanel
          shelters={shelters}
          selectedShelterId={selectedShelter?.id}
          onSelectShelter={handleSelectShelterForRoute}
          isLoading={isLoadingShelters}
        />
      </section>

      {/* Model Integrity & Sen1Floods11 Ground Truth Section */}
      <section>
        <ModelValidationCard />
      </section>
    </div>
  )
}
