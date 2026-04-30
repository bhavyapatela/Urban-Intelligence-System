import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-3.1-flash-lite-preview")

def generate_answer(question, city_data):
    """
    Generates a structured, intelligent response as an Urban Intelligence Assistant.
    Uses city_data to provide actionable advice.
    """
    prompt = f"""
    You are an Urban Intelligence Assistant.
    
    Input Data:
    - User Question: {question}
    - City Data: {city_data}
    
    Rules:
    1. Analyze AQI:
       - > 200: State it's unhealthy and suggest staying indoors.
       - 100-200: State it's moderate and suggest caution.
       - < 100: State it's safe.
    2. Briefly mention temperature and humidity.
    3. Mention the traffic condition (low, moderate, or high).
    4. Handle any missing data gracefully without technical errors.
    
    Response Format:
    - 3-4 lines maximum.
    - Simple English.
    - Must include specific actionable advice based on the data.
    - No generic answers. Always use the provided data points.
    """

    response = model.generate_content(prompt)
    return response.text