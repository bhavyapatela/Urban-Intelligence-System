from fastapi import FastAPI
from dotenv import load_dotenv
from UrbanAI.routes.assistant import router as assistant_router
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(title="Urban Intelligence AI")

@app.get("/")
def read_root():
    return {"message": "Urban Intelligence AI Assistant is running!"}

app.include_router(assistant_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)