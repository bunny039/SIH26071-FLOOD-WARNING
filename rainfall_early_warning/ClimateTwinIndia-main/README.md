# DARPAN — Climate State Estimation & Risk Intelligence Framework

**Dynamic AI Risk Prediction and Analysis Network**  
*State Estimation and Risk Inference Layer for India's Climate Digital Twin*

---

![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue)
![License: MIT](https://img.shields.io/badge/License-MIT-green)
![Data: IMD 2019–2025](https://img.shields.io/badge/Data-IMD%202019--2025-orange)
![HSS: 0.62](https://img.shields.io/badge/HSS-0.62%20WMO%20Standard-brightgreen)
![Climate States: 34,748](https://img.shields.io/badge/Climate%20States-34%2C748-blue)
![Grid: 4,964 Land Cells](https://img.shields.io/badge/Grid-4%2C964%20Land%20Cells-blueviolet)

---

## Executive Summary

India operates 650+ surface observatories, INSAT-3D satellites at 15-minute temporal resolution, and decade-long IMDAA reanalysis archives. Forecasting models run continuously. Yet no unified, uncertainty-aware climate state exists that converts these observations into shared, decision-ready intelligence.

**DARPAN solves a climate state integration problem, not a forecasting problem.**

The platform ingests multi-source Indian Meteorological Department (IMD) gridded archives, constructs spatially continuous climate states using Optimal Interpolation (OI) analysis, propagates observational uncertainty through every layer of the pipeline, and produces district-level hydrological risk assessments with quantified confidence intervals. Every output is traceable to source observations.

DARPAN is designed as the **state estimation and risk inference foundation layer** of a Climate Digital Twin for India — the missing link between raw Earth observation data and evidence-based operational decisions.

---

## Why DARPAN is Different

| Dimension | Weather Forecasting | Climate Analytics | DARPAN (Climate State Intelligence) |
|---|---|---|---|
| **Primary Output** | Future conditions | Historical trends | Current state with uncertainty |
| **Time Horizon** | +1 to +15 days | Decadal | Now (continuously updated) |
| **Uncertainty** | Ensemble spread | Trend confidence | Propagated per cell per layer |
| **Decision Interface** | Probabilistic forecast | Statistical summary | District risk with confidence score |
| **Integration** | Model-dependent | Archive-dependent | Observation-fused, source-agnostic |
| **Scalability** | NWP infrastructure | Offline batch | Modular, free-tier deployable |

Existing systems — IMD NWP, NCMRWF global models, IITM Earth System Models — produce accurate forecasts. DARPAN produces the **current climate state**: what is happening now, how confident we are, and what risk that implies for each district. These are complementary, not competing, functions.

---

## Key Capabilities

### 1. Observation Quality Layer
Cross-source consistency analysis across IMD surface observatories, gridded rainfall products (0.25°), gridded temperature products (1°), and INSAT-3D retrievals. Outputs per-cell quality scores (0–1) and anomaly flags. Applies range checks, spike detection, temporal consistency validation, and completeness scoring.

### 2. Optimal Interpolation Engine
Implements the classical OI state estimation framework:

$$W = B(B + O)^{-1}$$

where **B** is the background error covariance (derived from multi-year climatological variance with Gaussian spatial correlation) and **O** is the observation error covariance. Merges IMD climatological background with quality-weighted observations to produce a spatially complete climate state at each grid cell.

### 3. National Climate State Grid
Constructs a 129 × 135 India-wide grid with 4,964 active land cells at ~12 km effective resolution. Each cell carries mean state estimate and propagated standard deviation (σ). Covers the full Indian mainland across 7 years of continuous archive (2019–2025), generating 34,748+ climate state snapshots.

### 4. Hydrological Risk Engine
Translates climate state anomalies into operational flood risk probability:

- **P(>64mm)** — IMD moderate rainfall threshold, district flood risk
- **P(>115mm)** — IMD heavy rainfall threshold, extreme event detection
- **Risk Score (0–10)** — composite anomaly-weighted district risk index
- **Confidence Interval** — 1 − σ_normalized, propagated from OI analysis

Outputs district-level risk probability with associated confidence at every update cycle.

### 5. Calibrated Verification Framework
Validates forecast and risk outputs against held-out observational data using WMO-standard categorical verification metrics. Current performance: **HSS = 0.62** on Jul–Sep held-out periods across 2019–2025, consistent across monsoon seasons.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DARPAN PIPELINE                                  │
│            From Raw Observations → Decisions with Confidence            │
└─────────────────────────────────────────────────────────────────────────┘

  [1] OBSERVATIONS          [2] QUALITY LAYER        [3] CLIMATE STATE ENGINE
  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
  │ IMD Rainfall     │      │ Agreement Check  │      │ W = B(B + O)⁻¹       │
  │ (0.25° gridded)  │─────▶│ Reliability Score│─────▶│                      │
  │ IMD Temperature  │      │ Temporal Consist.│      │ Background (Clim.)   │
  │ (1° gridded)     │      │ Outlier Filtering│      │ + Observation Layer  │
  │ INSAT-3D LST/SST │      │ Completeness     │      │                      │
  │ MOSDAC Products  │      │                  │      │ OUTPUT:              │
  │                  │      │ OUTPUT:          │      │ Climate State Grid   │
  │ 34,748+ Records  │      │ Quality Score    │      │ 4,964 Land Cells     │
  │ 2019–2025        │      │ per Cell (0–1)   │      │ Mean ± σ per Cell    │
  └──────────────────┘      └──────────────────┘      └──────────┬───────────┘
                                                                  │
                   ┌──────────────────────────────────────────────┘
                   ▼
  [4] RISK ENGINE           [5] QUERY API            [6] DECISION INTERFACE
  ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────────┐
  │ Threshold Anal.  │      │ RESTful API      │      │ Interactive Maps      │
  │ P(>64mm)         │─────▶│ State/Forecast/  │─────▶│ Risk Maps (India)     │
  │ P(>115mm)        │      │ Risk Access      │      │ Time Series + σ bands │
  │ Exposure Mapping │      │ JSON/CSV Output  │      │ District Risk Table   │
  │ District Aggreg. │      │ API Key Auth     │      │ Alerts & Notif.       │
  │                  │      │                  │      │                       │
  │ OUTPUT:          │      │ OUTPUT:          │      │ OUTPUT:               │
  │ P & Confidence   │      │ Data Access API  │      │ Actionable Insights   │
  └──────────────────┘      └──────────────────┘      └──────────────────────┘

─────────────────────── UNCERTAINTY PROPAGATION ────────────────────────────
  Measurement Unc. → Observation Unc. → State Unc. → Risk Unc. → Decision
  (Instrument)       (Quality Layer)    (OI Analysis)  (Threshold)  (Confidence)
────────────────────────────────────────────────────────────────────────────
```

---

## DARPAN as a Climate Digital Twin Foundation Layer

A Climate Digital Twin requires three foundational capabilities: real-time state estimation, physics-informed risk inference, and a shared uncertainty-aware interface for decision systems. DARPAN directly implements the first two.

```
CLIMATE DIGITAL TWIN FOR INDIA
────────────────────────────────────────────────────────────────────
  LAYER 4: Scenario Simulation & Policy Interface   [Future]
  LAYER 3: AI Forecasting & Temporal Propagation   [In Progress]
  ─────────────────────────────────────────────────────────────
  LAYER 2: Risk Inference & Decision Support        ✅ BUILT
  LAYER 1: Climate State Estimation (OI Engine)     ✅ BUILT  ← DARPAN
  ─────────────────────────────────────────────────────────────
  DATA:   IMD | INSAT-3D | IMDAA | MOSDAC          ✅ INTEGRATED
────────────────────────────────────────────────────────────────────
```

Without a continuously updated, uncertainty-aware climate state, upper layers of any digital twin operate on stale or unverified inputs. DARPAN closes this gap by providing a shared state object that any downstream model, forecasting system, or decision interface can query.

---

## Dataset Statistics

| Attribute | Value |
|---|---|
| **Spatial Coverage** | 7.75°N – 36.75°N, 68.00°E – 97.25°E |
| **Grid Resolution** | ~12 km (~0.25° rainfall, ~1° temperature) |
| **Grid Dimensions** | 129 × 135 (4,964 active land cells) |
| **Temporal Coverage** | 2019 – 2025 (7 years) |
| **Climate States Generated** | 34,748+ |
| **Primary Data Source** | IMD gridded products (rainfall 0.25°, temperature 1°) |
| **Satellite Integration** | INSAT-3D LST, INSAT-3D SST (via MOSDAC) |
| **Data Cost** | ₹0 (open national archives) |
| **Storage Format** | NetCDF / Zarr |

---

## Validation

DARPAN outputs are validated against held-out observational data using the Heidke Skill Score (HSS), the WMO standard metric for categorical climate verification.

**Verification Protocol:**
- Hold-out period: July – September (peak monsoon) across 2019–2025
- Target variable: Binary flood risk classification at P(rainfall > 64mm in 7 days)
- Baseline: Climatological frequency (no-skill reference)

**Results:**

| Metric | Value | Benchmark |
|---|---|---|
| **Heidke Skill Score (HSS)** | **0.62** | WMO operational standard: >0.40 |
| **Quality Layer Agreement Score** | 0.78 | Cross-source IMD consistency |
| **High-Risk Districts Identified** | 12 | P > 64mm, Monsoon 2024 |
| **Extreme Risk Zones (2025)** | 3 | Risk Score > 9.0 |
| **Total Hotspots Detected (2025)** | 13 | Geographically coherent clusters |

HSS = 0.62 represents substantial skill above climatological baseline across six monsoon seasons. Detected hotspots form geographically coherent anomaly clusters, not isolated statistical artefacts, consistent with known high-precipitation zones in the Western Ghats, Northeast India, and the Indo-Gangetic Plain.

---

## Results — 2025 Climate Risk Assessment

```
NATIONAL RISK SUMMARY (2025)
────────────────────────────────────────────────
  Climate States Generated:    34,748+
  Active Grid Cells:           4,964
  Risk Hotspots Detected:      13
  Extreme Risk Zones:           3  (Risk Score > 9.0)
  High Risk Zones:             10  (Risk Score 6.0–9.0)
  Maximum Risk Score:          11.49
  Average Confidence:           0.72  (1 – σ_normalized)
  Wettest Day (2024 Archive):  Day 215 (02 Aug 2024)
  Mean State Rainfall (India): 15.83 mm/day
────────────────────────────────────────────────
```

Detected anomaly clusters are consistent with the 2023 monsoon pattern: IMD seasonal forecasts were within 4% of actual all-India rainfall, yet flood damage exceeded ₹15,000 crore. DARPAN's risk intelligence layer is designed precisely for this gap — translating accurate aggregate forecasts into district-level risk with quantified confidence.

---

## Repository Structure

```
ClimateTwinIndia/
│
├── src/
│   ├── ingestion/
│   │   ├── imd_rainfall_loader.py       # IMD 0.25° gridded rainfall ingestion
│   │   ├── imd_temperature_loader.py    # IMD 1° gridded temperature ingestion
│   │   └── quality_preprocessor.py      # Metadata tagging and format normalization
│   │
│   ├── quality_layer/
│   │   ├── agreement_check.py           # Cross-source IMD consistency scoring
│   │   ├── outlier_filter.py            # Range, spike, temporal anomaly detection
│   │   └── completeness_scorer.py       # Per-cell data completeness scoring
│   │
│   ├── oi_engine/
│   │   ├── background_covariance.py     # B matrix construction from climatology
│   │   ├── observation_covariance.py    # O matrix from quality scores
│   │   ├── optimal_interpolation.py     # W = B(B+O)⁻¹ implementation
│   │   └── climate_state_grid.py        # Climate state object (mean ± σ per cell)
│   │
│   ├── risk_engine/
│   │   ├── flood_risk_engine.py         # P(>64mm), P(>115mm) computation
│   │   ├── hotspot_detector.py          # Spatial anomaly clustering
│   │   ├── district_aggregator.py       # Grid-to-district spatial aggregation
│   │   └── risk_scorer.py              # Composite risk score (0–10)
│   │
│   ├── verification/
│   │   ├── hss_calculator.py            # WMO Heidke Skill Score
│   │   └── validation_framework.py     # Held-out period evaluation
│   │
│   └── dashboard/
│       ├── app.py                       # Streamlit decision interface
│       ├── india_anomaly_map.py         # Folium choropleth — national view
│       └── district_risk_table.py       # Risk table with confidence intervals
│
├── notebooks/
│   ├── 01_data_ingestion.ipynb
│   ├── 02_climate_state_construction.ipynb
│   ├── 03_oi_analysis.ipynb
│   ├── 04_flood_risk_engine.ipynb
│   ├── 05_hotspot_detection.ipynb
│   └── 06_validation_hss.ipynb
│
├── data/
│   └── README.md                        # Data access instructions (IMD, MOSDAC)
│
├── outputs/
│   ├── climate_states/                  # NetCDF climate state archive
│   ├── risk_maps/                       # District risk probability outputs
│   └── verification/                    # HSS tables, confusion matrices
│
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Implementation Status

| Component | Status | Notes |
|---|---|---|
| Data Ingestion (IMD Rainfall + Temperature) | ✅ Built | 34,748+ records, 2019–2025 |
| India Grid Extraction (4,964 land cells) | ✅ Built | 129×135, land-masked |
| Climate State Object (Mean ± σ) | ✅ Built | Full national grid |
| Quality / Reliability Layer | ✅ Built | Agreement score: 0.78 |
| Flood Risk Engine (P>64mm) | ✅ Built | 12 high-risk districts |
| Calibrated Verification (HSS) | ✅ Built | HSS = 0.62, Jul–Sep 2019–2025 |
| Forecast Engine (+7 Days) | 🔶 Prototype Ready | XGBoost + LSTM |
| Decision Dashboard | 🔶 Prototype Available | Streamlit + Folium |
| INSAT-3D / MOSDAC Integration | 🔵 In Progress | LST/SST pipeline |
| Agricultural Impact Engine | ○ Designed | Phase II |
| Heat Health Engine | ○ Designed | Phase II |
| National-Scale Operations Pipeline | ○ Designed | Phase III |

---

## Quickstart

```bash
git clone https://github.com/aadityat23/ClimateTwinIndia.git
cd ClimateTwinIndia
pip install -r requirements.txt
```

**Run climate state construction:**
```python
from src.oi_engine.optimal_interpolation import build_climate_state
from src.ingestion.imd_rainfall_loader import load_imd_rainfall

rainfall = load_imd_rainfall(year=2024)
state = build_climate_state(observations=rainfall, year=2024)
print(state.summary())  # Mean ± σ per active land cell
```

**Run flood risk assessment:**
```python
from src.risk_engine.flood_risk_engine import compute_district_flood_risk

risk_df = compute_district_flood_risk(state, threshold_mm=64)
print(risk_df[['district', 'flood_probability', 'confidence', 'risk_level']])
```

**Launch dashboard:**
```bash
streamlit run src/dashboard/app.py
```

---

## Core Dependencies

```
numpy>=1.24        # Numerical grid operations
pandas>=2.0        # Tabular data processing
xarray>=2023.6     # NetCDF climate state management
scipy>=1.11        # OI engine, spatial interpolation
xgboost>=1.7       # Tabular forecast model
torch>=2.0         # LSTM sequence model
fastapi>=0.100     # State Query API
streamlit>=1.28    # Decision dashboard
folium>=0.14       # India risk choropleth maps
docker             # Containerized deployment
```

---

## Future Research Directions

### Near-Term (Phase II)
- **Agricultural Impact Engine:** Crop stress index computation from soil moisture state anomalies; integration with Kharif/Rabi sowing calendars for district-level advisory generation.
- **Heat Health Engine:** Compound heat-humidity risk scoring (Wet Bulb Globe Temperature proxy) from temperature state layer; urban vulnerability overlay.
- **Multi-Year HSS Stability Analysis:** Systematic verification across non-monsoon seasons and drought years to characterize false positive rates under anomalous baseline conditions.

### Medium-Term (Phase III)
- **AI Forecasting Layer:** Autoregressive climate state forecasting using LSTM sequence models trained on OI state sequences; target: 7–14 day district risk trajectory with propagated uncertainty.
- **INSAT-3D Deep Integration:** Full pipeline ingestion of 15-minute LST/SST retrievals from MOSDAC; fusion with IMD surface data via multi-source OI analysis.
- **B Matrix Refinement:** Replace diagonal climatological variance with spatially correlated background covariance estimated from IMDAA reanalysis ensemble spread.

### Long-Term (Phase IV)
- **Climate Digital Twin Integration:** DARPAN state layer serving as the real-time input interface for coupled physical-statistical models; bidirectional state update via ensemble Kalman filter.
- **National-Scale Operational Pipeline:** Automated daily state update with sub-24-hour data latency; real-time alerting system for NDMA, CWC, and state disaster management authorities.
- **Open Climate State API:** Public API serving current India climate state, district risk, and uncertainty fields — an open-source alternative to proprietary climate intelligence platforms.

---

## Scientific References

- Gandin, L.S. (1965). *Objective Analysis of Meteorological Fields.* Israel Program for Scientific Translations.
- Wilks, D.S. (2011). *Statistical Methods in the Atmospheric Sciences* (3rd ed.). Academic Press. [HSS formulation]
- IMD Gridded Rainfall Data: Pai et al. (2014). *Development of a new high spatial resolution (0.25° × 0.25°) long period (1901–2010) daily gridded rainfall data set over India.* Climate Dynamics.
- WMO (2008). *Guide to Meteorological Instruments and Methods of Observation.* WMO-No. 8. [Verification metrics standard]
- Srinivasan, G. & Gadgil, S. (2002). *Large-scale features of the Indian summer monsoon.* Meteorology and Atmospheric Physics.

---

## Data Access

| Source | Product | Access | Format |
|---|---|---|---|
| IMD | Gridded Rainfall (0.25°) | [imdpune.gov.in](https://imdpune.gov.in) | NetCDF |
| IMD | Gridded Temperature (1°) | [imdpune.gov.in](https://imdpune.gov.in) | NetCDF |
| MOSDAC | INSAT-3D LST / SST | [mosdac.gov.in](https://mosdac.gov.in) | HDF5 |
| IMDAA | Reanalysis (12km) | [rds.ncmrwf.gov.in](https://rds.ncmrwf.gov.in) | GRIB2 |

All primary data sources are openly accessible through Indian national agency portals. No proprietary or restricted data is required for core pipeline operation.

---

## Citation

If you use DARPAN in your research, please cite:

```bibtex
@software{darpan2025,
  author       = {Thokal, Aaditya Anand},
  title        = {DARPAN: Climate State Estimation and Risk Intelligence Framework},
  year         = {2025},
  publisher    = {GitHub},
  url          = {https://github.com/aadityat23/ClimateTwinIndia},
  note         = {State estimation and risk inference layer for India's Climate Digital Twin}
}
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.

Data products are derived from publicly available Indian national climate archives.
Users are responsible for compliance with IMD and MOSDAC data use policies.

---

*DARPAN is not a forecasting tool. It is a climate state system.*  
*The dashboard is not the product. The climate state is the product.*
