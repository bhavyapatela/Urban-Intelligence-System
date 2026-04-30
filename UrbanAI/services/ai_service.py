import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-3.1-flash-lite-preview")

def generate_answer(question, city_data, intent="general"):
    """
    Generates a structured, intelligent response as an Urban Intelligence Assistant.
    Focuses the response based on the detected intent.
    """
    prompt = f"""
    You are an Urban Intelligence Assistant.
    
    Current Intent: {intent.upper()}
    Input Data:
    - User Question: {question}
    - City Data: {city_data}
    
    Rules:
    1. If intent is POLLUTION: Focus heavily on AQI levels and respiratory safety.
    2. If intent is WEATHER: Focus on temperature, humidity, and outdoor conditions.
    3. If intent is TRAFFIC: Focus on congestion levels and travel advice.
    4. If intent is GENERAL: Provide a balanced overview of all available metrics.
    
    Analyze AQI:
       - > 200: State it's unhealthy and suggest staying indoors.
       - 100-200: State it's moderate and suggest caution.
       - < 100: State it's safe.
    
    Response Format:
    - 3-4 lines maximum.
    - Focus ONLY on data relevant to the {intent} intent. Avoid unnecessary details.
    - Simple English and specific actionable advice.
    """

    response = model.generate_content(prompt)
    return response.text