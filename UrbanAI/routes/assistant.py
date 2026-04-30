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
def get_prediction():
    """Direct endpoint for AQI prediction."""
    return predict_aqi()

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(request: ChatRequest):
    """
    Improved chatbot endpoint for Urban Intelligence System.
    Integrates real-time data from weather, pollution, and traffic services.
    """
    try:
        # 1. Collect real data from services
        weather_report = get_weather(request.city)
        aqi_data = predict_aqi()
        traffic_report = get_traffic()
        
        # 2. Create city_data dictionary with all values
        city_data = {
            "city": request.city,
            "weather": weather_report,
            "pollution": aqi_data,
            "traffic": traffic_report,
            "predicted_aqi": aqi_data.get("predicted_aqi")
        }
        
        # 3. Pass user question and collected city_data dictionary to generate_answer()
        answer = generate_answer(request.question, city_data)
        
        # 4. Construct and return structured response
        return ChatResponse(
            answer=answer,
            data=ChatResponseData(**city_data)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Chat Error: {str(e)}"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Chat Error: {str(e)}"
        )
