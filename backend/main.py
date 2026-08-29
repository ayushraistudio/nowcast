import os
import sys
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import xgboost as xgb
import pandas as pd
import requests
from datetime import datetime
import sqlite3
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# ==========================================
# Path Configurations & Imports
# ==========================================
BASE_DIR = os.path.dirname(__file__)
ML_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "ml_models"))
sys.path.append(ML_DIR)

try:
    from radar_pipeline import run_pipeline as download_new_radar_images
    from radar_tensor_prep import prepare_radar_tensors
    RADAR_SCRIPTS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import radar scripts. Error: {e}")
    RADAR_SCRIPTS_AVAILABLE = False

DB_FILE = os.path.join(BASE_DIR, "nowcast_history.db")
XGB_PATH = os.path.join(ML_DIR, "xgboost_multi_model.json")
CONVLSTM_PATH = os.path.join(ML_DIR, "convlstm_weights.pth")

# Global Radar Sync State (Default OFF)
RADAR_SYNC_ENABLED = False

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS history
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  timestamp DATETIME,
                  lat REAL,
                  lon REAL,
                  thunder_prob REAL,
                  lightning_prob REAL)''')
    conn.commit()
    conn.close()

init_db()

def save_to_history(lat, lon, thunder_prob, lightning_prob):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    c.execute("INSERT INTO history (timestamp, lat, lon, thunder_prob, lightning_prob) VALUES (?, ?, ?, ?, ?)",
              (current_time, lat, lon, thunder_prob, lightning_prob))
    conn.commit()
    conn.close()

# ==========================================
# Automated Background Radar Sync (For BOTH Locations)
# ==========================================
def automated_radar_sync():
    global RADAR_SYNC_ENABLED
    if not RADAR_SYNC_ENABLED:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Radar Sync is OFF. Skipping background download.")
        return

    if not RADAR_SCRIPTS_AVAILABLE: return
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Executing Automated Radar Sync for all regions...")
    try:
        # Sync Location 1: Ghaziabad
        download_new_radar_images(lat=28.66, lon=77.43, loc_name="ghaziabad")
        prepare_radar_tensors(loc_name="ghaziabad")
        
        # Sync Location 2: Patna
        download_new_radar_images(lat=25.59, lon=85.13, loc_name="patna")
        prepare_radar_tensors(loc_name="patna")
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Radar Sync Successful. Tensors updated for both regions.")
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Automated Radar Sync Failed: {e}")

class ConvLSTMCell(nn.Module):
    def __init__(self, input_dim, hidden_dim, kernel_size, bias):
        super(ConvLSTMCell, self).__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.kernel_size = kernel_size
        self.padding = kernel_size[0] // 2, kernel_size[1] // 2
        self.bias = bias
        self.conv = nn.Conv2d(in_channels=self.input_dim + self.hidden_dim, out_channels=4 * self.hidden_dim, kernel_size=self.kernel_size, padding=self.padding, bias=self.bias)

    def forward(self, input_tensor, cur_state):
        h_cur, c_cur = cur_state
        combined = torch.cat([input_tensor, h_cur], dim=1)
        combined_conv = self.conv(combined)
        cc_i, cc_f, cc_o, cc_g = torch.split(combined_conv, self.hidden_dim, dim=1)
        i, f, o, g = torch.sigmoid(cc_i), torch.sigmoid(cc_f), torch.sigmoid(cc_o), torch.tanh(cc_g)
        c_next = f * c_cur + i * g
        h_next = o * torch.tanh(c_next)
        return h_next, c_next

    def init_hidden(self, batch_size, image_size):
        height, width = image_size
        return (torch.zeros(batch_size, self.hidden_dim, height, width, device=self.conv.weight.device),
                torch.zeros(batch_size, self.hidden_dim, height, width, device=self.conv.weight.device))

class SpatialRiskPredictor(nn.Module):
    def __init__(self):
        super(SpatialRiskPredictor, self).__init__()
        self.convlstm_cell = ConvLSTMCell(input_dim=1, hidden_dim=16, kernel_size=(3, 3), bias=True)
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(16 * 64 * 64, 128)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(128, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        batch_size, seq_len, _, height, width = x.size()
        h, c = self.convlstm_cell.init_hidden(batch_size, (height, width))
        for t in range(seq_len):
            h, c = self.convlstm_cell(x[:, t, :, :, :], (h, c))
        out = self.flatten(h)
        out = self.fc1(out)
        out = self.relu(out)
        out = self.fc2(out)
        return self.sigmoid(out)

app = FastAPI(title="Nowcasting SIH Backend (Fused AI)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

xgb_model = xgb.XGBClassifier()
xgb_model.load_model(XGB_PATH)

conv_model = SpatialRiskPredictor()
try:
    conv_model.load_state_dict(torch.load(CONVLSTM_PATH))
    conv_model.eval()
except Exception as e:
    print(f"Warning: Could not load ConvLSTM. Error: {e}")

@app.on_event("startup")
def start_scheduler():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(automated_radar_sync, 'interval', minutes=15)
    scheduler.start()
    print("Background Radar Sync Scheduler Started.")

@app.get("/")
def read_root():
    return {"status": "FastAPI Backend is running!"}

# --- Settings APIs ---
@app.get("/api/settings")
def get_settings():
    return {"radar_sync_enabled": RADAR_SYNC_ENABLED}

@app.post("/api/settings/radar/toggle")
def toggle_radar_sync(background_tasks: BackgroundTasks):
    global RADAR_SYNC_ENABLED
    RADAR_SYNC_ENABLED = not RADAR_SYNC_ENABLED
    if RADAR_SYNC_ENABLED:
        background_tasks.add_task(automated_radar_sync)
    return {"radar_sync_enabled": RADAR_SYNC_ENABLED}

@app.get("/api/history")
def get_history(lat: float = 28.66, lon: float = 77.43):
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("""
        SELECT strftime('%H:%M', timestamp) as time, thunder_prob, lightning_prob 
        FROM history 
        WHERE lat=? AND lon=? 
        ORDER BY timestamp DESC LIMIT 6
    """, (lat, lon))
    rows = c.fetchall()
    conn.close()
    
    history_data = [{"time": row[0], "thunder": row[1], "lightning": row[2]} for row in rows]
    history_data.reverse()
    
    if not history_data:
        current_time = datetime.now().strftime("%H:%M")
        history_data = [{"time": current_time, "thunder": 0, "lightning": 0}]
        
    return history_data

@app.get("/api/realtime-risk")
def get_realtime_risk(background_tasks: BackgroundTasks, lat: float = 28.66, lon: float = 77.43):
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto"
        response = requests.get(url)
        data = response.json()
        current_data = data.get("current", {})
        
        temperature = current_data.get("temperature_2m", 0.0)
        humidity = current_data.get("relative_humidity_2m", 0.0)
        pressure = current_data.get("surface_pressure", 0.0)
        wind_speed = current_data.get("wind_speed_10m", 0.0)
        
        input_features = pd.DataFrame({
            'temperature': [temperature],
            'humidity': [humidity],
            'pressure': [pressure],
            'latitude': [lat],
            'longitude': [lon]
        })
        xgb_prob = float(xgb_model.predict_proba(input_features)[0][1])

        loc_name = "ghaziabad" if lat > 27.0 else "patna"
        current_tensor_path = os.path.join(ML_DIR, f"radar_sequence_tensor_{loc_name}.pt")
        
        convlstm_prob = 0.0
        try:
            radar_tensor = torch.load(current_tensor_path).unsqueeze(0)
            with torch.no_grad():
                convlstm_prob = float(conv_model(radar_tensor).item())
        except Exception:
            pass
            
        fused_probability = (xgb_prob * 0.6) + (convlstm_prob * 0.4)
        risk_percentage = round(fused_probability * 100, 2)
        lightning_prob = round(risk_percentage * 0.85, 2)
        confidence = round(100 - (abs(xgb_prob - convlstm_prob) * 100), 1)
        
        if risk_percentage > 75.0: risk_level = "Severe"
        elif risk_percentage > 50.0: risk_level = "High"
        elif risk_percentage > 25.0: risk_level = "Moderate"
        else: risk_level = "Low"

        background_tasks.add_task(save_to_history, lat, lon, risk_percentage, lightning_prob)

        map_zones = [
            {"lat": lat, "lng": lon, "radius": 3000, "level": risk_level},
            {"lat": lat + 0.02, "lng": lon + 0.02, "radius": 4500, "level": "Moderate" if risk_percentage > 25 else "Low"},
            {"lat": lat - 0.015, "lng": lon - 0.03, "radius": 6000, "level": "Low"}
        ]
            
        return {
            "latitude": lat,
            "longitude": lon,
            "current_weather": {
                "temperature_celsius": temperature,
                "humidity_percent": humidity,
                "pressure_hpa": pressure
            },
            "prediction_details": {
                "thunderstorm_probability": risk_percentage,
                "lightning_probability": lightning_prob,
                "risk_level": risk_level,
                "confidence_percent": confidence,
                "forecast_window": "Next 30-60 Minutes",
                "last_updated": datetime.now().strftime("%H:%M:%S IST")
            },
            "storm_movement": {
                "direction": "SW → NE",
                "speed_kmh": round(wind_speed, 1)
            },
            "ai_status": {
                "xgboost": f"Active (Risk: {round(xgb_prob*100, 1)}%)",
                "convlstm": f"Active (Risk: {round(convlstm_prob*100, 1)}%)",
                "data_sources": "Fusion Engine Connected",
                "last_prediction": "Live API"
            },
            "map_zones": map_zones
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))