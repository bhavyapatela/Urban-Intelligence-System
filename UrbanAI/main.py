from fastapi import FastAPI
from routes.assistant import router as assistant_router

app = FastAPI(title="Urban Intelligence AI")

app.include_router(assistant_router)
