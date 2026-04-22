import pandas as pd
import numpy as np
import pickle
import requests
import openmeteo_requests
import requests_cache
from retry_requests import retry
from datetime import datetime

# Load saved model
with open("ml_model/model/saved_model/aqi_model.pkl", "rb") as f:
    model = pickle.load(f)

def get_current_weather():
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "wind_speed_10m",
            "wind_direction_10m",
            "precipitation",
            "visibility"
        ],
        "timezone": "Asia/Kolkata",
        "forecast_days": 1
    }

    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]
    hourly = response.Hourly()

    df = pd.DataFrame({
        "timestamp": pd.date_range(
            start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
            end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=hourly.Interval()),
            inclusive="left"
        ).tz_convert("Asia/Kolkata"),
        "temperature": hourly.Variables(0).ValuesAsNumpy(),
        "humidity": hourly.Variables(1).ValuesAsNumpy(),
        "wind_speed": hourly.Variables(2).ValuesAsNumpy(),
        "wind_direction": hourly.Variables(3).ValuesAsNumpy(),
        "precipitation": hourly.Variables(4).ValuesAsNumpy(),
        "visibility": hourly.Variables(5).ValuesAsNumpy(),
    })

    # Get current hour row
    now = datetime.now()
    df["hour"] = df["timestamp"].dt.hour
    current = df[df["hour"] == now.hour].iloc[0]
    return current

def get_traffic_congestion(hour, is_weekend):
    # Delhi traffic pattern
    if is_weekend:
        if 10 <= hour <= 13: return 0.5
        elif 17 <= hour <= 20: return 0.6
        else: return 0.2
    else:
        if 8 <= hour <= 10: return 0.9
        elif 17 <= hour <= 20: return 0.95
        elif 12 <= hour <= 14: return 0.5
        elif 0 <= hour <= 5: return 0.1
        else: return 0.35

def get_aqi_label(aqi):
    if aqi <= 50: return "Good 🟢"
    elif aqi <= 100: return "Moderate 🟡"
    elif aqi <= 150: return "Unhealthy for Sensitive Groups 🟠"
    elif aqi <= 200: return "Unhealthy 🔴"
    elif aqi <= 300: return "Very Unhealthy 🟣"
    else: return "Hazardous ☠️"

def predict_aqi():
    print("🔮 Predicting AQI for next 2 hours...\n")

    weather = get_current_weather()
    now = datetime.now()

    predictions = []

    for hour_offset in [1, 2]:
        future_hour = (now.hour + hour_offset) % 24
        is_weekend = 1 if now.weekday() >= 5 else 0
        congestion = get_traffic_congestion(future_hour, is_weekend)

        # Build feature row
        features = pd.DataFrame([{
            "temperature": weather["temperature"],
            "humidity": weather["humidity"],
            "wind_speed": weather["wind_speed"],
            "wind_direction": weather["wind_direction"],
            "precipitation": weather["precipitation"],
            "visibility": weather["visibility"],
            "congestion_index": congestion,
            "pm25": 75.0,
            "pm10": 150.0,
            "hour": future_hour,
            "day_of_week": now.weekday(),
            "is_weekend": is_weekend,
            "month": now.month
        }])

        predicted_aqi = model.predict(features)[0]
        label = get_aqi_label(predicted_aqi)
        predictions.append((hour_offset, future_hour, predicted_aqi, label))

    print(f"📍 Location: Delhi/NCR")
    print(f"🕐 Current Time: {now.strftime('%Y-%m-%d %H:%M')}")
    print(f"🌡️  Temperature: {weather['temperature']:.1f}°C")
    print(f"💧 Humidity: {weather['humidity']:.1f}%")
    print(f"💨 Wind Speed: {weather['wind_speed']:.1f} km/h")
    print()

    for offset, hour, aqi, label in predictions:
        print(f"⏱️  After {offset} hour  → {hour:02d}:00 | AQI: {aqi:.1f} | {label}")

if __name__ == "__main__":
    predict_aqi()