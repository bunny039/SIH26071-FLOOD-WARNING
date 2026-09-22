import yaml
import json
import numpy as np
import xarray as xr
import torch
from torch.utils.data import Dataset, DataLoader

class RainfallDataset(Dataset):
    def __init__(self, config_path="ml/config/config.yaml", split="train"):
        """
        split can be 'train', 'val', or 'test'
        """
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
            
        self.split = split
        self.seq_len = self.config['model']['sequence_length']
        self.forecast_horizon = self.config['model']['forecast_horizon']
        
        # Load dataset
        dataset_path = self.config['dataset']['path']
        self.fill_value = self.config['dataset']['fill_value']
        self.var_name = self.config['dataset']['variable_name']
        
        
        # Load stats
        norm_file = self.config['outputs']['normalization_file']
        with open(norm_file, 'r') as f:
            self.stats = json.load(f)
            
        self.mean = self.stats['mean']
        self.std = self.stats['std']
        
        # Slice loading directly from NetCDF to avoid loading entire 3.1GB array into memory
        n_days = self.config.get('dataset', {}).get('days_to_load', 1200)
        ds = xr.open_dataset(dataset_path)
        data = ds[self.var_name].isel(time=slice(-n_days, None)).values
        ds.close()
        
        # Preprocess on sliced data (fast and memory-efficient)
        data = np.where(data == self.fill_value, np.nan, data)
        data = np.clip(data, a_min=0, a_max=None)
        data = np.log1p(data)
        
        # Normalize
        data = (data - self.mean) / self.std
        
        # Split Data Chronologically
        total_len = data.shape[0]
        train_len = int(total_len * self.config['training']['train_ratio'])
        val_len = int(total_len * self.config['training']['validation_ratio'])
        
        if split == "train":
            self.data = data[:train_len]
        elif split == "val":
            self.data = data[train_len : train_len + val_len]
        elif split == "test":
            self.data = data[train_len + val_len:]
        else:
            raise ValueError(f"Unknown split: {split}")
            
        print(f"{split.upper()} Dataset initialized. Shape: {self.data.shape}")

    def __len__(self):
        # We need seq_len inputs + forecast_horizon outputs
        return self.data.shape[0] - self.seq_len - self.forecast_horizon + 1

    def __getitem__(self, idx):
        # X: [seq_len, H, W]
        # Y: [forecast_horizon, H, W]
        x = self.data[idx : idx + self.seq_len]
        y = self.data[idx + self.seq_len : idx + self.seq_len + self.forecast_horizon]
        
        # Add channel dimension: [seq_len, 1, H, W]
        x = np.expand_dims(x, axis=1)
        y = np.expand_dims(y, axis=1)
        
        # Replace NaN with 0 in X to prevent NaN poisoning in ConvLSTM
        x = np.nan_to_num(x, nan=0.0)
        
        # Keep NaNs in Y so the loss function can mask them out
        
        return torch.tensor(x, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)

def get_dataloaders(config_path="ml/config/config.yaml"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    
    batch_size = config['training']['batch_size']
    
    train_ds = RainfallDataset(config_path, "train")
    val_ds = RainfallDataset(config_path, "val")
    test_ds = RainfallDataset(config_path, "test")
    
    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0)
    
    return train_loader, val_loader, test_loader

if __name__ == '__main__':
    train_loader, val_loader, test_loader = get_dataloaders()
    for x, y in train_loader:
        print("X shape:", x.shape)
        print("Y shape:", y.shape)
        print("X Has NaNs:", torch.isnan(x).any().item())
        break
