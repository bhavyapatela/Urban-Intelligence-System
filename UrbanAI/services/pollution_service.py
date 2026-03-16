import requests

def get_pollution(city="Delhi"):

     url = f"https://api.waqi.info/feed/{city}/?token=demo"

     response = requests.get(url).json()

     aqi = response["data"]["aqi"]

     return f"The air quality index is {aqi}"

