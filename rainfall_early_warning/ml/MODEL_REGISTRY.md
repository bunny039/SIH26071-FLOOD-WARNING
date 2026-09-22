# AquaSentinel — Model Registry

## MODEL 1: ConvLSTM Rainfall Forecaster
| Property | Value |
|---|---|
| **Name** | ConvLSTM Rainfall Forecaster |
| **Architecture** | 2-layer ConvLSTM (hidden=[32,64], kernel=3) → Conv2d(64→1) |
| **Framework** | PyTorch |
| **Checkpoint** | `ml/models/checkpoints/best_convlstm.pth` (3.1 MB) |
| **Input** | IMD daily rainfall grid, 7-day sequence |
| **Input shape** | `(B, 7, 1, 129, 135)` |
| **Training dataset** | `IMD_DailyRainfall_Fixed.nc` — last 1000 days, 70/15/15 split |
| **Normalization** | fill(-999)→NaN, clip≥0, log1p, Z-score(mean=0.5657, std=1.0579) |
| **Output** | 1-day rainfall forecast |
| **Output shape** | `(B, 1, 1, 129, 135)` |
| **De-normalization** | inverse Z-score → expm1 → physical mm/day |
| **Loss** | Masked MSE (ignoring NaN land pixels) |
| **Optimizer** | AdamW, lr=0.0001 |
| **Epochs trained** | 2 |
| **Grid** | India 0.25 degree grid (lat 6.5-38.5, lon 66.5-100.0) |
| **Inference function** | `ml/climate/inference.py::ConvLSTMInference.predict()` |
| **Status** | CHECKPOINT EXISTS — Trained 2 epochs (prototype quality) |

---

## MODEL 2: U-Net Rainfall Forecaster (RainfallForecasting-main)
| Property | Value |
|---|---|
| **Name** | U-Net 2D CNN for Quantitative Precipitation Forecasting |
| **Architecture** | U-Net (models64.UNet): 3 down + 3 up blocks, skip connections |
| **Framework** | PyTorch |
| **Checkpoint** | NONE — `Models/` directory is empty |
| **Input** | 57 ERA5 meteo channels + 3 cyclic temporal features |
| **Input shape** | `(B, 57, 64, 64)` |
| **Training dataset** | ERA5 reanalysis + GPM-IMERG precipitation (Ghana, West Africa) |
| **Normalization** | Per-channel Z-score for channels 0-53; raw for 54-56 |
| **Output** | 24h accumulated rainfall grid |
| **Output shape** | `(B, 1, 64, 64)` |
| **Geographic region** | Ghana (NOT India) |
| **Source** | Boston University FORMES group, arXiv:2410.14062 |
| **Status** | NO CHECKPOINT — Architecture-only. Designed for West Africa. |

---

## MODEL 3: U-Net Flood Segmentation
| Property | Value |
|---|---|
| **Name** | U-Net Flood Segmentation from SAR imagery |
| **Architecture** | U-Net (TensorFlow/Keras) |
| **Framework** | TensorFlow 2.x / Keras |
| **Checkpoint** | NONE — `model/` directory has only `.gitkeep` |
| **Input** | Sentinel-1 SAR imagery (VV + VH polarization bands) |
| **Input shape** | `(B, 512, 512, 2)` |
| **Training dataset** | Sen1Floods11 benchmark dataset |
| **Output** | Binary flood probability map |
| **Output shape** | `(B, 512, 512, 1)` |
| **Reported metrics** | Precision=0.836, Recall=0.733, Dice=0.781, IoU=0.641, Acc=0.949 |
| **Status** | NO CHECKPOINT — Must train from notebook with Sen1Floods11 |

---

## MODEL 4: DARPAN Climate State Estimation (ClimateTwinIndia)
| Property | Value |
|---|---|
| **Name** | DARPAN — Dynamic AI Risk Prediction and Analysis Network |
| **Type** | Statistical framework (NOT a neural network) |
| **Method** | Optimal Interpolation: W = B(B + O)^-1 |
| **Framework** | Python (NumPy, Pandas) |
| **Checkpoint** | N/A — no neural network weights |
| **Input** | IMD gridded rainfall/temperature CSV data (2019-2025) |
| **Grid** | 129x135 India grid, 4,964 active land cells |
| **Output** | Climate states, anomaly scores, district-level risk assessments |
| **Validation** | HSS = 0.62 (WMO standard, Jul-Sep held-out) |
| **Status** | OPERATIONAL — Uses pre-computed data, no model loading needed |
