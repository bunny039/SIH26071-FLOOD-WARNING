# Trained Model

This directory is intended to store the trained deep learning model used for flood segmentation.

## Model

- Architecture: U-Net
- Framework: TensorFlow / Keras
- Input Shape: 512 × 512 × 2
- Output: Binary Flood Segmentation Mask

## Note

The trained model is **not included** in this repository because of GitHub's file size limitations.

To generate the trained model:

1. Open `notebook/Flood_Monitoring_and_Prediction_Using_Satellite_Data.ipynb`
2. Execute the notebook from top to bottom.
3. The model will be trained using the Sen1Floods11 dataset.
4. Save the trained model in this directory.

Example:

```text
model/
└── flood_unet.keras
```

If you already have a trained model, place it inside this folder before running inference.