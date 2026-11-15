from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.all_models import User, Property, FarmerProfile, SocialIndicatorRecord
from app.engine.social_engine import SocialAnalysisEngine
from app.schemas.all_schemas import SocialIndicatorResponse

router = APIRouter(prefix="/social", tags=["Dimensão Social e Regional"])

@router.get("/diagnostics/{property_id}")
def get_social_diagnostic(
    property_id: int,
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")

    profile = None
    
    # Buscar indicador social municipal correspondente
    social_rec = None
    if prop.ibge_code:
        social_rec = db.query(SocialIndicatorRecord).filter(
            SocialIndicatorRecord.municipality_ibge_code == prop.ibge_code
        ).first()

    if not social_rec:
        social_rec = db.query(SocialIndicatorRecord).filter(
            SocialIndicatorRecord.state == prop.state
        ).first()

    analysis = SocialAnalysisEngine.analyze_social_context(profile, social_rec)
    return {
        "property_id": property_id,
        "municipality": prop.municipality,
        "state": prop.state,
        "social_analysis": analysis
    }
