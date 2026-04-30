import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

def get_weather(city="Delhi"):

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

    response = requests.get(url).json()

    weather = response["weather"][0]["description"]
    temp = response["main"]["temp"]

    return f"Weather is {weather} with temperature {temp}°C"