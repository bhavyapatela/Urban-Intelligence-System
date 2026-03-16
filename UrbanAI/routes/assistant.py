from fastapi import APIRouter
from models.query_model import UserQuery
from services.weather_service import get_weather
from services.pollution_service import get_pollution
from services.ai_service import generate_answer
from services.traffic_service import get_traffic

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