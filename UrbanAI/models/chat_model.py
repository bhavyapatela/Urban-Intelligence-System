from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    city: str
    question: str

class ChatResponseData(BaseModel):
    city: str
    weather: Any = {}
    pollution: Any = {}
    traffic: Any = {}
    predicted_aqi: Optional[float] = None

class ChatResponse(BaseModel):
    answer: str
    data: ChatResponseData
