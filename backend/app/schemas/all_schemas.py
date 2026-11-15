from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.all_models import UserRole, AgricultureType, DataStatus

# --- User & Auth ---
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: Optional[UserRole] = UserRole.FARMER

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    created_at: datetime

# --- Farmer Profile ---
class FarmerProfileBase(BaseModel):
    agriculture_type: Optional[AgricultureType] = AgricultureType.FAMILY
    experience_years: Optional[int] = None
    people_involved: Optional[int] = 1
    hired_workers: Optional[int] = 0
    labor_availability: Optional[str] = "baixa"
    internet_access: Optional[bool] = True
    equipment_access: Optional[str] = "manual"
    has_irrigation: Optional[bool] = False
    irrigation_type: Optional[str] = None
    technical_assistance: Optional[bool] = False
    rural_credit_access: Optional[bool] = False
    main_income_source: Optional[str] = "agricultura"
    household_income_declared: Optional[float] = None

class FarmerProfileCreate(FarmerProfileBase):
    pass

class FarmerProfileResponse(FarmerProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

# --- Property & Plots ---
class PropertyBase(BaseModel):
    name: str
    description: Optional[str] = None
    total_area_ha: float
    cultivated_area_ha: Optional[float] = None
    country: Optional[str] = "Brasil"
    state: str
    municipality: str
    ibge_code: Optional[str] = None
    latitude: float
    longitude: float
    boundary_geojson: Optional[Dict[str, Any]] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyResponse(PropertyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    owner_id: int
    created_at: datetime

class PlotBase(BaseModel):
    name: str
    area_ha: float
    boundary_geojson: Optional[Dict[str, Any]] = None
    soil_type: Optional[str] = None
    soil_texture: Optional[str] = None
    ph: Optional[float] = None
    organic_matter_pct: Optional[float] = None
    water_retention_capacity: Optional[str] = None
    drainage: Optional[str] = None
    slope_pct: Optional[float] = None
    current_crop: Optional[str] = None
    irrigation_system: Optional[str] = None

class PlotCreate(PlotBase):
    pass

class PlotResponse(PlotBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int

# --- Crop Catalog & History ---
class CropCatalogBase(BaseModel):
    common_name: str
    scientific_name: str
    category: str
    botanical_family: Optional[str] = None
    cycle_days: int
    water_requirement_mm: float
    drought_tolerance: str
    heat_tolerance: str
    nitrogen_fixation_potential: bool = False
    nitrogen_fixation_kg_ha: float = 0.0
    rooting_depth_cm: float
    erosion_protection: str
    organic_matter_contribution: str
    forage_potential: bool = False
    planting_seasons: Optional[List[str]] = None
    ideal_temp_min_c: Optional[float] = 18.0
    ideal_temp_max_c: Optional[float] = 32.0
    ideal_ph_min: Optional[float] = 5.5
    ideal_ph_max: Optional[float] = 6.8
    estimated_cost_per_ha_brl: Optional[float] = None
    market_liquidity: Optional[str] = "Media"
    management_complexity: Optional[str] = "Media"
    technical_source: Optional[str] = "Embrapa"

class CropCatalogResponse(CropCatalogBase):
    model_config = ConfigDict(from_attributes=True)
    id: int

class CropHistoryBase(BaseModel):
    crop_name: str
    planting_date: datetime
    harvest_date: Optional[datetime] = None
    season_name: Optional[str] = None
    productivity_kg_ha: Optional[float] = None
    water_consumption_estimated_mm: Optional[float] = None
    production_cost_brl: Optional[float] = None
    pest_or_disease_issues: Optional[str] = None
    notes: Optional[str] = None

class CropHistoryCreate(CropHistoryBase):
    pass

class CropHistoryResponse(CropHistoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    plot_id: int

# --- User Priority ---
class UserPriorityBase(BaseModel):
    weight_environmental: float = Field(default=40.0, ge=0.0, le=100.0)
    weight_social: float = Field(default=35.0, ge=0.0, le=100.0)
    weight_economic: float = Field(default=25.0, ge=0.0, le=100.0)
    
    priority_water_conservation: int = Field(default=5, ge=1, le=5)
    priority_soil_recovery: int = Field(default=5, ge=1, le=5)
    priority_income_increase: int = Field(default=4, ge=1, le=5)
    priority_cost_reduction: int = Field(default=4, ge=1, le=5)
    priority_food_security: int = Field(default=3, ge=1, le=5)
    priority_diversification: int = Field(default=4, ge=1, le=5)
    priority_risk_reduction: int = Field(default=5, ge=1, le=5)
    priority_easy_management: int = Field(default=3, ge=1, le=5)

class UserPriorityUpdate(UserPriorityBase):
    pass

class UserPriorityResponse(UserPriorityBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

# --- Environmental & Social Data ---
class EnvironmentalRecordCreate(BaseModel):
    property_id: int
    plot_id: Optional[int] = None
    observation_date: datetime
    temperature_mean_c: Optional[float] = None
    temperature_max_c: Optional[float] = None
    temperature_min_c: Optional[float] = None
    precipitation_mm: Optional[float] = None
    soil_moisture_m3_m3: Optional[float] = None
    soil_moisture_anomaly: Optional[float] = None
    evapotranspiration_mm: Optional[float] = None
    ndvi: Optional[float] = None
    solar_radiation_mj_m2: Optional[float] = None
    elevation_m: Optional[float] = None
    slope_deg: Optional[float] = None
    source_name: str
    product: Optional[str] = None
    data_status: Optional[DataStatus] = DataStatus.OBSERVED
    processing_method: Optional[str] = None
    spatial_resolution: str
    temporal_resolution: str
    is_measured: bool = False
    confidence_level: str = "Alta"
    raw_payload: Optional[Dict[str, Any]] = None

class EnvironmentalRecordResponse(EnvironmentalRecordCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int

class SocialIndicatorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    municipality_ibge_code: str
    municipality_name: str
    state: str
    reference_year: int
    population_total: Optional[int]
    population_rural_pct: Optional[float]
    idhm: Optional[float]
    idhm_education: Optional[float]
    idhm_income: Optional[float]
    idhm_longevity: Optional[float]
    poverty_rate_pct: Optional[float]
    agricultural_gdp_dependency_pct: Optional[float]
    family_farms_count: Optional[int]
    commercial_farms_count: Optional[int]
    rural_piped_water_access_pct: Optional[float]
    rural_internet_access_pct: Optional[float]
    source_name: str

# --- Recommendation & Diagnostic ---
class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    plot_id: int
    created_at: datetime
    strategy_type: str
    strategy_title: str
    strategy_description: str
    crop_sequence: List[str]
    duration_months: int
    score_environmental: float
    score_social: float
    score_economic: float
    score_overall: float
    confidence_level: str
    potential_benefits: List[str]
    risks: List[str]
    limitations: List[str]
    justification: str
    sources_cited: List[str]

class DiagnosticReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    plot_id: Optional[int]
    created_at: datetime
    land_needs: Dict[str, Any]
    farmer_needs: Dict[str, Any]
    region_offers: Dict[str, Any]
    synthesis: str
    active_alerts: Optional[List[Dict[str, Any]]]

class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    property_id: int
    plot_id: Optional[int]
    alert_type: str
    severity: str
    title: str
    description: str
    created_at: datetime
    evidence: Optional[Dict[str, Any]]
    confidence: str
    recommended_action: str
    source: str

# --- AI Assistant ---
class ChatMessageRequest(BaseModel):
    property_id: Optional[int] = None
    message: str

class ChatMessageResponse(BaseModel):
    reply: str
    context_sources: List[str]
    timestamp: datetime
