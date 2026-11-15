from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.all_models import Property
from app.schemas.all_schemas import PropertyCreate, PropertyResponse
from app.adapters.ibge_adapter import IbgeAdapter

router = APIRouter(prefix="/properties", tags=["Propriedades"])

@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    prop_in: PropertyCreate,
    db: Session = Depends(get_db)
):
    ibge_code = prop_in.ibge_code
    if not ibge_code:
        # Tenta resolver automaticamente o código IBGE via API oficial
        ibge_info = await IbgeAdapter.fetch_municipality_info(prop_in.municipality, prop_in.state)
        if ibge_info:
            ibge_code = ibge_info.get("ibge_code")

    prop = Property(
        owner_id=None,
        name=prop_in.name,
        description=prop_in.description,
        total_area_ha=prop_in.total_area_ha,
        cultivated_area_ha=prop_in.cultivated_area_ha,
        country=prop_in.country,
        state=prop_in.state.upper(),
        municipality=prop_in.municipality,
        ibge_code=ibge_code,
        latitude=prop_in.latitude,
        longitude=prop_in.longitude,
        boundary_geojson=prop_in.boundary_geojson
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop

@router.get("", response_model=List[PropertyResponse])
def list_properties(
    db: Session = Depends(get_db)
):
    return db.query(Property).all()

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: int,
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada ou acesso não autorizado.")
    return prop

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: int,
    prop_in: PropertyCreate,
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")

    for field, value in prop_in.model_dump(exclude_unset=True).items():
        setattr(prop, field, value)

    db.commit()
    db.refresh(prop)
    return prop

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_property(
    property_id: int,
    db: Session = Depends(get_db)
):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada.")
    db.delete(prop)
    db.commit()
    return None
