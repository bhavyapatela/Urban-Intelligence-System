import pandas as pd
import numpy as np

def generate_traffic_data():
    # Match AQI date range EXACTLY
    time_range = pd.date_range(
        start="2025-10-01",
        end="2025-12-31 23:00:00",
        freq="h"
    )

    data = []

    for ts in time_range:
        hour = ts.hour
        day = ts.weekday()
        is_weekend = day >= 5

        # Traffic logic
        if is_weekend:
            if 10 <= hour <= 13:
                base = 0.5
            elif 17 <= hour <= 20:
                base = 0.6
            else:
                base = 0.2
        else:
            if 8 <= hour <= 10:
                base = 0.9
            elif 17 <= hour <= 20:
                base = 0.95
            elif 12 <= hour <= 14:
                base = 0.5
            elif 0 <= hour <= 5:
                base = 0.1
            else:
                base = 0.35

        noise = np.random.uniform(-0.05, 0.05)
        traffic = round(min(max(base + noise, 0), 1), 2)

        data.append({
            "time": ts,  # ✅ IMPORTANT (not timestamp)
            "traffic_index": traffic
        })

    df = pd.DataFrame(data)

    df.to_csv("ml_model/data/traffic_data.csv", index=False)

    print(f"✅ Traffic data saved! Rows: {len(df)}")
    print(df.head())

    return df


if __name__ == "__main__":
    generate_traffic_data()