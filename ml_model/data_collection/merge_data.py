import pandas as pd

def merge_all_data():
    print("📂 Loading datasets...")

    aqi_df = pd.read_csv("ml_model/data/aqi_data.csv")
    weather_df = pd.read_csv("ml_model/data/weather_data.csv")
    traffic_df = pd.read_csv("ml_model/data/traffic_data.csv")

    print(f"AQI rows: {len(aqi_df)}")
    print(f"Weather rows: {len(weather_df)}")
    print(f"Traffic rows: {len(traffic_df)}")

    # ✅ Convert BEFORE merge (CRITICAL)
    aqi_df["time"] = pd.to_datetime(aqi_df["time"]).dt.tz_localize(None)
    weather_df["time"] = pd.to_datetime(weather_df["time"]).dt.tz_localize(None)
    traffic_df["time"] = pd.to_datetime(traffic_df["time"]).dt.tz_localize(None)

    print("\n🔗 Merging datasets...")

    # ✅ Merge on correct column
    df = weather_df.merge(aqi_df, on="time", how="inner")
    df = df.merge(traffic_df, on="time", how="inner")

    # ✅ Feature engineering
    df["hour"] = df["time"].dt.hour
    df["day"] = df["time"].dt.day
    df["month"] = df["time"].dt.month
    df["day_of_week"] = df["time"].dt.dayofweek
    df["is_weekend"] = df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)

    # Drop nulls (safety)
    df = df.dropna()

    # Save
    df.to_csv("ml_model/data/final_dataset.csv", index=False)

    print(f"\n✅ Final dataset created!")
    print(f"Shape: {df.shape}")
    print(df.head())

    return df


if __name__ == "__main__":
    merge_all_data()