# Dataset Documentation

# Sen1Floods11 Dataset

## Overview

This project uses the **Sen1Floods11** dataset as the primary dataset for training and evaluating the deep learning model for flood segmentation.

Sen1Floods11 is a publicly available benchmark dataset developed specifically for flood mapping using Sentinel-1 Synthetic Aperture Radar (SAR) imagery. It provides globally distributed flood events together with pixel-level annotations, making it well suited for supervised semantic segmentation tasks. The project first trains the model on Sen1Floods11 to learn generalized flood patterns and then applies the trained model to a real-world case study over Vijayawada, India. :contentReference[oaicite:0]{index=0}

---

# Why Sen1Floods11?

Flood detection models trained on imagery from a single geographic region often fail to generalize to other locations because SAR backscatter characteristics vary with terrain, vegetation, land cover, and acquisition conditions.

To address this challenge, the project adopts a two-phase strategy:

- **Phase I:** Train a U-Net model using the globally distributed Sen1Floods11 dataset.
- **Phase II:** Apply the trained model to Sentinel-1 SAR imagery acquired over Vijayawada for flood monitoring and risk assessment.

Training on a diverse dataset before local deployment improves the model's ability to recognize flood patterns across varying environmental conditions. :contentReference[oaicite:1]{index=1}

---

# Dataset Contents

The dataset consists of:

- Sentinel-1 SAR imagery
- Pixel-level flood masks
- Binary segmentation labels
- Training, validation, and testing splits

Each training sample contains paired SAR imagery and the corresponding flood segmentation mask.

---

# Satellite Data

The SAR images originate from the **Sentinel-1** mission operated by the European Space Agency (ESA).

The project uses both available SAR polarization channels:

- VV (Vertical Transmit – Vertical Receive)
- VH (Vertical Transmit – Horizontal Receive)

Using both channels provides richer information than a single channel and helps distinguish flooded regions from urban shadows and smooth surfaces. :contentReference[oaicite:2]{index=2}

---

# Data Used During Deployment

For the Vijayawada case study, Sentinel-1 GRD imagery is downloaded from **Google Earth Engine**.

The workflow filters imagery based on:

- Geographic bounding box
- Date range
- Instrument Mode (IW)
- VV polarization
- VH polarization

A temporal mean composite is then generated and exported as a two-band GeoTIFF for downstream processing. :contentReference[oaicite:3]{index=3}

---

# Additional Data Sources

The project also integrates two additional datasets during inference:

## JRC Global Surface Water

The JRC Global Surface Water dataset is used to identify permanent water bodies.

Pixels with an occurrence value greater than 80% are treated as permanent water and removed from the predicted flood mask during post-processing to avoid counting rivers and lakes as newly flooded regions. :contentReference[oaicite:4]{index=4}

---

## Open-Meteo API

Historical precipitation data is retrieved from the Open-Meteo API.

Daily rainfall values are combined with flood extent statistics to estimate flood severity and generate locality-wise risk assessments. :contentReference[oaicite:5]{index=5}

---

# Data Preparation Pipeline

The preprocessing pipeline applied before model training includes:

- Handling invalid (NaN and infinite) values
- VV band normalization
- VH band normalization
- Spatial resizing to 512 × 512 pixels
- Channel stacking
- Batch preparation

The same preprocessing strategy is applied during both training and inference to ensure consistency between the learned model and deployment data. 

---

# Dataset Workflow

```
Sen1Floods11
        │
        ▼
SAR Image Loading
        │
        ▼
Preprocessing
        │
        ▼
Normalization
        │
        ▼
Resize (512 × 512)
        │
        ▼
Channel Stacking
        │
        ▼
Training Dataset
        │
        ▼
U-Net Model
```

---

# Summary

| Item | Description |
|------|-------------|
| Primary Dataset | Sen1Floods11 |
| Satellite | Sentinel-1 SAR |
| Polarizations | VV and VH |
| Task | Flood Segmentation |
| Labels | Binary Flood Masks |
| Input Size | 512 × 512 × 2 |
| Output | 512 × 512 Binary Flood Mask |
| Deployment Data | Sentinel-1 GRD from Google Earth Engine |
| Additional Sources | JRC Global Surface Water, Open-Meteo API |

---

# References

- Sen1Floods11 Dataset
- Sentinel-1 Mission (ESA)
- Google Earth Engine
- JRC Global Surface Water Dataset
- Open-Meteo API