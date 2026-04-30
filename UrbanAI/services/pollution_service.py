import os
import requests
from dotenv import load_dotenv

load_dotenv()

def get_pollution(city="Delhi"):

     token = os.getenv("WAQI_TOKEN")
     url = f"https://api.waqi.info/feed/{city}/?token={token}"

     response = requests.get(url).json()

     aqi = response["data"]["aqi"]

     return f"The air quality index is {aqi}"

