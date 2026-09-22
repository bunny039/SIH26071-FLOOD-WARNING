import os
import yaml
import json
import numpy as np
import xarray as xr

class RainfallPreprocessor:
    def __init__(self, config_path="ml/config/config.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
            
        self.dataset_path = self.config['dataset']['path']
        self.fill_value = self.config['dataset']['fill_value']
        self.var_name = self.config['dataset']['variable_name']
        self.train_ratio = self.config['training']['train_ratio']
        self.norm_file = self.config['outputs']['normalization_file']
        
        # Ensure config dir exists
        os.makedirs(os.path.dirname(self.norm_file), exist_ok=True)

    def process_and_get_stats(self):
        """
        Calculates normalization statistics ONLY on the training portion 
        to prevent data leakage, after handling missing values and log1p transform.
        """
        print(f"Loading dataset from {self.dataset_path}...")
        ds = xr.open_dataset(self.dataset_path)
        
        if self.var_name not in ds.variables:
            raise ValueError(f"Variable {self.var_name} not found in dataset.")
            
        data = ds[self.var_name].values
        
        # 1. Handle missing values
        print(f"Masking fill values ({self.fill_value}) to NaN...")
        data = np.where(data == self.fill_value, np.nan, data)
        
        # Make sure no values are strictly < 0 for log1p, physically rainfall is >= 0
        data = np.clip(data, a_min=0, a_max=None)
        
        # SLICE TO LAST 1000 DAYS FOR FAST TEST
        print("Slicing dataset to the last 1000 days for fast testing...")
        data = data[-1000:]
        
        # 2. Chronological Split (Train only for stats)
        total_time_steps = data.shape[0]
        train_steps = int(total_time_steps * self.train_ratio)
        
        train_data = data[:train_steps]
        
        # 3. Log1p Transformation (log(1 + x))
        print("Applying log1p transformation to training data...")
        transformed_train = np.log1p(train_data)
        
        # 4. Calculate Stats ignoring NaNs
        print("Calculating statistics on transformed training data...")
        mean_val = float(np.nanmean(transformed_train))
        std_val = float(np.nanstd(transformed_train))
        min_val = float(np.nanmin(transformed_train))
        max_val = float(np.nanmax(transformed_train))
        
        stats = {
            "transformation": "log1p",
            "mean": mean_val,
            "std": std_val,
            "min": min_val,
            "max": max_val,
            "train_time_steps": train_steps
        }
        
        with open(self.norm_file, 'w') as f:
            json.dump(stats, f, indent=4)
            
        print(f"Saved normalization stats to {self.norm_file}:")
        print(json.dumps(stats, indent=4))
        
        ds.close()
        return stats

if __name__ == '__main__':
    preprocessor = RainfallPreprocessor()
    preprocessor.process_and_get_stats()
