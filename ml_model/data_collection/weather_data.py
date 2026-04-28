import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry

def fetch_weather_data():
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)

    # ✅ CORRECT API (historical)
    url = "https://archive-api.open-meteo.com/v1/archive"

    params = {
        "latitude": 28.6139,
        "longitude": 77.2090,

        # ✅ SAME RANGE AS AQI + TRAFFIC
        "start_date": "2025-10-01",
        "end_date": "2025-12-31",

        "hourly": [
            "temperature_2m",
            "relative_humidity_2m"
        ],

        "timezone": "Asia/Kolkata"
    }

    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]

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

    df.to_csv("ml_model/data/weather_data.csv", index=False)

    print(f"✅ Weather data saved! Rows: {len(df)}")
    print(df.head())

    return df


if __name__ == "__main__":
    fetch_weather_data()