import xarray as xr
import numpy as np
import pandas as pd
import os

def fix_imd_dataset(input_path="IMD_DailyRainfall.nc", output_path="IMD_DailyRainfall_Fixed.nc"):
    print(f"Loading {input_path}...")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    ds = xr.open_dataset(input_path)
    
    print("Generating official IMD 0.25 degree coordinates...")
    # Latitude: 6.5N to 38.5N (129 points)
    lats = np.linspace(6.5, 38.5, 129, dtype=np.float32)
    # Longitude: 66.5E to 100.0E (135 points)
    lons = np.linspace(66.5, 100.0, 135, dtype=np.float32)
    # Time: 1901-01-01 to 2023-12-31 (44925 days)
    # Check length
    time_len = ds.dims.get('time', 0)
    print(f"Time dimension length: {time_len}")
    
    if time_len == 44925:
        times = pd.date_range(start="1901-01-01", periods=time_len, freq='D')
    else:
        # Fallback if different
        times = pd.date_range(start="1901-01-01", periods=time_len, freq='D')

    print("Assigning coordinates to dataset...")
    # Create a new dataset with the assigned coordinates
    ds_fixed = ds.assign_coords({
        "time": times,
        "latitude": lats,
        "longitude": lons
    })
    
    # Ensure they are dimension coordinates
    # xarray automatically does this if the name matches the dim
    
    # Add attributes
    ds_fixed['latitude'].attrs = {'units': 'degrees_north', 'long_name': 'Latitude'}
    ds_fixed['longitude'].attrs = {'units': 'degrees_east', 'long_name': 'Longitude'}
    if 'rainfall' in ds_fixed.variables:
        ds_fixed['rainfall'].attrs['units'] = 'mm/day'
        ds_fixed['rainfall'].attrs['_FillValue'] = -999.0

    print(f"Saving to {output_path} (This might take a few minutes)...")
    
    # Save with compression if possible, but for speed just dump
    ds_fixed.to_netcdf(output_path, format='NETCDF4', engine='netcdf4')
    print("Done!")
    
    ds.close()
    ds_fixed.close()

if __name__ == '__main__':
    fix_imd_dataset()
