import os
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

def get_weather_condition(code):
    """Maps WMO Weather interpretation codes to human-readable conditions."""
    mapping = {
        0: "Sunny",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Hazy",
        51: "Drizzle", 53: "Drizzle", 55: "Drizzle",
        61: "Rainy", 63: "Rainy", 65: "Heavy Rain",
        71: "Snowy", 73: "Snowy", 75: "Snowy",
        80: "Rain Showers", 81: "Rain Showers", 82: "Rain Showers",
        95: "Thunderstorm", 96: "Stormy", 99: "Stormy"
    }
    return mapping.get(code, "Clear")

def get_weather(city="Delhi", lat=28.6139, lon=77.2090):
    """
    Fetches comprehensive live weather data from Open-Meteo.
    Returns structured JSON with 7 days of hourly data.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m"
        "&hourly=temperature_2m,precipitation_probability,relative_humidity_2m,wind_speed_10m"
        "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max"
        "&timezone=auto"
    )
    
    try:
        print(f"DEBUG: Fetching full structured weather for {city} ({lat}, {lon}) from Open-Meteo...")
        response = requests.get(url, timeout=10)
        data = response.json()

        if response.status_code == 200:
            current = data["current"]
            hourly = data["hourly"]
            daily = data["daily"]

            # Format 7-day forecast
            forecast = []
            for i in range(len(daily["time"])):
                forecast.append({
                    "date": daily["time"][i],
                    "max_temp": daily["temperature_2m_max"][i],
                    "min_temp": daily["temperature_2m_min"][i],
                    "condition": get_weather_condition(daily["weather_code"][i]),
                    "sunrise": daily["sunrise"][i].split('T')[1],
                    "sunset": daily["sunset"][i].split('T')[1],
                    "uv_index": daily["uv_index_max"][i]
                })

            weather_info = {
                "city": city,
                "temperature": current["temperature_2m"],
                "feels_like": current["apparent_temperature"],
                "condition": get_weather_condition(current["weather_code"]),
                "humidity": current["relative_humidity_2m"],
                "wind_speed": current["wind_speed_10m"],
                "pressure": current["pressure_msl"],
                "precipitation": current["precipitation"],
                "rain_probability": hourly["precipitation_probability"][0], # Current hour
                "forecast": forecast,
                "hourly": {
                    "time": hourly["time"], # Full 168 hours
                    "temperature": hourly["temperature_2m"],
                    "rain_probability": hourly["precipitation_probability"],
                    "humidity": hourly["relative_humidity_2m"],
                    "wind_speed": hourly["wind_speed_10m"]
                },
                "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "source": "Open-Meteo (Real-time)"
            }
            print(f"DEBUG: Structured weather data received for {city}")
            return weather_info
        else:
            print(f"Error: Open-Meteo API returned {response.status_code}")
            return {"error": "API Error", "source": "Open-Meteo"}

    except Exception as e:
        print(f"Error fetching structured weather: {str(e)}")
        return {"error": "Connection failed", "source": "Open-Meteo"}