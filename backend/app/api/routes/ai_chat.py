from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.api.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


class ChatMessage(BaseModel):
    message: str


@router.post("/")
async def chat(message: ChatMessage):
    """Process a chat message and generate dashboard components"""
    try:
        response = await ai_service.process_chat_message(message.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
