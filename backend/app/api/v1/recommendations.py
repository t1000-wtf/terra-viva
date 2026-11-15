from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import (
    User, Property, Plot, CropCatalog, FarmerProfile, UserPriority,
    EnvironmentalRecord, Recommendation, Alert
)
from app.schemas.all_schemas import RecommendationResponse, AlertResponse
from app.engine.environmental_engine import EnvironmentalAnalysisEngine
from app.engine.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/recommendations", tags=["Recomendações e Rotação de Culturas"])

@router.post("/generate/{plot_id}", response_model=List[RecommendationResponse])
def generate_plot_recommendations(
    plot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plot = db.query(Plot).join(Property).filter(Plot.id == plot_id, Property.owner_id == current_user.id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado.")

    property_id = plot.property_id
    farmer_profile = db.query(FarmerProfile).filter(FarmerProfile.user_id == current_user.id).first()
    user_priority = db.query(UserPriority).filter(UserPriority.user_id == current_user.id).first()
    
    # Obter dados ambientais recentes da propriedade
    env_records = db.query(EnvironmentalRecord).filter(
        EnvironmentalRecord.property_id == property_id
    ).order_by(EnvironmentalRecord.observation_date.desc()).limit(60).all()
    
    env_analysis = EnvironmentalAnalysisEngine.analyze_environmental_conditions(env_records, plot)
    catalog_crops = db.query(CropCatalog).all()

    # Executar o motor multicritério
    strategies = RecommendationEngine.generate_strategies(
        plot=plot,
        farmer_profile=farmer_profile,
        user_priority=user_priority,
        env_analysis=env_analysis,
        catalog_crops=catalog_crops
    )

    # Persistir no banco de dados
    saved_recommendations = []
    # Limpar recomendações anteriores para este talhão
    db.query(Recommendation).filter(Recommendation.plot_id == plot_id).delete()

    for s in strategies:
        rec = Recommendation(
            property_id=property_id,
            plot_id=plot_id,
            strategy_type=s["strategy_type"],
            strategy_title=s["strategy_title"],
            strategy_description=s["strategy_description"],
            crop_sequence=s["crop_sequence"],
            duration_months=s["duration_months"],
            score_environmental=s["score_environmental"],
            score_social=s["score_social"],
            score_economic=s["score_economic"],
            score_overall=s["score_overall"],
            confidence_level=s["confidence_level"],
            potential_benefits=s["potential_benefits"],
            risks=s["risks"],
            limitations=s["limitations"],
            justification=s["justification"],
            sources_cited=s["sources_cited"]
        )
        db.add(rec)
        saved_recommendations.append(rec)

    # Gerar alertas automáticos se houver riscos ambientais críticos
    if env_analysis.get("drought_risk") == "ALTO":
        alert = Alert(
            property_id=property_id,
            plot_id=plot_id,
            alert_type="SECA_ESTIAGEM",
            severity="alta",
            title="Alerta de Estiagem Prolongada",
            description="Observada anomalia negativa severa de umidade pelo satélite SMAP e período sem chuvas.",
            confidence="Alta",
            recommended_action="Priorize a Estratégia C (Resiliente) com culturas de tolerância à seca (Sorgo/Milheto) e manutenção de cobertura morta.",
            source="NASA SMAP & GPM IMERG"
        )
        db.add(alert)

    db.commit()
    for r in saved_recommendations:
        db.refresh(r)

    return saved_recommendations

@router.get("/plot/{plot_id}", response_model=List[RecommendationResponse])
def get_recommendations_by_plot(
    plot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plot = db.query(Plot).join(Property).filter(Plot.id == plot_id, Property.owner_id == current_user.id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado.")
    return db.query(Recommendation).filter(Recommendation.plot_id == plot_id).all()
