<<<<<<< HEAD
from fastapi import APIRouter
from models.query_model import UserQuery
from services.weather_service import get_weather
from services.pollution_service import get_pollution
from services.ai_service import generate_answer
from services.traffic_service import get_traffic
from models.chat_model import ChatRequest, ChatResponse, ChatResponseData


router = APIRouter()
@router.post("/ask")
def ask_ai(query: UserQuery):

    question = query.question.lower()

    city_data = ""

    if "weather" in question:
        city_data += get_weather()

    if "pollution" in question or "air" in question:
        city_data += get_pollution()

    if "traffic" in question or "road" in question or "congestion" in question:
        city_data += get_traffic()

    answer = generate_answer(question, city_data)

    return {"response": answer}

@router.post("/chat", response_model=ChatResponse)
def chat_with_ai(request: ChatRequest):
    """
    Main chatbot endpoint for Urban Intelligence System.
    """
    try:
        # For now, we use mock data as requested
        mock_data = ChatResponseData(
            city=request.city,
            weather={"temp": "25C", "condition": "Sunny"},
            pollution={"aqi": 42, "status": "Good"},
            traffic={"level": "Low", "congestion": "Normal"},
            predicted_aqi=None
        )

        return ChatResponse(
            answer="This is a basic chatbot response for " + request.city,
            data=mock_data
        )
    except Exception as e:
        # Simple error handling for beginners
        return ChatResponse(
            answer="Sorry, something went wrong.",
            data=ChatResponseData(city=request.city)
        )

=======
from fastapi import APIRouter
from UrbanAI.services.prediction_services import predict_aqi

router = APIRouter()

@router.get("/predict-aqi")
def get_prediction():
    return predict_aqi()
>>>>>>> 1ecc5dc0d6d5a435aa1d718c8466dc0ea15afcb6
