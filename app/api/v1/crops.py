from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.all_models import CropCatalog
from app.schemas.all_schemas import CropCatalogResponse

router = APIRouter(prefix="/crops", tags=["Catálogo Agronômico de Culturas"])

@router.get("", response_model=List[CropCatalogResponse])
def list_crops(
    category: Optional[str] = Query(None, description="Filtrar por categoria (ex: Graos, Leguminosas, Forrageiras)"),
    drought_tolerance: Optional[str] = Query(None, description="Filtrar por tolerância à seca (Alta, Media, Baixa)"),
    search: Optional[str] = Query(None, description="Pesquisar por nome popular ou científico"),
    db: Session = Depends(get_db)
):
    query = db.query(CropCatalog)
    if category:
        query = query.filter(CropCatalog.category.ilike(f"%{category}%"))
    if drought_tolerance:
        query = query.filter(CropCatalog.drought_tolerance == drought_tolerance)
    if search:
        query = query.filter(
            (CropCatalog.common_name.ilike(f"%{search}%")) |
            (CropCatalog.scientific_name.ilike(f"%{search}%"))
        )
    return query.all()

@router.get("/{crop_id}", response_model=CropCatalogResponse)
def get_crop(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(CropCatalog).filter(CropCatalog.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Cultura não encontrada no catálogo.")
    return crop
