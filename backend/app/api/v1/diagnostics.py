from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
from app.core.database import get_db
from app.models.all_models import (
    User, Property, Plot, FarmerProfile, EnvironmentalRecord, SocialIndicatorRecord, DiagnosticReport, Alert
)
from app.schemas.all_schemas import DiagnosticReportResponse, AlertResponse
from app.engine.environmental_engine import EnvironmentalAnalysisEngine
from app.engine.social_engine import SocialAnalysisEngine

router = APIRouter(prefix="/diagnostics", tags=["Diagnóstico Socioambiental Holístico"])

@router.get("/property/{property_id}", response_model=DiagnosticReportResponse)
def get_property_holistic_diagnostic(
    property_id: int,
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")

    profile = None
    
    # 1. Dados Ambientais
    env_records = db.query(EnvironmentalRecord).filter(
        EnvironmentalRecord.property_id == property_id
    ).order_by(EnvironmentalRecord.observation_date.desc()).limit(60).all()
    env_analysis = EnvironmentalAnalysisEngine.analyze_environmental_conditions(env_records)

    # 2. Dados Sociais
    social_rec = db.query(SocialIndicatorRecord).filter(
        SocialIndicatorRecord.municipality_ibge_code == (prop.ibge_code or "")
    ).first()
    if not social_rec:
        social_rec = db.query(SocialIndicatorRecord).filter(SocialIndicatorRecord.state == prop.state).first()
    soc_analysis = SocialAnalysisEngine.analyze_social_context(profile, social_rec)

    # 3. Construir as três dimensões centrais da Filosofia TerraViva:
    # A) O que a terra precisa?
    land_needs = {
        "water_conservation": "Crítica" if env_analysis.get("drought_risk") == "ALTO" else "Adequada",
        "soil_recovery": "Necessária incorporação de matéria orgânica e palhada viva contra insolação tropical.",
        "erosion_protection": env_analysis.get("erosion_description", "Controle de escoamento superficial"),
        "vegetation_cover": "Ampliar período com cobertura de solo (NDVI > 0.40) para evitar desidratação da microfauna."
    }

    # B) O que o agricultor precisa?
    farmer_needs = {
        "labor_demand": "Culturas com baixa complexidade de manejo manual" if profile and profile.labor_availability == "baixa" else "Compatível com capacidade operacional",
        "financial_shield": "Redução do custo inicial de aquisição de insumos químicos",
        "technical_support": "Instruções passo a passo agronômicas validadas pela Embrapa",
        "income_security": "Diversificação com espécies de colheita escalonada e dupla aptidão (grãos + forragem animal)"
    }

    # C) O que a região oferece?
    climate_values = []
    temperature_max_mean = env_analysis.get("temperature_max_mean_c")
    precipitation_total = env_analysis.get("precipitation_total_mm")
    if temperature_max_mean is not None:
        climate_values.append(f"Temperatura máxima média: {temperature_max_mean}°C")
    if precipitation_total is not None:
        climate_values.append(f"Precipitação: {precipitation_total} mm")
    climate_regime = " | ".join(climate_values) if climate_values else "Dados climáticos indisponíveis."

    region_offers = {
        "climate_regime": climate_regime,
        "institutional_context": soc_analysis.get("regional_context", {}),
        "natural_potential": "Elevada disponibilidade de radiação solar para rápida fotossíntese de gramíneas C4 e leguminosas tropicais."
    }

    synthesis = (
        f"Diagnóstico para a propriedade '{prop.name}' em {prop.municipality}/{prop.state}: "
        f"A terra apresenta risco de seca {env_analysis.get('drought_risk', 'MODERADO')}. "
        f"O contexto social indica perfil de agricultura {soc_analysis.get('agriculture_type', 'Familiar')}. "
        f"A estratégia ideal deve balancear a preservação de umidade no solo sem onerar o orçamento familiar."
    )

    # Alertas ativos
    alerts = db.query(Alert).filter(Alert.property_id == property_id).order_by(Alert.created_at.desc()).limit(5).all()
    active_alerts_list = [
        {"type": a.alert_type, "severity": a.severity, "title": a.title, "description": a.description}
        for a in alerts
    ]

    report = DiagnosticReport(
        property_id=property_id,
        land_needs=land_needs,
        farmer_needs=farmer_needs,
        region_offers=region_offers,
        synthesis=synthesis,
        active_alerts=active_alerts_list
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report

@router.get("/alerts/{property_id}", response_model=List[AlertResponse])
def get_property_alerts(
    property_id: int,
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")
    return db.query(Alert).filter(Alert.property_id == property_id).order_by(Alert.created_at.desc()).all()
