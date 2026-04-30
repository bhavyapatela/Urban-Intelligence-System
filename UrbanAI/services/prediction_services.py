import os
import pandas as pd
from dotenv import load_dotenv

load_dotenv()
import joblib
from datetime import datetime
import requests
import openmeteo_requests
import requests_cache
from retry_requests import retry

# ==============================
# LOAD MODEL
# ==============================
model = joblib.load("ml_model/model/saved_model/aqi_model.pkl")


# ==============================
# AQI CATEGORY (IMPORTANT)
# ==============================
def categorize_aqi(aqi):
    if aqi <= 50:
        return "Good"
    elif aqi <= 100:
        return "Moderate"
    elif aqi <= 150:
        return "Unhealthy (Sensitive)"
    elif aqi <= 200:
        return "Unhealthy"
    else:
        return "Very Unhealthy"


# ==============================
# GET LIVE WEATHER
# ==============================
def get_current_weather():
    try:
        cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
        retry_session = retry(cache_session, retries=3, backoff_factor=0.2)
        openmeteo = openmeteo_requests.Client(session=retry_session)

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": 28.6139,
            "longitude": 77.2090,
            "hourly": ["temperature_2m", "relative_humidity_2m"],
            "timezone": "Asia/Kolkata",
            "forecast_days": 1
        }

        response = openmeteo.weather_api(url, params=params)[0]
        hourly = response.Hourly()

        df = pd.DataFrame({
            "time": pd.date_range(
                start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
                end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
                freq=pd.Timedelta(seconds=hourly.Interval()),
                inclusive="left"
            ).tz_convert("Asia/Kolkata"),
            "temperature": hourly.Variables(0).ValuesAsNumpy(),
            "humidity": hourly.Variables(1).ValuesAsNumpy(),
        })

        current_hour = datetime.now().hour
        return df[df["time"].dt.hour == current_hour].iloc[0]

    except Exception:
        return {"temperature": 30, "humidity": 50}  # fallback


# ==============================
# GET LIVE POLLUTION
# ==============================
def get_live_pollution():
    try:
        url = "http://api.openweathermap.org/data/2.5/air_pollution"
        params = {
            "lat": 28.6139,
            "lon": 77.2090,
            "appid": "5711ba1f7e117df8f9c2c4f2accc3f7d"
        }

<<<<<<< HEAD
    params = {
        "lat": 28.6139,
        "lon": 77.2090,
        "appid": os.getenv("OPENWEATHER_API_KEY")
    }
=======
        response = requests.get(url, params=params, timeout=5)
        data = response.json()
>>>>>>> dc43980 (Update)

        comp = data["list"][0]["components"]

        return {
            "pm2_5": comp["pm2_5"],
            "pm10": comp["pm10"]
        }

    except Exception:
        return {"pm2_5": 50, "pm10": 100}  # fallback


# ==============================
# MAIN PREDICTION
# ==============================
def predict_aqi():
    now = datetime.now()

    weather = get_current_weather()
    pollution = get_live_pollution()

    # ✅ MATCH TRAINING FEATURES EXACTLY
    features = pd.DataFrame([{
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "pm10": pollution["pm10"],
        "pm2_5": pollution["pm2_5"],
        "traffic_index": 0.3,   # keep simple
        "hour": now.hour,
        "day": now.day,
        "month": now.month
    }])

    # ✅ FORCE CORRECT ORDER (VERY IMPORTANT)
    expected_cols = [
        "temperature","humidity","pm10","pm2_5",
        "traffic_index","hour","day","month"
    ]
    features = features[expected_cols]

    prediction = model.predict(features)[0]
    prediction = round(float(prediction), 2)

    return {
        "predicted_aqi": prediction,
        "category": categorize_aqi(prediction),
        "pm25": round(pollution["pm2_5"], 2),
        "pm10": round(pollution["pm10"], 2),
        "temperature": round(float(weather["temperature"]), 2),
        "humidity": round(float(weather["humidity"]), 2),
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    }