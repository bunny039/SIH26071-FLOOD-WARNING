# Model Inference

# Overview

After training, the U-Net model is deployed on real-world Sentinel-1 SAR imagery to identify flooded regions and generate flood analysis products. Unlike the training phase, inference operates on Sentinel-1 GRD composites acquired for the Vijayawada case study through Google Earth Engine.

The inference pipeline follows exactly the same preprocessing steps used during training to ensure the model receives data with an identical distribution. This consistency is essential for maintaining prediction accuracy. :contentReference[oaicite:0]{index=0}

---

# Inference Workflow

```text
Sentinel-1 SAR Image
        │
        ▼
Load VV & VH Bands
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
Load Trained U-Net
        │
        ▼
Flood Probability Prediction
        │
        ▼
Threshold (0.5)
        │
        ▼
Binary Flood Mask
        │
        ▼
Permanent Water Removal
        │
        ▼
Flood Area Estimation
        │
        ▼
Risk Assessment
        │
        ▼
Visualization
```

---

# Step 1 — Load the Trained Model

The trained U-Net model is loaded from the saved `.keras` file.

The saved model contains:

- Model architecture
- Learned weights
- Optimizer state

Using the saved model allows inference without retraining. :contentReference[oaicite:1]{index=1}

---

# Step 2 — Data Preparation

For every locality and time period:

- Sentinel-1 SAR imagery is downloaded from Google Earth Engine.
- The VV and VH bands are extracted.
- Invalid pixels are removed.
- Both bands are normalized using the same fixed dB ranges as training.
- The image is resized to **512 × 512**.
- The two bands are stacked into a two-channel tensor.

Using identical preprocessing during training and inference prevents distribution mismatch. 

---

# Step 3 — Flood Prediction

The processed image is passed through the trained U-Net using TensorFlow/Keras.

The model outputs a **flood probability map**, where each pixel represents the likelihood of being flooded.

Output Shape:

```text
512 × 512 × 1
```

Values range from **0 to 1**, with higher values indicating a greater probability of flooding. :contentReference[oaicite:3]{index=3}

---

# Step 4 — Binary Flood Mask Generation

The probability map is converted into a binary flood mask using a threshold of **0.5**.

```text
Probability ≥ 0.5 → Flood

Probability < 0.5 → Non-Flood
```

The resulting mask is resized back to the original spatial dimensions using nearest-neighbor interpolation to preserve sharp flood boundaries. 

---

# Step 5 — Permanent Water Removal

The binary flood mask is refined using the **JRC Global Surface Water** dataset.

Pixels identified as permanent water are removed before flood area estimation.

This prevents rivers, lakes, and other permanent water bodies from being counted as newly flooded regions. :contentReference[oaicite:5]{index=5}

---

# Step 6 — Flood Area Estimation

The refined flood mask is used to calculate flood extent.

Each flood pixel corresponds to:

```text
30 m × 30 m = 900 m² = 0.0009 km²
```

The total inundated area is computed by multiplying the number of flood pixels by the area represented by each pixel. :contentReference[oaicite:6]{index=6}

---

# Step 7 — Temporal Flood Analysis

Predictions are generated for multiple observation periods:

- Pre-Flood
- During Flood
- Post-Flood

Pixel-wise comparisons between periods reveal:

- Newly inundated areas
- Flood recession
- Persistent flooding

These change maps help visualize flood progression and recovery over time. :contentReference[oaicite:7]{index=7}

---

# Step 8 — Rainfall-Based Risk Assessment

Flood extent is combined with rainfall data obtained from the Open-Meteo API.

The system computes a rainfall indicator using:

```text
0.7 × Maximum Daily Rainfall
+
0.3 × Mean Daily Rainfall
```

Flood area and rainfall are then combined through a rule-based classifier to assign each locality a flood risk level.

Risk Levels:

- Low Risk
- Medium Risk
- High Risk :contentReference[oaicite:8]{index=8}

---

# Generated Outputs

The inference pipeline produces multiple outputs.

## Spatial Outputs

- Binary flood masks
- Flood probability maps
- Permanent water masks
- Flood change detection maps

## Statistical Outputs

- Flood area tables
- Flood area comparison charts
- Rainfall statistics
- Risk classification tables

## Interactive Outputs

- Folium-based flood risk maps
- Locality markers
- Risk visualization dashboard :contentReference[oaicite:9]{index=9}

---

# Summary

| Stage | Output |
|--------|--------|
| Load Model | Trained U-Net |
| Preprocessing | Normalized SAR Tensor |
| Prediction | Flood Probability Map |
| Thresholding | Binary Flood Mask |
| JRC Mask | Permanent Water Removed |
| Area Calculation | Flood Extent |
| Rainfall Integration | Risk Assessment |
| Visualization | Maps, Charts, Interactive Dashboard |