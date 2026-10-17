import os
import requests
import time
import math

def fetch_latest_radar_timestamps():
    print("Fetching radar metadata from RainViewer API...")
    url = "https://api.rainviewer.com/public/weather-maps.json"
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        past_frames = data.get("radar", {}).get("past", [])
        if not past_frames:
            return [], None
        return [frame["time"] for frame in past_frames[-4:]], data["version"]
    except Exception as e:
        print(f"Error fetching radar metadata: {e}")
        return [], None

def download_radar_tiles(timestamps, api_version, lat, lon, loc_name, zoom=7):
    # Creates separate folders like radar_data_ghaziabad or radar_data_patna
    save_dir = os.path.join(os.path.dirname(__file__), f"radar_data_{loc_name}")
    os.makedirs(save_dir, exist_ok=True)
    
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    x_tile = int((lon + 180.0) / 360.0 * n)
    y_tile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    
    color_scheme = 2 
    options = "1_1"  
    
    downloaded_files = []
    for ts in timestamps:
        tile_url = f"https://tilecache.rainviewer.com/v2/radar/{ts}/{zoom}/{x_tile}/{y_tile}/{color_scheme}/{options}.png"
        try:
            img_response = requests.get(tile_url)
            img_response.raise_for_status()
            
            file_path = os.path.join(save_dir, f"radar_{ts}.png")
            with open(file_path, "wb") as file:
                file.write(img_response.content)
            downloaded_files.append(file_path)
            time.sleep(1) # API rate limit safety
        except Exception as e:
            print(f"Failed to download tile for {ts}: {e}")
    return downloaded_files

def run_pipeline(lat=28.66, lon=77.43, loc_name="ghaziabad"):
    timestamps, version = fetch_latest_radar_timestamps()
    if timestamps:
        print(f"Downloading radar sequence for {loc_name}...")
        saved_images = download_radar_tiles(timestamps, version, lat, lon, loc_name)
        print(f"Pipeline complete. Images saved for {loc_name}.")
    else:
        print(f"Pipeline aborted for {loc_name} due to metadata failure.")

if __name__ == "__main__":
    # Test for both locations
    run_pipeline(lat=28.66, lon=77.43, loc_name="ghaziabad")
    run_pipeline(lat=25.59, lon=85.13, loc_name="patna")