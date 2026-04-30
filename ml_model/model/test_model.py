import pandas as pd
import joblib
import os
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "saved_model", "aqi_model.pkl")

model = joblib.load(model_path)

# realistic test inputs
test_data = pd.DataFrame([
    {"temperature": 35, "humidity": 30, "pm10": 120, "pm2_5": 60, "traffic_index": 0.8, "hour": 9, "day": 15, "month": 5},
    {"temperature": 20, "humidity": 60, "pm10": 50, "pm2_5": 25, "traffic_index": 0.3, "hour": 14, "day": 10, "month": 12}
])

preds = model.predict(test_data)
print("Predictions:", preds)