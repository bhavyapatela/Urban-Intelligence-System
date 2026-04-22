import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import pickle
import os

def train_model():
    # Load final dataset
    print("📂 Loading final dataset...")
    df = pd.read_csv("ml_model/data/final_dataset.csv")
    print(f"Total rows: {len(df)}")

    # Features and target
    FEATURES = [
        "temperature", "humidity", "wind_speed", "wind_direction",
        "precipitation", "visibility", "congestion_index",
        "pm25", "pm10", "hour", "day_of_week", "is_weekend", "month"
    ]
    TARGET = "aqi"

    X = df[FEATURES]
    y = df[TARGET]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    print(f"\n✅ Train size: {len(X_train)} | Test size: {len(X_test)}")

    # Train XGBoost model
    print("\n🤖 Training XGBoost model...")
    model = XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=6,
        random_state=42
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"\n📊 Model Results:")
    print(f"   MAE  (Mean Absolute Error) : {mae:.2f}")
    print(f"   R2 Score                   : {r2:.4f}")

    # Save model
    os.makedirs("ml_model/model/saved_model", exist_ok=True)
    with open("ml_model/model/saved_model/aqi_model.pkl", "wb") as f:
        pickle.dump(model, f)
    print(f"\n✅ Model saved to ml_model/model/saved_model/aqi_model.pkl")

if __name__ == "__main__":
    train_model()