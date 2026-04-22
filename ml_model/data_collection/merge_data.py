import pandas as pd

def merge_all_data():
    print("📂 Loading datasets...")
    aqi_df = pd.read_csv("ml_model/data/aqi_data.csv")
    weather_df = pd.read_csv("ml_model/data/weather_data.csv")
    traffic_df = pd.read_csv("ml_model/data/traffic_data.csv")

    print(f"AQI rows: {len(aqi_df)}")
    print(f"Weather rows: {len(weather_df)}")
    print(f"Traffic rows: {len(traffic_df)}")

    # Merge all 3 on timestamp
    print("\n🔗 Merging all 3 datasets...")
    merged_df = pd.merge(weather_df, traffic_df, on="timestamp", how="inner")
    merged_df = pd.merge(merged_df, aqi_df, on="timestamp", how="inner")

    # Add time-based features
    merged_df["timestamp"] = pd.to_datetime(merged_df["timestamp"])
    merged_df["hour"] = merged_df["timestamp"].dt.hour
    merged_df["day_of_week"] = merged_df["timestamp"].dt.dayofweek
    merged_df["is_weekend"] = merged_df["day_of_week"].apply(lambda x: 1 if x >= 5 else 0)
    merged_df["month"] = merged_df["timestamp"].dt.month

    # Save final dataset
    merged_df.to_csv("ml_model/data/final_dataset.csv", index=False)
    print(f"\n✅ Final dataset saved! Total rows: {len(merged_df)}")
    print(f"Total columns: {len(merged_df.columns)}")
    print("\nColumns:", list(merged_df.columns))
    print("\nFirst few rows:")
    print(merged_df.head())

if __name__ == "__main__":
    merge_all_data()