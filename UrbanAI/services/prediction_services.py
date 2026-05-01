import os
import pandas as pd
from dotenv import load_dotenv
load_dotenv()

import joblib
from datetime import datetime
import requests
import openmeteo_requests

# ==============================
# LOAD MODEL
# ==============================
model = joblib.load("ml_model/model/saved_model/aqi_model.pkl")


# ==============================
# AQI CATEGORY
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
def get_current_weather(lat=28.6139, lon=77.2090):
    """Fetches real-time weather using OpenWeatherMap for accuracy."""
    try:
        api_key = os.getenv("OPENWEATHER_API_KEY")
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        
        print(f"DEBUG: Fetching weather for coords ({lat}, {lon}) from OpenWeatherMap API...")
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if response.status_code == 200:
            print(f"DEBUG: Weather data received: {data['main']['temp']}°C, {data['main']['humidity']}% humidity.")
            return {
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"]
            }
        else:
            print(f"Weather API Error: {data.get('message')}")
            raise Exception("API Error")

    except Exception as e:
        print(f"Fallback to Open-Meteo due to: {e}")
        # Fallback to Open-Meteo if OpenWeatherMap fails
        try:
            openmeteo = openmeteo_requests.Client()
            url = "https://api.open-meteo.com/v1/forecast"
            params = {
                "latitude": lat,
                "longitude": lon,
                "current": ["temperature_2m", "relative_humidity_2m"],
                "timezone": "Asia/Kolkata"
            }
            print(f"DEBUG: Fetching fallback weather from Open-Meteo for ({lat}, {lon})...")
            response = openmeteo.weather_api(url, params=params)[0]
            current = response.Current()
            return {
                "temperature": current.Variables(0).Value(),
                "humidity": current.Variables(1).Value()
            }
        except Exception:
            print("CRITICAL: All weather sources failed. Using fallback defaults.")
            return {"temperature": 28.5, "humidity": 40}


# ==============================
# GET LIVE POLLUTION
# ==============================
def get_live_pollution(lat=28.6139, lon=77.2090):
    try:
        url = "http://api.openweathermap.org/data/2.5/air_pollution"

        params = {
            "lat": lat,
            "lon": lon,
            "appid": os.getenv("OPENWEATHER_API_KEY")
        }

        print(f"DEBUG: Fetching live pollution for ({lat}, {lon}) from OpenWeatherMap API...")
        response = requests.get(url, params=params, timeout=5)
        data = response.json()

        comp = data["list"][0]["components"]

        return {
            "pm2_5": comp["pm2_5"],
            "pm10": comp["pm10"]
        }

    except Exception as e:
        print(f"Error fetching live pollution: {e}. Using fallback defaults.")
        return {"pm2_5": 50, "pm10": 100}


# ==============================
# MAIN PREDICTION
# ==============================
def predict_aqi(lat=28.6139, lon=77.2090):
    now = datetime.now()

    print(f"DEBUG: Starting AQI prediction for Coords: ({lat}, {lon})")
    
    weather = get_current_weather(lat, lon)
    pollution = get_live_pollution(lat, lon)

    features = pd.DataFrame([{
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "pm10": pollution["pm10"],
        "pm2_5": pollution["pm2_5"],
        "traffic_index": 0.3,
        "hour": now.hour,
        "day": now.day,
        "month": now.month
    }])

    expected_cols = [
        "temperature","humidity","pm10","pm2_5",
        "traffic_index","hour","day","month"
    ]
    features = features[expected_cols]

    prediction = model.predict(features)[0]
    prediction = round(float(prediction), 2)

    result = {
        "predicted_aqi": prediction,
        "category": categorize_aqi(prediction),
        "pm25": round(pollution["pm2_5"], 2),
        "pm10": round(pollution["pm10"], 2),
        "temperature": round(float(weather["temperature"]), 2),
        "humidity": round(float(weather["humidity"]), 2),
        "timestamp": now.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    print(f"DEBUG: Prediction complete. Predicted AQI: {prediction}")
    return result