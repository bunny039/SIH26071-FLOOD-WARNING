# Model Evaluation

# Overview

The proposed flood segmentation model is evaluated using the official **Sen1Floods11** test split. Performance is assessed using standard semantic segmentation metrics that measure the similarity between predicted flood masks and ground-truth annotations.

Since flood segmentation is a highly imbalanced problem, metrics such as **Dice Score** and **Intersection over Union (IoU)** are emphasized over overall pixel accuracy. These metrics provide a more meaningful measure of segmentation quality for flood mapping. :contentReference[oaicite:0]{index=0}

---

# Evaluation Workflow

```text
Test Dataset
      │
      ▼
Load Best Model
      │
      ▼
Generate Predictions
      │
      ▼
Binary Flood Masks
      │
      ▼
Compare with Ground Truth
      │
      ▼
Confusion Matrix
      │
      ▼
Evaluation Metrics
```

---

# Test Dataset

The best-performing checkpoint is evaluated on the official **90-image Sen1Floods11 test split**.

Each prediction is compared against its corresponding manually annotated flood mask, and a global confusion matrix is accumulated across all test images before computing the final metrics. This ensures a consistent and reproducible evaluation procedure. :contentReference[oaicite:1]{index=1}

---

# Evaluation Metrics

The following metrics are used to assess model performance:

## Precision

Measures how many predicted flood pixels are actually flooded.

Higher precision indicates fewer false-positive predictions.

---

## Recall

Measures how many true flooded pixels are correctly identified.

For disaster response, recall is especially important because missing flooded areas can have serious operational consequences. :contentReference[oaicite:2]{index=2}

---

## Dice Score (F1 Score)

Dice Score measures the overlap between predicted flood regions and the ground-truth flood masks.

It is one of the primary optimization objectives during training through the Dice Loss component.

---

## Intersection over Union (IoU)

IoU evaluates the ratio of the overlap between prediction and ground truth to their combined area.

A higher IoU indicates more accurate flood boundary delineation.

---

## Accuracy

Pixel-wise classification accuracy across the entire image.

Because flood pixels occupy only a small portion of most SAR images, overall accuracy is interpreted alongside Dice and IoU rather than as the primary performance metric. :contentReference[oaicite:3]{index=3}

---

## Specificity

Specificity measures the percentage of correctly identified non-flood pixels.

High specificity indicates that the model effectively avoids false flood detections.

---

# Performance Comparison

| Metric | Baseline U-Net | Proposed U-Net | Improvement |
|---------|---------------:|---------------:|------------:|
| Precision | 0.7100 | **0.8358** | +0.1258 |
| Recall | 0.6100 | **0.7327** | +0.1227 |
| Dice / F1 | 0.6500 | **0.7808** | +0.1308 |
| IoU | 0.4800 | **0.6405** | +0.1605 |
| Accuracy | 0.9500 | 0.9486 | -0.0014 |
| Specificity | 0.9700 | **0.9794** | +0.0094 |

These values are taken directly from the project's evaluation results. :contentReference[oaicite:4]{index=4}

---

# Result Analysis

The proposed model demonstrates consistent improvements over the baseline U-Net across the most important segmentation metrics.

### IoU Improvement

The IoU increases from **0.48** to **0.64**, indicating substantially better alignment between predicted flood boundaries and the ground-truth annotations.

### Precision Improvement

Precision increases to **0.8358**, showing that the model produces fewer false-positive flood detections.

### Recall Improvement

Recall improves from **0.61** to **0.7327**, meaning the model successfully detects more flooded regions without sacrificing precision.

### Accuracy

Although overall pixel accuracy decreases slightly (0.9500 → 0.9486), this change is expected for highly imbalanced segmentation tasks. Improving flood detection may introduce a small number of additional non-flood errors while substantially increasing the detection of true flood pixels. :contentReference[oaicite:5]{index=5}

---

# Real-World Case Study

Following evaluation on Sen1Floods11, the trained model is applied to Sentinel-1 SAR imagery from the September 2024 Vijayawada flood event.

The system:

- Generates binary flood masks.
- Estimates flood extent.
- Compares flood progression across multiple time periods.
- Integrates rainfall information.
- Produces locality-wise flood risk assessments.

The report identifies a peak inundation of approximately **1.87 km²** across the monitored localities, representing a substantial increase over pre-flood conditions. It also highlights differing recovery patterns, such as faster drainage in the Budameru Floodplain and slower drainage in the Vijayawada City Core. 

---

# Key Findings

- Improved flood boundary delineation.
- Better balance between Precision and Recall.
- Stronger overlap with ground-truth flood masks.
- Effective handling of class imbalance through Dice + BCE loss and flood-pixel weighting.
- Successful deployment to a real-world flood monitoring case study using Sentinel-1 SAR imagery. 

---

# Summary

| Category | Value |
|----------|-------|
| Test Dataset | Sen1Floods11 |
| Test Images | 90 |
| Best Dice Score | 0.7808 |
| Best IoU | 0.6405 |
| Precision | 0.8358 |
| Recall | 0.7327 |
| Deployment | Vijayawada Flood Case Study |
| Flood Area Analysis | Yes |
| Risk Assessment | Yes |