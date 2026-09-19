import os
import sys
import torch
import numpy as np

# Ensure imports work from backend directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import predictor
from config import THRESHOLD_NORMAL_MAX, THRESHOLD_WATCH_MAX, THRESHOLD_WARNING_MAX, GPM_MIN, GPM_MAX

def calculate_regression_metrics(pred_grid, true_grid):
    """Calculate basic continuous error metrics."""
    mae = np.mean(np.abs(pred_grid - true_grid))
    mse = np.mean((pred_grid - true_grid)**2)
    rmse = np.sqrt(mse)
    return mae, mse, rmse

def calculate_categorical_metrics(pred_grid, true_grid, threshold):
    """
    Calculate categorical metrics for a specific rainfall threshold.
    Returns: POD (Probability of Detection), FAR (False Alarm Ratio), CSI (Critical Success Index)
    """
    # Boolean masks where rainfall exceeds the threshold
    pred_event = pred_grid >= threshold
    true_event = true_grid >= threshold

    hits = np.sum(pred_event & true_event)
    misses = np.sum((~pred_event) & true_event)
    false_alarms = np.sum(pred_event & (~true_event))
    correct_negatives = np.sum((~pred_event) & (~true_event))

    pod = hits / (hits + misses) if (hits + misses) > 0 else 0.0
    far = false_alarms / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0
    csi = hits / (hits + misses + false_alarms) if (hits + misses + false_alarms) > 0 else 0.0

    return pod, far, csi

def run_evaluation():
    print("========================================")
    print(" AQUASENTINEL MODEL EVALUATION SCRIPT ")
    print("========================================")
    
    # 1. Load the model
    print("\n[1] Loading U-Net Model...")
    model = predictor.get_model()
    model.eval()

    # 2. Generate Synthetic Test Data
    # In a real environment, you would use dataload.py to load GPM and ERA5 .nc4 data
    # Because we do not have the 5TB climate dataset locally, we simulate test cases.
    print("\n[2] Generating synthetic test batch (N=10 days)...")
    N_TEST_SAMPLES = 10
    GRID_SIZE = 64
    
    synthetic_inputs = []
    synthetic_truths = []
    
    for i in range(N_TEST_SAMPLES):
        # Generate varied weather scenarios
        temp = np.random.uniform(22.0, 35.0)
        rh = np.random.uniform(60.0, 100.0)
        cape = np.random.uniform(500.0, 3000.0) # High CAPE = high rain potential
        
        # Build input tensor using our existing predictor function
        x_tensor = predictor.construct_input_tensor(
            location="Bhubaneswar", temp=temp, rh=rh, sp=1005.0, wind_spd=15.0,
            cloud_cover=0.9, cape=cape, dewpoint=24.0, day_of_year=200, month=7
        )
        synthetic_inputs.append(x_tensor)
        
        # Simulate Ground Truth: if High RH and High CAPE -> Heavy Rain
        base_rain = (rh / 100.0) * (cape / 1500.0) * 40.0
        # Add spatial noise for the 64x64 truth grid
        noise = np.random.normal(0, 10, (GRID_SIZE, GRID_SIZE))
        truth_grid = np.clip(base_rain + noise, 0, 200) # Max 200mm
        synthetic_truths.append(truth_grid)
    
    # 3. Run Inference and Collect Predictions
    print("\n[3] Running Inference...")
    predictions = []
    
    with torch.no_grad():
        for i in range(N_TEST_SAMPLES):
            raw_output = model(synthetic_inputs[i])
            pred_grid = raw_output[0, 0].cpu().numpy()
            
            # De-normalize logits to physical mm (matching predictor.py)
            norm_val = 1.0 / (1.0 + np.exp(-pred_grid))
            rainfall_mm = norm_val * (GPM_MAX - GPM_MIN) + GPM_MIN
            predictions.append(rainfall_mm)
            
    predictions = np.array(predictions)
    truths = np.array(synthetic_truths)
    
    # 4. Calculate Regression Metrics
    print("\n[4] Evaluation Results (Regression)")
    print("----------------------------------------")
    mae, mse, rmse = calculate_regression_metrics(predictions, truths)
    print(f"Mean Absolute Error (MAE):      {mae:.2f} mm")
    print(f"Mean Squared Error (MSE):       {mse:.2f} mm^2")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} mm")
    
    # 5. Calculate Categorical Metrics (IMD Thresholds)
    print("\n[5] Evaluation Results (Categorical / IMD Thresholds)")
    print("----------------------------------------")
    
    thresholds = {
        "WATCH (>15.5mm)": THRESHOLD_NORMAL_MAX,
        "WARNING (>64.5mm)": THRESHOLD_WATCH_MAX,
        "SEVERE (>115.5mm)": THRESHOLD_WARNING_MAX
    }
    
    for name, threshold_val in thresholds.items():
        pod, far, csi = calculate_categorical_metrics(predictions, truths, threshold_val)
        print(f"--- {name} ---")
        print(f"  Probability of Detection (POD): {pod:.3f} (Ideal: 1.0)")
        print(f"  False Alarm Ratio (FAR):        {far:.3f} (Ideal: 0.0)")
        print(f"  Critical Success Index (CSI):   {csi:.3f} (Ideal: 1.0)\n")

    print("========================================")
    print("Note: Above metrics are based on synthetic data for demonstration.")
    print("To evaluate on real data, replace the loop in Step 2 with actual")
    print("calls to dataload.LoadData() pointing to your .nc4/.npy files.")
    print("========================================")

if __name__ == "__main__":
    run_evaluation()
