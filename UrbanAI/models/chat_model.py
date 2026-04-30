from pydantic import BaseModel
from typing import Optional, Dict, Any

class ChatRequest(BaseModel):
    city: str
    message: str

class ChatResponseData(BaseModel):
    city: str
    weather: Any = {}
    pollution: Any = {}
    traffic: Any = {}
    predicted_aqi: Optional[float] = None

class ChatResponse(BaseModel):
    response: str
    data: ChatResponseData
