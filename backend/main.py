from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextResponse(BaseModel):
    text: str
    timestamp: str

@app.get("/")
async def root():
    return {"message": "Welcome to the FastAPI backend!"}

@app.get("/generate-text", response_model=TextResponse)
async def generate_text():
    import datetime
    return TextResponse(
        text="This is some generated text from the FastAPI backend!",
        timestamp=datetime.datetime.now().isoformat()
    )