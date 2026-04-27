import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
import joblib

def train_model():
    print("📂 Loading dataset...")
    df = pd.read_csv("ml_model/data/final_dataset.csv")

    print("Dataset shape:", df.shape)

    # Drop time
    df = df.drop(columns=["time"])

    # ✅ Controlled features
    X = df[[
    "temperature",
    "humidity",
    "pm10",
    "pm2_5",
    "traffic_index",
    "hour",
    "day",
    "month"
    ]]

    y = df["aqi"]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training samples:", len(X_train))
    print("Testing samples:", len(X_test))

    # Model
    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1
    )

    print("\n🚀 Training model...")
    model.fit(X_train, y_train)

    # Predictions
    y_pred = model.predict(X_test)

    # Metrics
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print("\n📊 Model Performance:")
    print("MAE:", round(mae, 2))
    print("R2 Score:", round(r2, 3))

    # Save model
    joblib.dump(model, "ml_model/model/saved_model/aqi_model.pkl")

    print("\n✅ Model saved successfully!")

    return model


if __name__ == "__main__":
    train_model()