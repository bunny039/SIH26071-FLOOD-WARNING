# AquaSentinel 🌧️⚡
### AI-Powered Heavy Rainfall Early Warning & Inundation Risk Platform
**Team NEXORA** | **SIH26071** — *AI/ML-Based Integrated Heavy Rainfall Early Warning and Inundation Prediction System*

---

## 📌 Executive Summary

**AquaSentinel** turns weather intelligence into early action. The platform bridges cutting-edge deep learning research with an operational disaster management interface, enabling municipal agencies, emergency responders, and regional planners to anticipate extreme precipitation events before flash waterlogging and flooding occur.

The core precipitation engine directly integrates and reuses the peer-reviewed **U-Net 2D Convolutional Neural Network (9.19M parameters)** from the research implementation in `RainfallForecasting-main` (Kalita, Vilallonga, & Atchade, 2024, Boston University FORMES Group), fusing multi-level ECMWF ERA5 atmospheric reanalysis with NASA GPM-IMERG satellite data.

---

## 🏛️ System Architecture

```
                 DATA SOURCES
(ECMWF ERA5 Reanalysis + NASA GPM-IMERG Satellite + TIGGE NWP)
                      ↓
               DATA PREPROCESSING
  (Spatial Cubic Zoom to 64x64 + Z-Score Normalization + Cyclic DOY Sin/Cos)
                      ↓
          RAINFALL FORECASTING MODEL
  (U-Net 2D CNN with Skip Connections in RainfallForecasting-main/models64.py)
                      ↓
                  PREDICTION
       (24h Accumulated Physical Rainfall in mm via ut.inorm)
                      ↓
                RISK ANALYSIS
      (IMD Criteria: NORMAL → WATCH → WARNING → SEVERE)
                      ↓
                EARLY WARNING
           (Alert Center & Event Dispatch)
                      ↓
            AQUASENTINEL DASHBOARD
       (Vite + React 19 + TailwindCSS + Leaflet Radar Maps)
```

---

## 📂 Project Structure

```
rainfall_early_warning/
│
├── backend/
│   ├── main.py            # FastAPI application with CORS and routing
│   ├── predictor.py       # Integration bridge directly calling models64.UNet
│   ├── schemas.py         # Pydantic input/output validation schemas
│   └── config.py          # Device configuration, paths, and warning thresholds
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI cards, charts, maps, navigation
│   │   ├── pages/         # 6 Core application pages:
│   │   │   ├── Landing.tsx             # Page 1: Hero & live system status
│   │   │   ├── Dashboard.tsx           # Page 2: Command Center monitor
│   │   │   ├── PredictionPage.tsx      # Page 3: Model Prediction Lab
│   │   │   ├── WeatherIntelligence.tsx # Page 4: 57 Atmospheric variables & trends
│   │   │   ├── Alerts.tsx              # Page 5: Categorized Early Warning alerts
│   │   │   └── HowItWorks.tsx          # Page 6: Scientific architecture & research citation
│   │   ├── services/
│   │   │   └── api.ts     # Unified API service layer connecting to FastAPI
│   │   ├── App.tsx        # React router routing
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── RainfallForecasting-main/  # Existing research model repository (Untouched)
│   ├── models64.py            # UNet architecture definition (9,191,681 parameters)
│   ├── utils.py               # Normalization (znorm, inorm, norm)
│   ├── dataload.py            # ERA5 and GPM data loader
│   ├── Train.py               # Research training script
│   └── Models/                # Checkpoints directory
│
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.10+** (verified on Python 3.12.7 with PyTorch GPU/CUDA support)
- **Node.js 18+** & npm

### 2. Backend Setup (FastAPI)
Open a terminal in `rainfall_early_warning`:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir backend
```
The backend will be live at `http://127.0.0.1:8000`.
Interactive API docs are available at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup (React + Vite)
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173` in your browser.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | System health, operational status, device (CPU/CUDA) |
| `GET` | `/model-info` | Architectural parameters, channel specifications, provenance |
| `POST` | `/predict` | Runs inference using `models64.UNet` on 57 atmospheric channels |
| `GET` | `/sample-prediction` | Pre-calibrated baseline forecast for instant demonstration |
| `GET` | `/locations` | Supported regional monitoring centers |

---

## ⚠️ Hazard Warning Thresholds

Risk classification conforms to official meteorological standards (IMD / WMO standard thresholds for 24-hour accumulated rainfall):

| Category | Rainfall Range | Advisory Level | Action Plan |
|---|---|---|---|
| 🟢 **NORMAL** | $< 15.5\text{ mm}$ | No Warning | Standard operations; no municipal action needed |
| 🟡 **WATCH** | $15.6 - 64.4\text{ mm}$ | Be Updated | Moderate rain; monitor local low-lying areas |
| 🟠 **WARNING** | $64.5 - 115.5\text{ mm}$ | Keep Alert | Heavy downpour; prepare water pumping systems |
| 🔴 **SEVERE** | $> 115.5\text{ mm}$ | Take Immediate Action | Extremely heavy rain; high flash inundation hazard |

---

## 🔬 Scientific Transparency (Phase 11 Compliance)

- **No Fabricated Confidence**: The research U-Net is a deterministic regression network. The platform explicitly reports `confidence: null` / `N/A (Deterministic U-Net)` rather than inventing arbitrary probability numbers.
- **Strict Input Alignment**: The Prediction Lab strictly accepts physical variables consumed by the model pipeline (temperature, pressure, humidity profiles, wind, convective CAPE, cloud fraction).
- **Clear Demo Labeling**: When external live sensors are offline, the dashboard visibly indicates `DEMO DATA ACTIVE` to preserve operational integrity.

---

## 👥 Team & Attribution
- **Team**: NEXORA
- **Problem Statement**: SIH26071
- **Model Reference**: Kalita, I., Vilallonga, L., & Atchade, Y. (2024). *Data-driven rainfall prediction at a regional scale: a case study with Ghana*. arXiv:2410.14062.
