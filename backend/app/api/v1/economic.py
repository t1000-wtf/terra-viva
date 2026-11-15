from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import User, CropCatalog, FarmerProfile
from app.engine.economic_engine import EconomicAnalysisEngine

router = APIRouter(prefix="/economic", tags=["Dimensão Econômica"])

@router.get("/estimate")
def get_economic_estimate(
    crop_names: str = Query(..., description="Nomes das culturas separados por vírgula (ex: Soja,Milho)"),
    area_ha: float = Query(10.0, ge=0.1, description="Área cultivada em hectares"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    names_list = [name.strip().lower() for name in crop_names.split(",") if name.strip()]
    crops = db.query(CropCatalog).all()
    selected = [c for c in crops if c.common_name.lower() in names_list]

    if not selected:
        raise HTTPException(status_code=400, detail="Nenhuma das culturas informadas foi localizada no catálogo.")

    profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    estimate = EconomicAnalysisEngine.evaluate_crop_sequence_economy(selected, area_ha, profile)
    return estimate
