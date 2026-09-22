import os
import yaml
import json
import torch
import numpy as np

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from ml.models.convlstm import RainfallForecaster

class RainfallPredictor:
    def __init__(self, config_path="ml/config/config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
            
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # Load stats
        with open(self.config['outputs']['normalization_file'], 'r') as f:
            self.stats = json.load(f)
        self.mean = self.stats['mean']
        self.std = self.stats['std']
        
        # Load model
        model_path = os.path.join(self.config['outputs']['model_dir'], "best_convlstm.pth")
        if not os.path.exists(model_path):
            raise FileNotFoundError("Trained model not found. Please train first.")
            
        self.model = RainfallForecaster(self.config).to(self.device)
        checkpoint = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model.eval()
        
        self.heavy_thresh = self.config['training']['heavy_rain_threshold']
        
    def preprocess(self, recent_sequence):
        """
        recent_sequence: numpy array of shape (time, lat, lon)
        """
        # Handle fill values assuming it might have -999.0
        data = np.where(recent_sequence == self.config['dataset']['fill_value'], np.nan, recent_sequence)
        
        data = np.clip(data, a_min=0, a_max=None)
        data = np.log1p(data)
        data = (data - self.mean) / self.std
        
        # Expand batch and channel: (1, seq_len, 1, H, W)
        data = np.expand_dims(data, axis=(0, 2))
        return torch.tensor(data, dtype=torch.float32).to(self.device)
        
    def predict(self, recent_sequence):
        """
        recent_sequence: numpy array of shape (seq_len, lat, lon)
        """
        x = self.preprocess(recent_sequence)
        
        with torch.no_grad():
            preds = self.model(x)
            
        # preds shape: (1, forecast_horizon, 1, h, w)
        preds = preds.squeeze().cpu().numpy()
        
        # Denormalize
        preds = (preds * self.std) + self.mean
        preds_physical = np.expm1(preds)
        
        # Calculate risk categories
        risk_map = np.full(preds_physical.shape, "LOW", dtype=object)
        risk_map[preds_physical >= (self.heavy_thresh * 0.5)] = "MODERATE"
        risk_map[preds_physical >= self.heavy_thresh] = "HIGH"
        risk_map[preds_physical >= (self.heavy_thresh * 1.5)] = "CRITICAL"
        
        # Mask out NaNs in physical (e.g. land mask)
        nan_mask = np.isnan(recent_sequence[-1]) # use last frame as land mask
        preds_physical[nan_mask] = np.nan
        risk_map[nan_mask] = "UNKNOWN"
        
        return preds_physical, risk_map

if __name__ == '__main__':
    # Test script with dummy data
    try:
        predictor = RainfallPredictor()
        print("Model loaded successfully.")
        
        # Dummy 7 days of recent rainfall [7, 129, 135]
        dummy_seq = np.random.rand(7, 129, 135) * 10
        pred_rf, pred_risk = predictor.predict(dummy_seq)
        
        print("Prediction Max (mm/day):", np.nanmax(pred_rf))
        print("Prediction Min (mm/day):", np.nanmin(pred_rf))
        unique_risks, counts = np.unique(pred_risk.astype(str), return_counts=True)
        print("Risk Distribution:", dict(zip(unique_risks, counts)))
    except Exception as e:
        print("Error during inference test:", e)
