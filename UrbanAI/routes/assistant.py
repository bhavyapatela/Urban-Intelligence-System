from fastapi import APIRouter, HTTPException
from UrbanAI.models.query_model import UserQuery
from UrbanAI.services.weather_service import get_weather
from UrbanAI.services.traffic_service import get_traffic
from UrbanAI.services.prediction_services import predict_aqi
from UrbanAI.services.ai_service import generate_answer
from UrbanAI.models.chat_model import ChatRequest, ChatResponse, ChatResponseData


router = APIRouter()

@router.post("/ask")
def ask_ai(query: UserQuery):
    """
    Main AI assistant endpoint with intent detection and service routing.
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
        elif "weather" in question:
            try:
                weather_data = get_weather()
                return {
                    "type": "weather",
                    "response": weather_data
                }
            except Exception as e:
                return {
                    "type": "weather",
                    "response": "Currently unable to fetch weather data. Please try again later."
                }

        # 3. Traffic Intent
        elif any(word in question for word in ["traffic", "road", "congestion"]):
            try:
                traffic_data = get_traffic()
                return {
                    "type": "traffic",
                    "response": traffic_data
                }
            except Exception as e:
                return {
                    "type": "traffic",
                    "response": "Traffic information is currently unavailable."
                }

        # 4. General / LLM Intent
        else:
            answer = generate_answer(query.question, "")
            return {
                "type": "general",
                "response": answer
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant Error: {str(e)}")

@router.get("/predict-aqi")
def get_prediction():
    """Direct endpoint for AQI prediction."""
    return predict_aqi()

@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    """
    Main chatbot endpoint for Urban Intelligence System.
    """
    try:
        # Mock data for now as requested
        mock_data = ChatResponseData(
            city=request.city,
            weather={"temp": "25°C", "condition": "Sunny"},
            pollution={"aqi": 42, "status": "Good"},
            traffic={"level": "Low", "congestion": "Normal"},
            predicted_aqi=160.04 # Matching the example output the user saw
        )

        return ChatResponse(
            answer=f"The current intelligence report for {request.city} indicates stable conditions. {mock_data.weather['temp']} and {mock_data.weather['condition']}.",
            data=mock_data
        )
    except Exception as e:
        return ChatResponse(
            answer="Sorry, I encountered an error processing your request.",
            data=ChatResponseData(city=request.city)
        )

