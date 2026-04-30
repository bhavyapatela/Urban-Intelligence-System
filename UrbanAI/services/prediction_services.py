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
# LOAD MODEL (only once)
# ==============================
model = joblib.load("ml_model/model/saved_model/aqi_model.pkl")


# ==============================
# GET LIVE WEATHER DATA
# ==============================
def get_current_weather():
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
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


# ==============================
# GET LIVE POLLUTION DATA
# ==============================
def get_live_pollution():
    url = "http://api.openweathermap.org/data/2.5/air_pollution"

    params = {
        "lat": 28.6139,
        "lon": 77.2090,
        "appid": os.getenv("OPENWEATHER_API_KEY")
    }

    response = requests.get(url, params=params)
    data = response.json()

    comp = data["list"][0]["components"]

    return {
        "pm2_5": comp["pm2_5"],
        "pm10": comp["pm10"]
    }


# ==============================
# TRAFFIC (STILL SIMULATED)
# ==============================
def get_traffic(hour, is_weekend):
    if is_weekend:
        return 0.5 if 10 <= hour <= 13 else 0.2
    else:
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            return 0.9
        return 0.3


# ==============================
# MAIN PREDICTION FUNCTION
# ==============================
def predict_aqi():
    now = datetime.now()

    weather = get_current_weather()
    pollution = get_live_pollution()

    future_hour = (now.hour + 1) % 24
    is_weekend = 1 if now.weekday() >= 5 else 0

    traffic = get_traffic(future_hour, is_weekend)

    features = pd.DataFrame([{
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "pm10": pollution["pm10"],
        "pm2_5": pollution["pm2_5"],
        "traffic_index": traffic,
        "hour": future_hour,
        "day": now.day,
        "month": now.month
    }])

    prediction = model.predict(features)[0]

    return {
        "predicted_aqi": round(float(prediction), 2),
        "hour": future_hour,
        "pm25": pollution["pm2_5"],
        "pm10": pollution["pm10"],
        "temperature": float(weather["temperature"]),
        "humidity": float(weather["humidity"]),
        "traffic": traffic
    }