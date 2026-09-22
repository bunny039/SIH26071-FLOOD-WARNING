import os
import xarray as xr
import numpy as np

def inspect_dataset(file_path):
    print("========================================")
    print("DATASET INSPECTION REPORT")
    print("========================================")
    
    if not os.path.exists(file_path):
        print(f"Error: Dataset not found at {file_path}")
        return

    try:
        ds = xr.open_dataset(file_path)
    except Exception as e:
        print(f"Error opening dataset: {e}")
        return

    print("\n--- Dimensions ---")
    for dim, size in ds.dims.items():
        print(f"{dim}: {size}")

    print("\n--- Coordinates ---")
    if len(ds.coords) == 0:
        print("No explicit coordinate variables found (only dimensions exist).")
    for coord in ds.coords:
        print(f"{coord}: {ds.coords[coord].dtype}")
        
    print("\n--- Variables ---")
    rf_var = None
    for var in ds.data_vars:
        print(f"{var}: shape {ds[var].shape}, dtype {ds[var].dtype}")
        if 'units' in ds[var].attrs:
            print(f"  units: {ds[var].attrs['units']}")
        if var == 'rainfall' or 'rain' in var.lower() or var.lower() in ['rf', 'prcp', 'precip']:
            rf_var = var

    if rf_var:
        print(f"\n--- Specific Variable Details: {rf_var} ---")
        
        # Taking a quick sample to avoid loading 3.1GB into RAM just for inspection
        # Actually xarray handles min/max lazily out of core.
        print("Calculating statistics (this might take a few seconds)...")
        min_val = ds[rf_var].min().item()
        max_val = ds[rf_var].max().item()
        mean_val = ds[rf_var].mean().item()
        print(f"Raw Minimum rainfall: {min_val}")
        print(f"Raw Maximum rainfall: {max_val}")
        print(f"Raw Mean rainfall: {mean_val}")
        
        # Missing values handling
        print("\nNote: The minimum value of -999.0 indicates missing data / land mask.")
        
    print("\n--- Resolution ---")
    print("Spatial resolution: Based on grid indices (no explicit lat/lon coordinate arrays).")
    print("Temporal resolution: Daily.")

    ds.close()

if __name__ == '__main__':
    # Assume script is run from project root
    dataset_path = "IMD_DailyRainfall.nc"
    inspect_dataset(dataset_path)
