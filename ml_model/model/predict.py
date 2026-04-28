import pandas as pd
import joblib
from datetime import datetime
import openmeteo_requests
import requests_cache
from retry_requests import retry

# Load model
model = joblib.load("ml_model/model/saved_model/aqi_model.pkl")


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

    return df.iloc[0]


def get_traffic(hour, is_weekend):
    if is_weekend:
        return 0.5 if 10 <= hour <= 13 else 0.2
    else:
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            return 0.9
        return 0.3


def predict_aqi():
    now = datetime.now()
    weather = get_current_weather()

    future_hour = (now.hour + 1) % 24
    is_weekend = 1 if now.weekday() >= 5 else 0

    traffic = get_traffic(future_hour, is_weekend)

    # ⚠️ still limitation: no real pollutant data
    features = pd.DataFrame([{
        "temperature": weather["temperature"],
        "humidity": weather["humidity"],
        "pm10": 100,      # placeholder (mention in viva)
        "pm2_5": 50,      # placeholder
        "traffic_index": traffic,
        "hour": future_hour,
        "day": now.day,
        "month": now.month
    }])

    prediction = model.predict(features)[0]

    return {
        "predicted_aqi": round(float(prediction), 2),
        "hour": future_hour
    }


if __name__ == "__main__":
    result = predict_aqi()
    print(result)