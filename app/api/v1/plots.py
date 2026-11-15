from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.all_models import User, Property, Plot
from app.schemas.all_schemas import PlotCreate, PlotResponse

router = APIRouter(prefix="/properties/{property_id}/plots", tags=["Talhões"])

def verify_property_owner(property_id: int, user: User, db: Session) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user.id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Propriedade não encontrada ou acesso não autorizado.")
    return prop

@router.post("", response_model=PlotResponse, status_code=status.HTTP_201_CREATED)
def create_plot(
    property_id: int,
    plot_in: PlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_property_owner(property_id, current_user, db)
    plot = Plot(
        property_id=property_id,
        name=plot_in.name,
        area_ha=plot_in.area_ha,
        boundary_geojson=plot_in.boundary_geojson,
        soil_type=plot_in.soil_type,
        soil_texture=plot_in.soil_texture,
        ph=plot_in.ph,
        organic_matter_pct=plot_in.organic_matter_pct,
        water_retention_capacity=plot_in.water_retention_capacity,
        drainage=plot_in.drainage,
        slope_pct=plot_in.slope_pct,
        current_crop=plot_in.current_crop,
        irrigation_system=plot_in.irrigation_system
    )
    db.add(plot)
    db.commit()
    db.refresh(plot)
    return plot

@router.get("", response_model=List[PlotResponse])
def list_plots(
    property_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_property_owner(property_id, current_user, db)
    return db.query(Plot).filter(Plot.property_id == property_id).all()

@router.get("/{plot_id}", response_model=PlotResponse)
def get_plot(
    property_id: int,
    plot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_property_owner(property_id, current_user, db)
    plot = db.query(Plot).filter(Plot.id == plot_id, Plot.property_id == property_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado.")
    return plot

@router.put("/{plot_id}", response_model=PlotResponse)
def update_plot(
    property_id: int,
    plot_id: int,
    plot_in: PlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_property_owner(property_id, current_user, db)
    plot = db.query(Plot).filter(Plot.id == plot_id, Plot.property_id == property_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado.")
    
    for field, value in plot_in.model_dump(exclude_unset=True).items():
        setattr(plot, field, value)

    db.commit()
    db.refresh(plot)
    return plot

@router.delete("/{plot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plot(
    property_id: int,
    plot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    verify_property_owner(property_id, current_user, db)
    plot = db.query(Plot).filter(Plot.id == plot_id, Plot.property_id == property_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="Talhão não encontrado.")
    db.delete(plot)
    db.commit()
    return None
