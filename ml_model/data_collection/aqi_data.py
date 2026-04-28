import openmeteo_requests
import requests_cache
import pandas as pd
from retry_requests import retry

def fetch_historical_aqi():
    cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
    retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
    openmeteo = openmeteo_requests.Client(session=retry_session)

    url = "https://air-quality-api.open-meteo.com/v1/air-quality"

    params = {
        "latitude": 28.6139,
        "longitude": 77.2090,

        # 🔥 THIS IS THE FIX
        "start_date": "2025-10-01",
        "end_date": "2025-12-31",

        "hourly": [
            "pm10",
            "pm2_5",
            "nitrogen_dioxide",
            "carbon_monoxide",
            "us_aqi"
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

        "pm10": hourly.Variables(0).ValuesAsNumpy(),
        "pm2_5": hourly.Variables(1).ValuesAsNumpy(),
        "no2": hourly.Variables(2).ValuesAsNumpy(),
        "co": hourly.Variables(3).ValuesAsNumpy(),
        "aqi": hourly.Variables(4).ValuesAsNumpy(),
    })

    df.to_csv("ml_model/data/aqi_data.csv", index=False)

    print(f"✅ AQI data saved! Rows: {len(df)}")
    print(df.head())

    return df


if __name__ == "__main__":
    fetch_historical_aqi()