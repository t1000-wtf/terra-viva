from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.all_models import Plot, CropHistory
from app.schemas.all_schemas import CropHistoryCreate, CropHistoryResponse

router = APIRouter(prefix="/plots/{plot_id}/history", tags=["Histórico Agrícola"])

def verify_plot_access(plot_id: int, db: Session) -> Plot:
    plot = db.query(Plot).filter(Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado ou não pertence ao usuário.")
    return plot

@router.post("", response_model=CropHistoryResponse, status_code=status.HTTP_201_CREATED)
def add_crop_history(
    plot_id: int,
    history_in: CropHistoryCreate,
    db: Session = Depends(get_db)
):
    verify_plot_access(plot_id, db)
    history = CropHistory(
        plot_id=plot_id,
        crop_name=history_in.crop_name,
        planting_date=history_in.planting_date,
        harvest_date=history_in.harvest_date,
        season_name=history_in.season_name,
        productivity_kg_ha=history_in.productivity_kg_ha,
        water_consumption_estimated_mm=history_in.water_consumption_estimated_mm,
        production_cost_brl=history_in.production_cost_brl,
        pest_or_disease_issues=history_in.pest_or_disease_issues,
        notes=history_in.notes
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return history

@router.get("", response_model=List[CropHistoryResponse])
def get_plot_history(
    plot_id: int,
    db: Session = Depends(get_db)
):
    verify_plot_access(plot_id, db)
    return db.query(CropHistory).filter(CropHistory.plot_id == plot_id).order_by(CropHistory.planting_date.desc()).all()
