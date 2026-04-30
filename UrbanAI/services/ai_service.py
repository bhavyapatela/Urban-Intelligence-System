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
    1. If intent is HELP: Explicitly list that you can provide AQI insights, weather info, and traffic updates. Be helpful and welcoming.
    2. If intent is POLLUTION: Focus heavily on AQI levels and respiratory safety using the provided data.
    3. If intent is WEATHER: Focus on temperature, humidity, and outdoor conditions using the provided data.
    4. If intent is TRAFFIC: Focus on congestion levels and travel advice using the provided data.
    5. If intent is GENERAL: Be conversational. If the user is just saying hello, respond naturally. Only provide a data summary if it seems relevant to their question.
    
    Data Analysis (only if intent is POLLUTION, WEATHER, TRAFFIC, or a data-focused GENERAL query):
       - Analyze AQI from City Data:
         - > 200: Unhealthy (stay indoors).
         - 100-200: Moderate (caution).
         - < 100: Safe.
    
    Response Format:
    - 2-3 lines maximum.
    - Be concise and actionable.
    - If intent is HELP, do NOT mention specific current data unless asked.
    """

    response = model.generate_content(prompt)
    return response.text