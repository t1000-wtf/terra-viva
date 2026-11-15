from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import User, UserPriority
from app.schemas.all_schemas import UserPriorityUpdate, UserPriorityResponse

router = APIRouter(prefix="/priorities", tags=["Pesos e Prioridades Multicritério"])

@router.get("", response_model=UserPriorityResponse)
def get_priorities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    priority = db.query(UserPriority).filter(UserPriority.user_id == current_user.id).first()
    if not priority:
        priority = UserPriority(user_id=current_user.id)
        db.add(priority)
        db.commit()
        db.refresh(priority)
    return priority

@router.put("", response_model=UserPriorityResponse)
def update_priorities(
    priority_in: UserPriorityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validar soma dos pesos das três dimensões (deve ser aproximadamente 100)
    total_weights = (
        priority_in.weight_environmental +
        priority_in.weight_social +
        priority_in.weight_economic
    )
    if abs(total_weights - 100.0) > 0.1:
        raise HTTPException(
            status_code=400,
            detail=f"A soma dos pesos ambiental, social e econômico deve ser exatamente 100%. Soma atual: {total_weights}%"
        )

    priority = db.query(UserPriority).filter(UserPriority.user_id == current_user.id).first()
    if not priority:
        priority = UserPriority(user_id=current_user.id)
        db.add(priority)

    for field, value in priority_in.model_dump(exclude_unset=True).items():
        setattr(priority, field, value)

    db.commit()
    db.refresh(priority)
    return priority
