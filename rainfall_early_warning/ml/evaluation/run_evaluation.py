"""
ConvLSTM Quantitative Evaluation Script
=======================================
Evaluates the trained ConvLSTM model on the unseen test split.
Reports physical metrics in mm/day:
  - Mean Absolute Error (MAE)
  - Root Mean Square Error (RMSE)
  - Classification metrics at IMD Heavy Rain Threshold (>= 64.5 mm/day)
  - Classification metrics at IMD Moderate Rain Threshold (>= 15.5 mm/day)
  - Threat Score / Critical Success Index (CSI)
Saves results to ml/evaluation/convlstm_metrics.json.
"""

import os
import sys
import json
import yaml
import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm
from datetime import datetime

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from ml.models.convlstm import RainfallForecaster
from ml.data.dataset import get_dataloaders
from ml.training.train_convlstm import get_device
from ml.climate.postprocessing import denormalize_prediction


def run_evaluation(config_path="ml/config/config.yaml") -> dict:
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    device = get_device()
    print(f"[Evaluation] Using device: {device}")

    model_dir = config['outputs']['model_dir']
    figures_dir = config['outputs']['figures_dir']
    os.makedirs(figures_dir, exist_ok=True)

    checkpoint_path = os.path.join(model_dir, "best_convlstm.pth")
    if not os.path.exists(checkpoint_path):
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")

    model = RainfallForecaster(config).to(device)
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()

    epoch = checkpoint.get('epoch', 'N/A')
    val_loss = checkpoint.get('val_loss', 'N/A')
    print(f"[Evaluation] Checkpoint Epoch: {epoch}, Val Loss: {val_loss}")

    # Load dataloaders
    print("[Evaluation] Loading test dataset split...")
    _, _, test_loader = get_dataloaders(config_path)

    # Load normalization stats
    norm_path = config['outputs']['normalization_file']
    with open(norm_path, 'r') as f:
        norm_stats = json.load(f)
    mean = norm_stats['mean']
    std = norm_stats['std']

    total_abs_error = 0.0
    total_sq_error = 0.0
    total_valid_pixels = 0

    # Categorical counters (Heavy >= 64.5 mm/day)
    tp_heavy = 0
    fp_heavy = 0
    fn_heavy = 0
    tn_heavy = 0

    # Categorical counters (Moderate >= 15.5 mm/day)
    tp_mod = 0
    fp_mod = 0
    fn_mod = 0
    tn_mod = 0

    sample_y = None
    sample_pred = None

    print("[Evaluation] Computing metrics across test batches...")
    with torch.no_grad():
        for x, y in tqdm(test_loader, desc="Testing"):
            x, y = x.to(device), y.to(device)
            preds = model(x)

            # denormalize to mm/day
            y_np = y[:, 0, 0].cpu().numpy()
            pred_np = preds[:, 0, 0].cpu().numpy()

            y_mm = denormalize_prediction(y_np, mean=mean, std=std)
            pred_mm = denormalize_prediction(pred_np, mean=mean, std=std)

            # Valid mask (where target is not NaN)
            valid = ~np.isnan(y_mm)
            if not np.any(valid):
                continue

            diff = np.abs(pred_mm[valid] - y_mm[valid])
            total_abs_error += float(np.sum(diff))
            total_sq_error += float(np.sum(diff ** 2))
            total_valid_pixels += int(np.sum(valid))

            # Heavy rain >= 64.5 mm
            y_h = y_mm[valid] >= 64.5
            p_h = pred_mm[valid] >= 64.5
            tp_heavy += int(np.sum(y_h & p_h))
            fp_heavy += int(np.sum(~y_h & p_h))
            fn_heavy += int(np.sum(y_h & ~p_h))
            tn_heavy += int(np.sum(~y_h & ~p_h))

            # Moderate rain >= 15.5 mm
            y_m = y_mm[valid] >= 15.5
            p_m = pred_mm[valid] >= 15.5
            tp_mod += int(np.sum(y_m & p_m))
            fp_mod += int(np.sum(~y_m & p_m))
            fn_mod += int(np.sum(y_m & ~p_m))
            tn_mod += int(np.sum(~y_m & ~p_m))

            if sample_y is None and np.any(valid):
                sample_y = y_mm[0]
                sample_pred = pred_mm[0]

    mae = (total_abs_error / total_valid_pixels) if total_valid_pixels > 0 else 0.0
    rmse = np.sqrt(total_sq_error / total_valid_pixels) if total_valid_pixels > 0 else 0.0

    # Heavy rain metrics
    prec_heavy = tp_heavy / (tp_heavy + fp_heavy) if (tp_heavy + fp_heavy) > 0 else 0.0
    rec_heavy = tp_heavy / (tp_heavy + fn_heavy) if (tp_heavy + fn_heavy) > 0 else 0.0
    f1_heavy = (2 * prec_heavy * rec_heavy / (prec_heavy + rec_heavy)) if (prec_heavy + rec_heavy) > 0 else 0.0
    csi_heavy = tp_heavy / (tp_heavy + fp_heavy + fn_heavy) if (tp_heavy + fp_heavy + fn_heavy) > 0 else 0.0

    # Moderate rain metrics
    prec_mod = tp_mod / (tp_mod + fp_mod) if (tp_mod + fp_mod) > 0 else 0.0
    rec_mod = tp_mod / (tp_mod + fn_mod) if (tp_mod + fn_mod) > 0 else 0.0
    f1_mod = (2 * prec_mod * rec_mod / (prec_mod + rec_mod)) if (prec_mod + rec_mod) > 0 else 0.0
    csi_mod = tp_mod / (tp_mod + fp_mod + fn_mod) if (tp_mod + fp_mod + fn_mod) > 0 else 0.0

    results = {
        "evaluation_timestamp": datetime.now().isoformat(),
        "model_name": "ConvLSTM Spatio-Temporal Forecaster",
        "checkpoint_epoch": epoch,
        "validation_loss": float(val_loss) if isinstance(val_loss, (int, float)) else val_loss,
        "physical_units": "mm/day",
        "test_metrics": {
            "mean_absolute_error_mm": round(float(mae), 4),
            "root_mean_square_error_mm": round(float(rmse), 4),
            "total_evaluated_pixels": total_valid_pixels
        },
        "heavy_rainfall_detection_gte_64_5mm": {
            "threshold_mm": 64.5,
            "precision": round(float(prec_heavy), 4),
            "recall": round(float(rec_heavy), 4),
            "f1_score": round(float(f1_heavy), 4),
            "critical_success_index_csi": round(float(csi_heavy), 4),
            "contingency_table": {
                "true_positives": tp_heavy,
                "false_positives": fp_heavy,
                "false_negatives": fn_heavy,
                "true_negatives": tn_heavy
            }
        },
        "moderate_rainfall_detection_gte_15_5mm": {
            "threshold_mm": 15.5,
            "precision": round(float(prec_mod), 4),
            "recall": round(float(rec_mod), 4),
            "f1_score": round(float(f1_mod), 4),
            "critical_success_index_csi": round(float(csi_mod), 4),
            "contingency_table": {
                "true_positives": tp_mod,
                "false_positives": fp_mod,
                "false_negatives": fn_mod,
                "true_negatives": tn_mod
            }
        }
    }

    # Save metrics JSON
    metrics_path = os.path.join(_PROJECT_ROOT, "ml", "evaluation", "convlstm_metrics.json")
    with open(metrics_path, 'w') as f:
        json.dump(results, f, indent=4)
    print(f"[Evaluation] Metrics saved to {metrics_path}")

    # Generate comparison visualization
    if sample_y is not None and sample_pred is not None:
        plot_path = os.path.join(figures_dir, "convlstm_evaluation.png")
        fig, axes = plt.subplots(1, 3, figsize=(16, 5))

        im0 = axes[0].imshow(sample_y, cmap="Blues", origin="lower")
        axes[0].set_title("Ground Truth IMD Rainfall (mm/day)")
        plt.colorbar(im0, ax=axes[0], fraction=0.046, pad=0.04)

        im1 = axes[1].imshow(sample_pred, cmap="Blues", origin="lower")
        axes[1].set_title("ConvLSTM Forecast (mm/day)")
        plt.colorbar(im1, ax=axes[1], fraction=0.046, pad=0.04)

        err = np.abs(sample_y - sample_pred)
        im2 = axes[2].imshow(err, cmap="Reds", origin="lower")
        axes[2].set_title("Absolute Error (mm/day)")
        plt.colorbar(im2, ax=axes[2], fraction=0.046, pad=0.04)

        plt.tight_layout()
        plt.savefig(plot_path, dpi=150)
        plt.close()
        print(f"[Evaluation] Plot saved to {plot_path}")

    # Print summary table
    print("\n" + "=" * 55)
    print("CONVLSTM QUANTITATIVE EVALUATION RESULTS (mm/day)")
    print("=" * 55)
    print(f"Test MAE:   {mae:.4f} mm/day")
    print(f"Test RMSE:  {rmse:.4f} mm/day")
    print("-" * 55)
    print(f"Heavy Rain (>= 64.5 mm) Precision: {prec_heavy:.4f} | Recall: {rec_heavy:.4f} | F1: {f1_heavy:.4f} | CSI: {csi_heavy:.4f}")
    print(f"Moderate Rain (>= 15.5 mm) Precision: {prec_mod:.4f} | Recall: {rec_mod:.4f} | F1: {f1_mod:.4f} | CSI: {csi_mod:.4f}")
    print("=" * 55 + "\n")

    return results


if __name__ == "__main__":
    run_evaluation()
