from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import User, Property, AssistantChat, Recommendation
from app.schemas.all_schemas import ChatMessageRequest, ChatMessageResponse
from app.services.ai_assistant import AIAssistantService

router = APIRouter(prefix="/assistant", tags=["Assistente Agronômico"])

@router.post("/chat", response_model=ChatMessageResponse)
async def chat_with_assistant(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    context_data = {}
    if request.property_id:
        prop = db.query(Property).filter(Property.id == request.property_id, Property.owner_id == current_user.id).first()
        if prop:
            recs = db.query(Recommendation).filter(Recommendation.property_id == prop.id).limit(3).all()
            context_data = {
                "property_name": prop.name,
                "location": f"{prop.municipality} - {prop.state}",
                "area_ha": prop.total_area_ha,
                "current_recommendations": [
                    {
                        "strategy": r.strategy_title,
                        "crops": r.crop_sequence,
                        "overall_score": r.score_overall,
                        "justification": r.justification
                    }
                    for r in recs
                ]
            }

    # Buscar histórico recente
    history_records = db.query(AssistantChat).filter(
        AssistantChat.user_id == current_user.id
    ).order_by(AssistantChat.created_at.desc()).limit(6).all()
    history = [{"role": h.role, "message": h.message} for h in reversed(history_records)]

    # Registrar pergunta do usuário
    user_chat = AssistantChat(
        user_id=current_user.id,
        property_id=request.property_id,
        role="user",
        message=request.message,
        context_data=context_data
    )
    db.add(user_chat)

    # Gerar resposta com as regras determinísticas do assistente
    ai_result = await AIAssistantService.generate_response(
        user_message=request.message,
        chat_history=history,
        context_data=context_data
    )

    # Registrar resposta do assistente
    assistant_chat = AssistantChat(
        user_id=current_user.id,
        property_id=request.property_id,
        role="assistant",
        message=ai_result["reply"],
        context_data={"sources": ai_result["context_sources"]}
    )
    db.add(assistant_chat)
    db.commit()

    return {
        "reply": ai_result["reply"],
        "context_sources": ai_result["context_sources"],
        "timestamp": ai_result["timestamp"]
    }

@router.get("/history")
def get_chat_history(
    property_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AssistantChat).filter(AssistantChat.user_id == current_user.id)
    if property_id:
        query = query.filter(AssistantChat.property_id == property_id)
    records = query.order_by(AssistantChat.created_at.asc()).limit(50).all()
    return [
        {
            "id": r.id,
            "role": r.role,
            "message": r.message,
            "created_at": r.created_at
        }
        for r in records
    ]
