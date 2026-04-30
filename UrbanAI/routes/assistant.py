from fastapi import APIRouter, HTTPException
from UrbanAI.models.query_model import UserQuery
from UrbanAI.models.chat_model import ChatRequest, ChatResponse, ChatResponseData
from pydantic import BaseModel
from UrbanAI.services.weather_service import get_weather
from UrbanAI.services.traffic_service import get_traffic
from UrbanAI.services.prediction_services import predict_aqi
from UrbanAI.services.ai_service import generate_answer

router = APIRouter()


@router.post("/ask")
async def ask_ai(query: UserQuery):
    """
    Main AI assistant endpoint with intent detection and service routing.
    Detects user intent (AQI, Weather, Traffic) and routes to appropriate service.
    """
    try:
        question = query.question.lower()

        # 1. AQI / Pollution Prediction Intent
        if any(word in question for word in ["aqi", "pollution", "air", "predict"]):
            prediction = predict_aqi()
            return {
                "type": "prediction",
                "response": f"The predicted AQI is {prediction['predicted_aqi']}. Details: Temp {prediction['temperature']}°C, Humidity {prediction['humidity']}%."
            }

        # 2. Weather Intent
        if "weather" in question:
            try:
                weather_data = get_weather()
                return {"type": "weather", "response": weather_data}
            except Exception:
                return {"type": "weather", "response": "Currently unable to fetch weather data."}

        # 3. Traffic Intent
        if any(word in question for word in ["traffic", "road", "congestion"]):
            try:
                traffic_data = get_traffic()
                return {"type": "traffic", "response": traffic_data}
            except Exception:
                return {"type": "traffic", "response": "Traffic information is currently unavailable."}

        # 4. General AI Assistant Intent
        answer = generate_answer(query.question, "")
        return {"type": "general", "response": answer}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant Error: {str(e)}")

@router.get("/predict-aqi")
def get_prediction(lat: float = 28.6139, lon: float = 77.2090):
    """Direct endpoint for AQI prediction."""
    return predict_aqi(lat, lon)

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Improved chatbot endpoint for Urban Intelligence System.
    Uses real-time data from the AQI prediction service.
    """
    try:
        # 1. Call predict_aqi() to get real project data
        # Use provided lat/lon or fallback to Delhi
        lat = request.lat or 28.6139
        lon = request.lon or 77.2090
        aqi_data = predict_aqi(lat, lon)
        
        # 2. Use the returned data as city_data for the AI
        # We include the city name from the request for completeness
        city_data = {
            "city": request.city,
            **aqi_data
        }
        
        # 3. Keyword-based Intent Detection
        message = request.message.lower()
        intent = "general"
        if any(w in message for w in ["help", "do", "can you", "capabilities", "features"]):
            intent = "help"
        elif any(w in message for w in ["pollution", "aqi", "air", "smog"]):
            intent = "pollution"
        elif any(w in message for w in ["weather", "temp", "hot", "cold", "rain", "sunny"]):
            intent = "weather"
        elif any(w in message for w in ["traffic", "road", "congestion", "jam", "route"]):
            intent = "traffic"
            
        # 4. Pass request.message, city_data, and detected intent to generate_answer()
        ai_response = generate_answer(request.message, city_data, intent)
        
        # 4. Return both the AI response and the data used
        # Mapping aqi_data fields to ChatResponseData structure
        response_data = ChatResponseData(
            city=request.city,
            weather=f"Temp: {aqi_data.get('temperature')}°C, Humidity: {aqi_data.get('humidity')}%",
            pollution={
                "pm25": aqi_data.get("pm25"),
                "pm10": aqi_data.get("pm10")
            },
            traffic=f"Traffic Index: {aqi_data.get('traffic')}",
            predicted_aqi=aqi_data.get("predicted_aqi")
        )
        
        return ChatResponse(
            response=ai_response,
            data=response_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Chat Error: {str(e)}"
        )
