import os
import yaml
import json
import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt
from tqdm import tqdm

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from ml.models.convlstm import RainfallForecaster
from ml.data.dataset import get_dataloaders
from ml.training.train_convlstm import masked_mae_loss, masked_mse_loss, get_device

def evaluate_model(config_path="ml/config/config.yaml"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    device = get_device()
    model_dir = config['outputs']['model_dir']
    figures_dir = config['outputs']['figures_dir']
    os.makedirs(figures_dir, exist_ok=True)
    
    checkpoint_path = os.path.join(model_dir, "best_convlstm.pth")
    if not os.path.exists(checkpoint_path):
        print("No trained model found! Please train the model first.")
        return
        
    model = RainfallForecaster(config).to(device)
    checkpoint = torch.load(checkpoint_path, map_location=device)
    model.load_state_dict(checkpoint['model_state_dict'])
    model.eval()
    
    _, _, test_loader = get_dataloaders(config_path)
    
    # Load normalization stats to reverse log1p for metrics
    with open(config['outputs']['normalization_file'], 'r') as f:
        stats = json.load(f)
    mean = stats['mean']
    std = stats['std']
    
    def denormalize(tensor):
        t = tensor * std + mean
        return torch.expm1(t)  # inverse of log1p

    heavy_rain_threshold = config['training']['heavy_rain_threshold']

    test_mae = 0.0
    test_mse = 0.0
    
    # Classification metrics
    true_positives = 0
    false_positives = 0
    false_negatives = 0

    print("Evaluating on Test Set...")
    
    first_batch = True
    
    with torch.no_grad():
        for x, y in tqdm(test_loader, desc="Testing"):
            x, y = x.to(device), y.to(device)
            preds = model(x)
            
            # Mask valid pixels
            mask = ~torch.isnan(y)
            if mask.sum() == 0:
                continue
                
            y_valid_denorm = denormalize(y[mask])
            preds_valid_denorm = denormalize(preds[mask])
            
            test_mae += nn.functional.l1_loss(preds_valid_denorm, y_valid_denorm).item()
            test_mse += nn.functional.mse_loss(preds_valid_denorm, y_valid_denorm).item()
            
            # Heavy Rainfall classification
            y_heavy = y_valid_denorm >= heavy_rain_threshold
            pred_heavy = preds_valid_denorm >= heavy_rain_threshold
            
            true_positives += (y_heavy & pred_heavy).sum().item()
            false_positives += (~y_heavy & pred_heavy).sum().item()
            false_negatives += (y_heavy & ~pred_heavy).sum().item()
            
            # Save first batch for visualization
            if first_batch:
                first_batch = False
                # Pick the first sample in the batch
                y_sample = denormalize(y[0, 0, 0]).cpu().numpy()
                pred_sample = denormalize(preds[0, 0, 0]).cpu().numpy()
                
                # Mask out NaNs for plotting
                nan_mask = np.isnan(y[0, 0, 0].cpu().numpy())
                y_sample[nan_mask] = np.nan
                pred_sample[nan_mask] = np.nan
                
                error_sample = np.abs(y_sample - pred_sample)
                
                fig, axes = plt.subplots(1, 3, figsize=(15, 5))
                im1 = axes[0].imshow(y_sample, cmap='Blues')
                axes[0].set_title('Ground Truth (mm/day)')
                fig.colorbar(im1, ax=axes[0])
                
                im2 = axes[1].imshow(pred_sample, cmap='Blues')
                axes[1].set_title('Prediction (mm/day)')
                fig.colorbar(im2, ax=axes[1])
                
                im3 = axes[2].imshow(error_sample, cmap='Reds')
                axes[2].set_title('Absolute Error (mm/day)')
                fig.colorbar(im3, ax=axes[2])
                
                plt.tight_layout()
                plt.savefig(os.path.join(figures_dir, 'prediction_examples.png'))
                plt.close()
                print(f"Saved prediction example to {figures_dir}/prediction_examples.png")

    test_mae /= len(test_loader)
    test_mse /= len(test_loader)
    test_rmse = np.sqrt(test_mse)
    
    precision = true_positives / (true_positives + false_positives + 1e-8)
    recall = true_positives / (true_positives + false_negatives + 1e-8)
    f1 = 2 * (precision * recall) / (precision + recall + 1e-8)

    print("========================================")
    print("EVALUATION RESULTS (Physical Units: mm/day)")
    print("========================================")
    print(f"Test MAE:  {test_mae:.4f}")
    print(f"Test RMSE: {test_rmse:.4f}")
    print("\nHEAVY RAINFALL DETECTION:")
    print(f"Threshold: >= {heavy_rain_threshold} mm/day")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")

if __name__ == '__main__':
    import torch.nn as nn
    evaluate_model()
