from fastapi import FastAPI
from UrbanAI.routes.assistant import router as assistant_router

app = FastAPI(title="Urban Intelligence AI")

app.include_router(assistant_router)