import os
import google.generativeai as genai

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-3.1-flash-lite-preview")

def generate_answer(question, city_data):

    prompt = f"""
    You are an AI assistant for a smart city system.

    User question: {question}

    City data:
    {city_data}

    Provide a helpful response.
    """

    response = model.generate_content(prompt)

    return response.text