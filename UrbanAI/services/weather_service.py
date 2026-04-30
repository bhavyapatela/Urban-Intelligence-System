import requests

API_KEY = "5711ba1f7e117df8f9c2c4f2accc3f7d"

def get_weather(city="Delhi"):

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"

    response = requests.get(url).json()

    weather = response["weather"][0]["description"]
    temp = response["main"]["temp"]

    return f"Weather is {weather} with temperature {temp}°C"