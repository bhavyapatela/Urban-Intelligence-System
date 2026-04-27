from fastapi import APIRouter
from UrbanAI.services.prediction_services import predict_aqi

router = APIRouter()

@router.get("/predict-aqi")
def get_prediction():
    return predict_aqi()