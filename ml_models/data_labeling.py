import pandas as pd
import numpy as np

def create_labels():
    input_filename = "historical_weather_data.csv"
    output_filename = "labeled_weather_data.csv"

    print(f"Loading data from {input_filename}...")
    try:
        df = pd.read_csv(input_filename)
    except FileNotFoundError:
        print(f"Error: Could not find {input_filename}. Make sure it is in the same directory.")
        return

    # Define meteorological thresholds for a thunderstorm/high risk proxy
    # Precipitation >= 2.5 mm/hr and Wind Speed >= 15 km/h indicates high risk
    precipitation_threshold = 2.5
    wind_speed_threshold = 15.0

    print("Applying labeling logic based on weather thresholds...")
    
    # Create the 'target' column: 1 if risk conditions are met, else 0
    df['target'] = np.where(
        (df['precipitation'] >= precipitation_threshold) & 
        (df['wind_speed'] >= wind_speed_threshold), 
        1, 
        0
    )

    risk_count = df['target'].sum()
    total_count = len(df)
    
    print(f"Total records processed: {total_count}")
    print(f"Identified high-risk instances (target=1): {risk_count}")
    print(f"Clear instances (target=0): {total_count - risk_count}")

    # Save the new dataset
    df.to_csv(output_filename, index=False)
    print(f"Labeled dataset successfully saved to {output_filename}")

if __name__ == "__main__":
    create_labels()