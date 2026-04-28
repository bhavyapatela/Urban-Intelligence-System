from fastapi import FastAPI
from dotenv import load_dotenv
from UrbanAI.routes.assistant import router as assistant_router

load_dotenv()

app = FastAPI(title="Urban Intelligence AI")

app.include_router(assistant_router)