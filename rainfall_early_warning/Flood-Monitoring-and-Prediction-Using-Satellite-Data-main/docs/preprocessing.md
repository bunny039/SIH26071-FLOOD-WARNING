# Data Preprocessing Pipeline

# Overview

The quality of the input data directly influences the performance of a deep learning model. Since Sentinel-1 SAR imagery contains invalid values, varying backscatter ranges, and different spatial resolutions, a dedicated preprocessing pipeline is applied before both training and inference.

To ensure consistency, the exact same preprocessing pipeline is used for:

- Model training on the Sen1Floods11 dataset
- Model inference on Vijayawada Sentinel-1 SAR imagery

Applying identical preprocessing during training and deployment prevents distribution mismatch between the learned model and unseen inference data.

---

# Preprocessing Workflow

```
Raw Sentinel-1 SAR Image
            │
            ▼
Load VV & VH Bands
            │
            ▼
NaN / Infinity Detection
            │
            ▼
Replace Invalid Pixels
            │
            ▼
VV Normalization
            │
            ▼
VH Normalization
            │
            ▼
Resize to 512 × 512
            │
            ▼
Stack VV & VH Channels
            │
            ▼
Model Input
```

---

# Step 1 — SAR Image Loading

Each Sentinel-1 image contains two polarization bands:

- VV (Vertical Transmit – Vertical Receive)
- VH (Vertical Transmit – Horizontal Receive)

Both bands are loaded as **float32** arrays and processed together throughout the pipeline.

The first operation performed after loading is the creation of a validity mask using finite-value checks. Pixels containing NaN or infinite values are identified and marked before further processing. :contentReference[oaicite:3]{index=3}

---

# Step 2 — Invalid Pixel Handling

SAR imagery may contain invalid values introduced by acquisition geometry or sensor limitations.

The preprocessing pipeline creates a validity mask using finite-value checks on both VV and VH bands.

Invalid pixels are:

- detected,
- replaced with zero,
- preserved through the preprocessing pipeline.

This ensures that invalid regions never contribute misleading information during model training or inference. 

---

# Step 3 — Band Normalization

The two SAR polarization bands are normalized independently using fixed physical ranges.

## VV Band

Normalization Range

```
[-30 dB , 0 dB]
```

Normalization Formula

```text
VV_norm = clip((VV + 30) / 30, 0, 1)
```

---

## VH Band

Normalization Range

```
[-35 dB , -5 dB]
```

Normalization Formula

```text
VH_norm = clip((VH + 35) / 30, 0, 1)
```

These ranges correspond to typical Sentinel-1 GRD backscatter values over land and water. Clipping prevents extreme outliers from affecting the normalized distribution while preserving meaningful SAR information. 

---

# Step 4 — Spatial Resizing

The U-Net model expects a fixed input size.

Therefore, every normalized image is resized to:

```
512 × 512
```

### Training Input

Interpolation Method:

- Bilinear Interpolation

### Output Mask

After prediction, the flood mask is resized back to its original dimensions using:

- Nearest Neighbor Interpolation

Nearest-neighbor interpolation preserves binary class boundaries and prevents flood masks from becoming blurred. 

---

# Step 5 — Channel Stacking

After normalization, the VV and VH bands are combined into a two-channel tensor.

Input Shape

```
(512, 512, 2)
```

Batch Inference Shape

```
(1, 512, 512, 2)
```

Using both VV and VH channels provides richer spatial information and improves the model's ability to distinguish flooded regions from other low-backscatter surfaces such as shadows and smooth rooftops. 

---

# Data Augmentation

During training, augmentation is applied only to the training dataset.

The augmentation pipeline includes:

- Horizontal Flip
- Vertical Flip
- Random 90° Rotation

Albumentations applies identical transformations to both the SAR image and its corresponding flood mask, ensuring that labels remain spatially aligned.

No intensity-based augmentation is performed because SAR backscatter values represent physical surface properties. Altering these values would introduce unrealistic samples that differ from actual Sentinel-1 observations. :contentReference[oaicite:8]{index=8}

---

# TensorFlow Data Pipeline

The project uses TensorFlow's **tf.data** API to create an efficient data loading pipeline.

The pipeline performs:

- Dataset loading
- Preprocessing
- Augmentation (training only)
- Shuffling
- Batching
- Prefetching

Training data is shuffled before batching to improve learning, while validation and test datasets undergo preprocessing without augmentation to ensure consistent evaluation. Sample weights are propagated through the pipeline so that flood pixels receive higher importance during optimization. :contentReference[oaicite:9]{index=9}

---

# Summary

| Stage | Purpose |
|--------|---------|
| Image Loading | Read VV and VH bands |
| Invalid Pixel Handling | Remove NaN and infinite values |
| VV Normalization | Map VV values to [0,1] |
| VH Normalization | Map VH values to [0,1] |
| Spatial Resizing | Resize to 512 × 512 |
| Channel Stacking | Create two-channel model input |
| Data Augmentation | Improve generalization during training |
| TensorFlow Pipeline | Efficient loading, batching, and prefetching |

---

# Key Characteristics

- Shared preprocessing for training and inference
- Physically meaningful normalization ranges
- Robust handling of invalid SAR pixels
- Fixed input size for U-Net
- Two-channel Sentinel-1 representation
- Efficient TensorFlow data pipeline
- Spatially consistent augmentation