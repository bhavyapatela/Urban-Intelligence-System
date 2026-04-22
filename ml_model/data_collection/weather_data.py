import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry

def fetch_weather_data():
    # Setup cache and retry
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)

    # Delhi coordinates
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
        "past_days": 7,
        "forecast_days": 1
    }

    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]

    hourly = response.Hourly()
    hourly_data = {
        "timestamp": pd.date_range(
            start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
            end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
            freq=pd.Timedelta(seconds=hourly.Interval()),
            inclusive="left"
        ).tz_convert("Asia/Kolkata").strftime("%Y-%m-%d %H:%M"),
        "temperature": hourly.Variables(0).ValuesAsNumpy(),
        "humidity": hourly.Variables(1).ValuesAsNumpy(),
        "wind_speed": hourly.Variables(2).ValuesAsNumpy(),
        "wind_direction": hourly.Variables(3).ValuesAsNumpy(),
        "precipitation": hourly.Variables(4).ValuesAsNumpy(),
        "visibility": hourly.Variables(5).ValuesAsNumpy(),
    }

    df = pd.DataFrame(hourly_data)
    df.to_csv("ml_model/data/weather_data.csv", index=False)
    print(f"✅ Weather data saved! Total rows: {len(df)}")
    print(df.head())
    return df

if __name__ == "__main__":
    fetch_weather_data()