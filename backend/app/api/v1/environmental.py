from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import User, Property, Plot, EnvironmentalRecord, DataStatus
from app.schemas.all_schemas import EnvironmentalRecordResponse
from app.adapters.nasa_power import NasaPowerAdapter
from app.adapters.remote_sensing import RemoteSensingAdapter
from app.engine.environmental_engine import EnvironmentalAnalysisEngine

router = APIRouter(prefix="/environmental", tags=["Dados e Indicadores Ambientais"])

@router.post("/sync/{property_id}")
async def sync_environmental_data(
    property_id: int,
    days: int = Query(30, ge=7, le=180, description="Dias para sincronização retrospectiva"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Sincroniza dados ambientais reais da propriedade conectando com as APIs oficiais.
    NASA POWER: Agroclimatologia real diária.
    SRTM: Elevação real via Open-Elevation.
    Hargreaves: Modelo biofísico de evapotranspiração ET0 (marcado como ESTIMATED).
    Dados ausentes ou não configurados são gravados como UNAVAILABLE (sem invenção de dados).
    """
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == current_user.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")

    now = datetime.now(timezone.utc)
    end_date = datetime(now.year, now.month, now.day)
    start_date = end_date - timedelta(days=days)

    # 1. Obter dados meteorológicos NASA POWER (com retries e controle de falha)
    climate_records = await NasaPowerAdapter.fetch_climate_data(prop.latitude, prop.longitude, start_date, end_date)
    
    # 2. Obter topografia SRTM real
    topo = await RemoteSensingAdapter.get_srtm_topography(prop.latitude, prop.longitude)

    inserted_count = 0
    for item in climate_records:
        rec_date = item["date"]
        # Evitar duplicações
        existing = db.query(EnvironmentalRecord).filter(
            EnvironmentalRecord.property_id == property_id,
            EnvironmentalRecord.observation_date >= rec_date.replace(hour=0, minute=0, second=0),
            EnvironmentalRecord.observation_date <= rec_date.replace(hour=23, minute=59, second=59)
        ).first()

        if not existing:
            # Calcular ET0 via modelo biofísico validado
            et0_info = RemoteSensingAdapter.get_evapotranspiration_estimate(
                temperature_mean_c=item.get("temperature_mean_c"),
                temperature_max_c=item.get("temperature_max_c"),
                temperature_min_c=item.get("temperature_min_c"),
                solar_rad_mj=item.get("solar_radiation_mj_m2"),
                latitude=prop.latitude,
                date=rec_date
            )
            
            # Consultas honestas de SMAP e NDVI
            smap = await RemoteSensingAdapter.get_smap_soil_moisture(prop.latitude, prop.longitude, rec_date)
            ndvi_info = await RemoteSensingAdapter.get_landsat_modis_ndvi(prop.latitude, prop.longitude, rec_date)

            status_str = item.get("data_status", "OBSERVED")
            try:
                data_status_enum = DataStatus[status_str]
            except KeyError:
                data_status_enum = DataStatus.ESTIMATED

            new_record = EnvironmentalRecord(
                property_id=property_id,
                observation_date=rec_date,
                temperature_mean_c=item.get("temperature_mean_c"),
                temperature_max_c=item.get("temperature_max_c"),
                temperature_min_c=item.get("temperature_min_c"),
                precipitation_mm=item.get("precipitation_mm"),
                solar_radiation_mj_m2=item.get("solar_radiation_mj_m2"),
                soil_moisture_m3_m3=smap.get("soil_moisture_m3_m3"),
                soil_moisture_anomaly=smap.get("soil_moisture_anomaly"),
                ndvi=ndvi_info.get("ndvi"),
                evapotranspiration_mm=et0_info.get("evapotranspiration_mm"),
                elevation_m=topo.get("elevation_m"),
                slope_deg=topo.get("slope_deg"),
                source_name=item.get("source_name", "NASA POWER"),
                product=item.get("product"),
                data_status=data_status_enum,
                processing_method=item.get("processing_method"),
                spatial_resolution=item.get("spatial_resolution", "0.5 graus"),
                temporal_resolution=item.get("temporal_resolution", "Daily"),
                is_measured=item.get("is_measured", False),
                confidence_level=item.get("confidence_level", "Alta"),
                raw_payload=item.get("raw_payload")
            )
            db.add(new_record)
            inserted_count += 1

    db.commit()
    return {
        "message": f"Sincronização concluída com sucesso. {inserted_count} novos registros ambientais integrados.",
        "property_id": property_id,
        "days_synced": days,
        "sources": [
            "NASA POWER (Agroclimatology API)",
            "NASA SRTM (30m Topografia via Open-Elevation)",
            "FAO-56 Hargreaves-Samani (Evapotranspiração de Referência ET0)",
            "NASA SMAP / Earthdata (Status transparente)"
        ]
    }

@router.get("/timeseries/{property_id}")
def get_property_environmental_timeseries(
    property_id: int,
    days: int = Query(30, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == current_user.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")

    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    records = db.query(EnvironmentalRecord).filter(
        EnvironmentalRecord.property_id == property_id,
        EnvironmentalRecord.observation_date >= start_date
    ).order_by(EnvironmentalRecord.observation_date.asc()).all()

    analysis = EnvironmentalAnalysisEngine.analyze_environmental_conditions(records)
    
    return {
        "property_id": property_id,
        "summary": analysis,
        "records_count": len(records),
        "timeline": [
            {
                "date": r.observation_date.strftime("%Y-%m-%d"),
                "temp_mean": r.temperature_mean_c,
                "temp_max": r.temperature_max_c,
                "precipitation": r.precipitation_mm,
                "soil_moisture": r.soil_moisture_m3_m3,
                "ndvi": r.ndvi,
                "evapotranspiration": r.evapotranspiration_mm,
                "data_status": (
                    r.data_status.value if hasattr(r.data_status, "value")
                    else str(r.data_status) if r.data_status is not None
                    else None
                ),
                "confidence_level": r.confidence_level
            }
            for r in records
        ]
    }
