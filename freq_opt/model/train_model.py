import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

def train_model():
    # Load dataset
    df = pd.read_csv('freq_opt/data/mtc_frequency_dataset.csv')
    
    # Define features and target
    FEATURE_COLS = [
        'hour_of_day', 'day_type', 'occupancy_pct', 'avg_wait_time_min',
        'traffic_score', 'event_impact_score', 'active_buses_on_route',
        'route_demand_index', 'temp_celsius'
    ]
    TARGET_COL = 'buses_to_add'
    
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    
    # Split into train and test sets (2000 train, 500 test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=500, random_state=42
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Define and train model
    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=12,
        min_samples_leaf=4,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Get feature importances
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    # Save artifacts
    os.makedirs('freq_opt/model', exist_ok=True)
    joblib.dump(model, 'freq_opt/model/freq_optimizer.joblib')
    joblib.dump(scaler, 'freq_opt/model/feature_scaler.joblib')
    
    # Print training report exactly as requested in PRD
    print("=== Frequency Optimizer Training Report ===")
    print(f"Training samples : {len(X_train)}")
    print(f"Test samples     : {len(X_test)}")
    print(f"MAE              : {mae:.2f} buses")
    print(f"R² Score         : {r2:.2f}")
    print("Feature Importances (top 5):")
    for i in range(5):
        feat_idx = indices[i]
        feat_name = FEATURE_COLS[feat_idx]
        feat_importance = importances[feat_idx]
        print(f"  {i+1}. {feat_name:<20} -> {feat_importance:.2f}")
    print("Model saved to: model/freq_optimizer.joblib")
    print("Scaler saved to: model/feature_scaler.joblib")

if __name__ == '__main__':
    train_model()
