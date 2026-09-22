# System Architecture

# Overview

The proposed flood monitoring system is designed as a sequential seven-stage pipeline that transforms raw Sentinel-1 Synthetic Aperture Radar (SAR) imagery into flood maps, flood statistics, and locality-wise risk assessments.

Unlike traditional threshold-based flood detection techniques, this framework combines deep learning, geospatial processing, rainfall analysis, and post-processing into a single end-to-end workflow. Each stage has clearly defined inputs and outputs, allowing the system to be tested, maintained, and extended independently. :contentReference[oaicite:0]{index=0}

---

# Overall System Workflow

```
                Sentinel-1 SAR Imagery
                         │
                         ▼
            Google Earth Engine Acquisition
                         │
                         ▼
        Preprocessing & Normalization
                         │
                         ▼
            U-Net Flood Segmentation
                         │
                         ▼
               Post Processing
                         │
                         ▼
      Flood Area Quantification
                         │
                         ▼
        Rainfall Risk Assessment
                         │
                         ▼
     Maps, Statistics & Visualizations
```

---

# Seven-Block Architecture

The complete system consists of seven functional modules.

## Block 1 — Data Acquisition

The first stage collects all required remote sensing and meteorological data.

### Input Sources

- Sentinel-1 GRD imagery
- Google Earth Engine
- Open-Meteo API
- JRC Global Surface Water Dataset

Google Earth Engine is used to retrieve Sentinel-1 SAR imagery filtered by:

- Geographic region
- Date range
- Instrument Mode (IW)
- VV polarization
- VH polarization

Multiple acquisitions are combined into temporal composites before export.

The Open-Meteo API provides daily precipitation values used later during flood risk assessment, while the JRC Global Surface Water dataset supplies permanent water information used during post-processing. 

---

## Block 2 — Preprocessing and Normalization

Before entering the neural network, all SAR imagery undergoes preprocessing.

The preprocessing pipeline performs:

- Invalid value removal
- VV band normalization
- VH band normalization
- Spatial resizing
- Channel stacking

### Normalization

VV values are normalized using the range:

```
[-30 dB , 0 dB]
```

VH values are normalized using:

```
[-35 dB , -5 dB]
```

The normalized images are resized to **512 × 512** pixels before being stacked into a two-channel tensor representing the VV and VH polarizations. :contentReference[oaicite:2]{index=2}

---

## Block 3 — U-Net Deep Learning Model

The processed SAR image is then passed to a U-Net semantic segmentation model.

### Input

```
512 × 512 × 2
```

(VV and VH channels)

### Output

```
512 × 512 × 1
```

(Binary flood probability map)

The model follows the standard encoder-decoder architecture with skip connections.

### Encoder

Each encoder stage consists of:

- Two Conv2D layers
- Batch Normalization
- ReLU activation
- Optional Dropout
- Max Pooling

### Bottleneck

The bottleneck captures high-level contextual information before reconstruction begins.

### Decoder

Each decoder stage performs:

- Bilinear upsampling
- Skip connection concatenation
- Convolutional refinement

Skip connections preserve spatial information lost during downsampling, enabling accurate delineation of flood boundaries. 

---

## Network Configuration

| Stage | Filters |
|--------|---------:|
| Encoder 1 | 64 |
| Encoder 2 | 128 |
| Encoder 3 | 256 |
| Encoder 4 | 512 |
| Bottleneck | 1024 |
| Decoder 1 | 512 |
| Decoder 2 | 256 |
| Decoder 3 | 128 |
| Decoder 4 | 64 |

Output activation:

```
Sigmoid
```

Approximate trainable parameters:

```
31 Million
```

:contentReference[oaicite:4]{index=4}

---

## Block 4 — Post Processing

Raw model predictions are refined before generating flood statistics.

The post-processing stage performs:

- Binary thresholding (0.5)
- Permanent water removal
- Flood mask refinement

The permanent water mask is obtained from the JRC Global Surface Water dataset.

Pixels classified as permanent water are removed before flood area estimation to avoid counting rivers and lakes as newly flooded regions. 

---

## Block 5 — Area Quantification

The cleaned flood mask is used to estimate inundated area.

The system computes:

- Flood pixel count
- Flood area
- Locality-wise flood statistics
- Temporal flood comparison

Flood extent is calculated for multiple observation periods, enabling comparison between pre-flood, flood, and post-flood conditions. :contentReference[oaicite:6]{index=6}

---

## Block 6 — Risk Assessment

Flood extent alone does not provide sufficient information for emergency response.

The system therefore combines:

- Flood area
- Historical rainfall
- Locality information

Rainfall values are obtained from the Open-Meteo API and integrated with flood statistics to generate locality-wise flood risk levels. :contentReference[oaicite:7]{index=7}

---

## Block 7 — Output Generation

The final stage generates multiple outputs for visualization and analysis.

### Spatial Outputs

- Binary flood masks
- Flood probability maps
- Flood change detection maps
- Permanent water maps

### Statistical Outputs

- Flood area charts
- Temporal comparison graphs
- Risk heatmaps

### Interactive Outputs

- Folium-based flood risk map
- Locality markers
- Risk classification visualization

All outputs are designed to support disaster monitoring and decision-making. :contentReference[oaicite:8]{index=8}

---

# Key Characteristics

- End-to-end automated pipeline
- Seven independent processing blocks
- Deep learning-based semantic segmentation
- Google Earth Engine integration
- Sentinel-1 SAR processing
- Rainfall-assisted flood risk assessment
- Permanent water removal
- Interactive visualization support

---

# Advantages of the Architecture

Compared with conventional flood mapping techniques, the proposed architecture offers several advantages:

- Operates under cloud cover using Sentinel-1 SAR imagery.
- Learns spatial context through U-Net instead of relying on pixel-level thresholding.
- Removes permanent water bodies before estimating flood extent.
- Combines rainfall information with flood area to produce actionable risk assessments.
- Tracks flood progression across pre-flood, flood, and post-flood periods using temporal composites. :contentReference[oaicite:9]{index=9}