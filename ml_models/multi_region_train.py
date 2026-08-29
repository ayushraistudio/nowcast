import openmeteo_requests
import requests_cache
import pandas as pd
import numpy as np
import xgboost as xgb
from retry_requests import retry
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import warnings
import os

warnings.filterwarnings('ignore')

# Setup Open-Meteo API client
cache_session = requests_cache.CachedSession('.cache', expire_after=-1)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

def fetch_and_label_data(lat, lon, location_name):
    print(f"Fetching historical data for {location_name} (Lat: {lat}, Lon: {lon})...")
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": "2023-01-01",
        "end_date": "2025-12-31",
        "hourly": ["temperature_2m", "relative_humidity_2m", "surface_pressure", "precipitation", "wind_speed_10m"],
        "timezone": "auto"
    }

    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]
    hourly = response.Hourly()
    
    df = pd.DataFrame({
        "temperature": hourly.Variables(0).ValuesAsNumpy(),
        "humidity": hourly.Variables(1).ValuesAsNumpy(),
        "pressure": hourly.Variables(2).ValuesAsNumpy(),
        "precipitation": hourly.Variables(3).ValuesAsNumpy(),
        "wind_speed": hourly.Variables(4).ValuesAsNumpy(),
        "latitude": lat,
        "longitude": lon
    }).dropna()

    # Labeling Logic: Precipitation >= 2.5mm AND Wind Speed >= 15km/h = High Risk (1)
    df['target'] = np.where((df['precipitation'] >= 2.5) & (df['wind_speed'] >= 15.0), 1, 0)
    print(f"{location_name} Data -> Total: {len(df)}, Risk Events: {df['target'].sum()}")
    return df

def train_multi_region_model():
    # 1. Fetch Data for Multiple Locations
    df_ghaziabad = fetch_and_label_data(28.66, 77.43, "Ghaziabad")
    df_patna = fetch_and_label_data(25.59, 85.13, "Patna, Bihar")
    
    # Combine datasets
    combined_df = pd.concat([df_ghaziabad, df_patna], ignore_index=True)
    print(f"\nCombined Dataset Size: {len(combined_df)}")

    # 2. Prepare Features and Train Model
    features = ['temperature', 'humidity', 'pressure', 'latitude', 'longitude']
    X = combined_df[features]
    y = combined_df['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    negative_cases = len(y_train[y_train == 0])
    positive_cases = len(y_train[y_train == 1])
    scale_weight = negative_cases / positive_cases if positive_cases > 0 else 1.0

    print(f"\nTraining Multi-Region XGBoost (scale_pos_weight={scale_weight:.2f})...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        scale_pos_weight=scale_weight,
        eval_metric='auc',
        max_depth=6,
        learning_rate=0.05,
        n_estimators=200,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    print("\n--- Classification Report ---")
    print(classification_report(y_test, y_pred, target_names=['Clear (0)', 'Risk (1)']))

    # Save the upgraded model
    model_path = "xgboost_multi_model.json"
    model.save_model(model_path)
    print(f"Multi-Region Model successfully saved to {model_path}")

if __name__ == "__main__":
    train_multi_region_model()