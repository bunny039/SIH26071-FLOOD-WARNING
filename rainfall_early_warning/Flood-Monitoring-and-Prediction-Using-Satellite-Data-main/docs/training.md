# Model Training

# Overview

The flood segmentation model is trained using the **Sen1Floods11** dataset and implemented with TensorFlow/Keras in Google Colab.

The training pipeline is designed to address one of the biggest challenges in flood segmentation: **severe class imbalance**. In most SAR images, flood pixels occupy only a small portion of the scene, while non-flood pixels dominate the background. To improve learning, the project combines Dice Loss with Binary Cross-Entropy (BCE), applies sample weighting, and uses adaptive learning-rate scheduling. :contentReference[oaicite:0]{index=0}

---

# Training Workflow

```
Sen1Floods11 Dataset
        │
        ▼
Data Loading
        │
        ▼
Preprocessing
        │
        ▼
Data Augmentation
        │
        ▼
TensorFlow tf.data Pipeline
        │
        ▼
U-Net Model
        │
        ▼
Combined Dice + BCE Loss
        │
        ▼
Adam Optimizer
        │
        ▼
Callbacks
        │
        ▼
Best Model (.keras)
```

---

# Training Dataset

The model is trained using the official **Sen1Floods11** dataset splits to ensure fair evaluation and reproducibility.

| Split | Images |
|--------|-------:|
| Training | ~252 |
| Validation | ~89 |
| Testing | ~90 |

Each sample consists of:

- Sentinel-1 SAR image (VV + VH)
- Pixel-wise binary flood mask

The implementation verifies that every SAR image has a matching label before training begins. :contentReference[oaicite:1]{index=1}

---

# Model Input

Input Shape

```
512 × 512 × 2
```

Output Shape

```
512 × 512 × 1
```

The two-channel input combines the normalized VV and VH Sentinel-1 SAR polarizations, while the output represents a per-pixel flood probability map generated through a sigmoid activation function. :contentReference[oaicite:2]{index=2}

---

# Loss Function

The model is optimized using a combined loss function:

```
Loss = 0.5 × Binary Cross-Entropy + 0.5 × Dice Loss
```

## Binary Cross-Entropy (BCE)

Binary Cross-Entropy performs pixel-level binary classification and penalizes incorrect flood/non-flood predictions.

## Dice Loss

Dice Loss directly optimizes the overlap between predicted and ground-truth flood regions. It is particularly effective for highly imbalanced segmentation problems where flooded pixels represent only a small fraction of the image.

Combining the two losses provides both stable optimization and improved segmentation quality. :contentReference[oaicite:3]{index=3}

---

# Sample Weighting

Flood pixels are assigned a higher importance during optimization.

| Class | Weight |
|------|-------:|
| Flood | 8.43 |
| Non-Flood | 1.00 |

Sample weights are passed through the TensorFlow data pipeline and supplied to `model.fit()`.

This weighting strategy increases the penalty for missing flooded regions and helps the model focus on the minority class. 

---

# Optimizer

The model uses the **Adam** optimizer.

| Parameter | Value |
|-----------|------:|
| Optimizer | Adam |
| Learning Rate | 1 × 10⁻⁴ |

Adam was selected because it provides stable convergence for deep convolutional networks while adapting the learning rate during optimization. :contentReference[oaicite:5]{index=5}

---

# Training Configuration

| Parameter | Value |
|-----------|------:|
| Epochs | Up to 50 |
| Batch Size | 8 |
| Optimizer | Adam |
| Learning Rate | 1e-4 |
| Input Size | 512 × 512 × 2 |
| Output | Binary Flood Mask |
| Loss | Dice + BCE |
| Platform | Google Colab (NVIDIA T4 GPU) |

Training typically converges after **25–30 epochs**, where EarlyStopping halts optimization once validation performance stops improving. 

---

# Callbacks

Three callbacks are used to improve training efficiency and preserve the best-performing model.

## ModelCheckpoint

- Saves the best-performing model.
- Monitors validation Dice coefficient.

## EarlyStopping

- Patience: 8 epochs.
- Restores the best model weights after training.

## ReduceLROnPlateau

- Factor: 0.5
- Patience: 4 epochs

When validation performance plateaus, the learning rate is automatically reduced to allow finer optimization. :contentReference[oaicite:7]{index=7}

---

# TensorFlow Data Pipeline

The training pipeline is implemented using **tf.data**.

Pipeline stages include:

- Dataset loading
- Shuffling
- Preprocessing
- Data augmentation (training only)
- Batching
- Prefetching

Training samples are shuffled with a buffer size of **300**, batched in groups of **8**, and prefetched using **AUTOTUNE** to overlap CPU preprocessing with GPU computation. :contentReference[oaicite:8]{index=8}

---

# Training Behaviour

During training:

- Loss decreases rapidly during the first 10–15 epochs.
- Validation loss closely follows training loss, indicating minimal overfitting.
- The best checkpoint is typically obtained around epoch 20.
- EarlyStopping usually terminates training after approximately 25–30 epochs. :contentReference[oaicite:9]{index=9}

---

# Model Output

The final trained model is saved in **`.keras`** format.

The saved model contains:

- Model architecture
- Learned weights
- Optimizer state

This enables the model to be reloaded for inference without rebuilding the architecture manually. :contentReference[oaicite:10]{index=10}

---

# Summary

| Component | Configuration |
|-----------|---------------|
| Dataset | Sen1Floods11 |
| Framework | TensorFlow / Keras |
| Model | U-Net |
| Loss | Dice + BCE |
| Optimizer | Adam |
| Learning Rate | 1e-4 |
| Batch Size | 8 |
| Epochs | Up to 50 |
| Flood Weight | 8.43 |
| Model Output | .keras |
| Hardware | Google Colab NVIDIA T4 GPU |