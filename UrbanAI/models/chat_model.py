from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    city: str
    question: str

class ChatResponseData(BaseModel):
    city: str
    weather: Dict[str, Any] = {}
    pollution: Dict[str, Any] = {}
    traffic: Dict[str, Any] = {}
    predicted_aqi: Optional[int] = None

class ChatResponse(BaseModel):
    answer: str
    data: ChatResponseData
