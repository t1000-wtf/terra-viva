from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import User, Property, Plot, Recommendation, Alert, EnvironmentalRecord
from app.engine.environmental_engine import EnvironmentalAnalysisEngine

router = APIRouter(prefix="/dashboard", tags=["Dashboard Integrado Web e Mobile"])

@router.get("/summary/{property_id}")
def get_dashboard_summary(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retorna DTO otimizado com todas as informações essenciais para renderização de telas Web/Mobile:
    - Resumo da Propriedade e Talhões
    - Indicadores Ambientais Recentes (NDVI, Chuva, Umidade SMAP)
    - Alertas Ativos
    - Recomendações mais recentes
    """
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == current_user.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")

    plots = db.query(Plot).filter(Plot.property_id == property_id).all()
    
    # Séries ambientais recentes
    env_records = db.query(EnvironmentalRecord).filter(
        EnvironmentalRecord.property_id == property_id
    ).order_by(EnvironmentalRecord.observation_date.desc()).limit(30).all()
    
    env_summary = EnvironmentalAnalysisEngine.analyze_environmental_conditions(env_records)

    # Alertas
    alerts = db.query(Alert).filter(Alert.property_id == property_id).order_by(Alert.created_at.desc()).limit(5).all()

    # Recomendações
    recommendations = db.query(Recommendation).filter(Recommendation.property_id == property_id).all()

    return {
        "property": {
            "id": prop.id,
            "name": prop.name,
            "municipality": prop.municipality,
            "state": prop.state,
            "total_area_ha": prop.total_area_ha,
            "latitude": prop.latitude,
            "longitude": prop.longitude,
            "plots_count": len(plots)
        },
        "plots": [
            {
                "id": p.id,
                "name": p.name,
                "area_ha": p.area_ha,
                "current_crop": p.current_crop,
                "soil_type": p.soil_type
            }
            for p in plots
        ],
        "environmental_kpis": {
            "drought_risk": env_summary.get("drought_risk", "MODERADO"),
            "soil_moisture_m3_m3": env_summary.get("soil_moisture_mean_m3_m3", 0.22),
            "precipitation_total_mm": env_summary.get("precipitation_total_mm", 0.0),
            "ndvi_mean": env_summary.get("ndvi_mean", 0.40),
            "erosion_risk": env_summary.get("erosion_risk", "BAIXO")
        },
        "active_alerts_count": len(alerts),
        "alerts": [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "recommended_action": a.recommended_action
            }
            for a in alerts
        ],
        "recommendations_summary": [
            {
                "id": r.id,
                "plot_id": r.plot_id,
                "strategy_type": r.strategy_type,
                "title": r.strategy_title,
                "crop_sequence": r.crop_sequence,
                "score_overall": r.score_overall
            }
            for r in recommendations
        ]
    }
