import os
import yaml
import json
import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm
import numpy as np

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from ml.models.convlstm import RainfallForecaster
from ml.data.dataset import get_dataloaders

def get_device():
    if torch.cuda.is_available():
        return torch.device('cuda')
    return torch.device('cpu')

def masked_mse_loss(pred, target):
    mask = ~torch.isnan(target)
    if mask.sum() == 0:
        return torch.tensor(0.0, device=pred.device, requires_grad=True)
    return nn.functional.mse_loss(pred[mask], target[mask])
    
def masked_mae_loss(pred, target):
    mask = ~torch.isnan(target)
    if mask.sum() == 0:
        return torch.tensor(0.0, device=pred.device)
    return nn.functional.l1_loss(pred[mask], target[mask])

def combined_rainfall_loss(pred, target):
    """
    Combines MSE + MAE with extreme precipitation weighting.
    Prevents the zero-inflation in precipitation data from suppressing heavy rainfall forecasts.
    """
    mask = ~torch.isnan(target)
    if mask.sum() == 0:
        return torch.tensor(0.0, device=pred.device, requires_grad=True)

    t_valid = target[mask]
    p_valid = pred[mask]

    # Extreme tail weighting: higher loss penalty for underpredicting significant rain events
    weight = 1.0 + 1.5 * torch.sigmoid(t_valid)
    weighted_mse = torch.mean(weight * (p_valid - t_valid) ** 2)
    mae = nn.functional.l1_loss(p_valid, t_valid)

    return weighted_mse + 0.3 * mae


def train_model(config_path="ml/config/config.yaml"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    # Seed
    torch.manual_seed(config['training']['seed'])
    np.random.seed(config['training']['seed'])

    device = get_device()
    print(f"Using device: {device}")

    train_loader, val_loader, test_loader = get_dataloaders(config_path)
    
    model = RainfallForecaster(config).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=config['training']['learning_rate'])
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=5)

    epochs = config['training']['epochs']
    patience = config['training']['early_stopping_patience']
    model_dir = config['outputs']['model_dir']
    os.makedirs(model_dir, exist_ok=True)
    
    best_val_loss = float('inf')
    epochs_no_improve = 0
    
    # Check mixed precision
    scaler = torch.amp.GradScaler('cuda' if torch.cuda.is_available() else 'cpu', enabled=torch.cuda.is_available())

    for epoch in range(epochs):
        model.train()
        train_loss = 0.0
        
        # Training loop
        print(f"Epoch {epoch+1}/{epochs}")
        progress_bar = tqdm(train_loader, desc="Training", leave=False)
        for x, y in progress_bar:
            x, y = x.to(device), y.to(device)
            
            optimizer.zero_grad()
            
            # Forward pass with AMP
            with torch.amp.autocast('cuda' if torch.cuda.is_available() else 'cpu', enabled=torch.cuda.is_available()):
                preds = model(x)
                loss = combined_rainfall_loss(preds, y)
                
            if loss.item() == 0:
                continue

            # Backward pass
            scaler.scale(loss).backward()
            
            # Gradient clipping
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            scaler.step(optimizer)
            scaler.update()

            train_loss += loss.item()
            progress_bar.set_postfix({'loss': loss.item()})
            
        train_loss /= len(train_loader)
        
        # Validation loop
        model.eval()
        val_loss = 0.0
        val_mae = 0.0
        with torch.no_grad():
            for x, y in tqdm(val_loader, desc="Validation", leave=False):
                x, y = x.to(device), y.to(device)
                preds = model(x)
                loss = masked_mse_loss(preds, y)
                mae = masked_mae_loss(preds, y)
                if loss.item() > 0:
                    val_loss += loss.item()
                    val_mae += mae.item()
                    
        val_loss /= len(val_loader)
        val_mae /= len(val_loader)
        
        print(f"Train Loss (MSE): {train_loss:.4f} | Val Loss (MSE): {val_loss:.4f} | Val MAE: {val_mae:.4f}")
        
        scheduler.step(val_loss)

        # Early stopping and model saving
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            epochs_no_improve = 0
            
            checkpoint_path = os.path.join(model_dir, "best_convlstm.pth")
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_loss': best_val_loss
            }, checkpoint_path)
            
            # Save config with checkpoint
            with open(os.path.join(model_dir, "model_config.json"), 'w') as f:
                json.dump(config, f, indent=4)
                
            print(f"--> Saved better model with Val Loss: {val_loss:.4f}")
        else:
            epochs_no_improve += 1
            print(f"--> No improvement. Patience: {epochs_no_improve}/{patience}")
            if epochs_no_improve >= patience:
                print("Early stopping triggered!")
                break

if __name__ == '__main__':
    train_model()
