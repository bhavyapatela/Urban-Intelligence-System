import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_traffic_data():
    # Generate 8 days of hourly data (matches weather data)
    start_date = datetime(2026, 4, 15, 0, 0)
    hours = 192  # 8 days x 24 hours

    timestamps = [start_date + timedelta(hours=i) for i in range(hours)]
    congestion = []

    for ts in timestamps:
        hour = ts.hour
        day = ts.weekday()  # 0=Monday, 6=Sunday
        is_weekend = day >= 5

        # Delhi traffic pattern
        if is_weekend:
            if 10 <= hour <= 13:
                base = 0.5  # moderate afternoon traffic
            elif 17 <= hour <= 20:
                base = 0.6  # evening weekend traffic
            else:
                base = 0.2
        else:
            if 8 <= hour <= 10:
                base = 0.9   # morning peak
            elif 17 <= hour <= 20:
                base = 0.95  # evening peak (worst in Delhi!)
            elif 12 <= hour <= 14:
                base = 0.5   # lunch hour
            elif 0 <= hour <= 5:
                base = 0.1   # late night
            else:
                base = 0.35  # normal hours

        # Add some randomness
        noise = np.random.uniform(-0.05, 0.05)
        congestion_index = round(min(max(base + noise, 0), 1), 2)
        congestion.append(congestion_index)

    df = pd.DataFrame({
        "timestamp": [ts.strftime("%Y-%m-%d %H:%M") for ts in timestamps],
        "congestion_index": congestion
    })

    df.to_csv("ml_model/data/traffic_data.csv", index=False)
    print(f"✅ Traffic data saved! Total rows: {len(df)}")
    print(df.head(10))
    return df

if __name__ == "__main__":
    generate_traffic_data()