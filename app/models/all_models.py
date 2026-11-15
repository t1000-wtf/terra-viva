import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class DataStatus(str, enum.Enum):
    OBSERVED = "OBSERVED"
    ESTIMATED = "ESTIMATED"
    SIMULATED = "SIMULATED"
    UNAVAILABLE = "UNAVAILABLE"

class UserRole(str, enum.Enum):
    FARMER = "agricultor"
    TECHNICIAN = "tecnico_agricola"
    ADMIN = "administrador"

class AgricultureType(str, enum.Enum):
    FAMILY = "familiar"
    COMMERCIAL = "empresarial"
    MIXED = "mista"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.FARMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    priorities = relationship("UserPriority", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assistant_chats = relationship("AssistantChat", back_populates="user", cascade="all, delete-orphan")

class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    agriculture_type = Column(Enum(AgricultureType), default=AgricultureType.FAMILY)
    experience_years = Column(Integer, nullable=True)
    people_involved = Column(Integer, default=1)
    hired_workers = Column(Integer, default=0)
    labor_availability = Column(String(50), default="baixa") # baixa, media, alta
    internet_access = Column(Boolean, default=True)
    equipment_access = Column(String(100), nullable=True) # manual, trator_proprio, terceirizado
    has_irrigation = Column(Boolean, default=False)
    irrigation_type = Column(String(100), nullable=True) # gotejamento, aspersao, inundacao
    technical_assistance = Column(Boolean, default=False)
    rural_credit_access = Column(Boolean, default=False)
    main_income_source = Column(String(100), default="agricultura")
    household_income_declared = Column(Float, nullable=True) # opcional / voluntario
    
    user = relationship("User", back_populates="farmer_profile")

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    total_area_ha = Column(Float, nullable=False)
    cultivated_area_ha = Column(Float, nullable=True)
    country = Column(String(100), default="Brasil")
    state = Column(String(50), nullable=False) # Ex: "SP", "BA", "MT"
    municipality = Column(String(150), nullable=False)
    ibge_code = Column(String(20), nullable=True) # Código do IBGE para relacionar dados sociais
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True) # Polígono GeoJSON
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner = relationship("User", back_populates="properties")
    plots = relationship("Plot", back_populates="property", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="property", cascade="all, delete-orphan")

class Plot(Base):
    __tablename__ = "plots"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    name = Column(String(150), nullable=False)
    area_ha = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True)
    
    # Solo e topografia
    soil_type = Column(String(100), nullable=True) # Latossolo, Argissolo, Neossolo...
    soil_texture = Column(String(100), nullable=True) # arenosa, argilosa, media
    ph = Column(Float, nullable=True)
    organic_matter_pct = Column(Float, nullable=True)
    water_retention_capacity = Column(String(50), nullable=True) # baixa, media, alta
    drainage = Column(String(50), nullable=True) # boa, moderada, deficiente
    slope_pct = Column(Float, nullable=True) # inclinação %
    
    current_crop = Column(String(150), nullable=True)
    irrigation_system = Column(String(100), nullable=True)
    
    property = relationship("Property", back_populates="plots")
    crop_histories = relationship("CropHistory", back_populates="plot", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="plot", cascade="all, delete-orphan")

class CropCatalog(Base):
    __tablename__ = "crop_catalog"
    
    id = Column(Integer, primary_key=True, index=True)
    common_name = Column(String(150), unique=True, index=True, nullable=False)
    scientific_name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False) # Graos, Leguminosas, Forrageiras, Adubos Verdes
    botanical_family = Column(String(100), nullable=True) # Poaceae (Gramineae), Fabaceae (Leguminosae), Asteraceae, etc.
    cycle_days = Column(Integer, nullable=False) # ciclo médio em dias
    water_requirement_mm = Column(Float, nullable=False) # Necessidade hídrica total (mm)
    drought_tolerance = Column(String(50), nullable=False) # Alta, Media, Baixa
    heat_tolerance = Column(String(50), nullable=False) # Alta, Media, Baixa
    nitrogen_fixation_potential = Column(Boolean, default=False)
    nitrogen_fixation_kg_ha = Column(Float, default=0.0) # Fixação Biológica de N (kg/ha)
    rooting_depth_cm = Column(Float, nullable=False)
    erosion_protection = Column(String(50), nullable=False) # Alta, Media, Baixa
    organic_matter_contribution = Column(String(50), nullable=False) # Alta, Media, Baixa
    forage_potential = Column(Boolean, default=False)
    planting_seasons = Column(JSON, nullable=True) # Ex: ["Outubro", "Novembro", "Fevereiro"]
    ideal_temp_min_c = Column(Float, default=18.0)
    ideal_temp_max_c = Column(Float, default=32.0)
    ideal_ph_min = Column(Float, default=5.5)
    ideal_ph_max = Column(Float, default=6.8)
    estimated_cost_per_ha_brl = Column(Float, nullable=True) # Custo médio de implantação/safra
    market_liquidity = Column(String(50), default="Media") # Alta, Media, Baixa
    management_complexity = Column(String(50), default="Media") # Baixa, Media, Alta
    technical_source = Column(String(255), default="Embrapa / Catálogo Agronômico Nacional")

class CropHistory(Base):
    __tablename__ = "crop_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    crop_name = Column(String(150), nullable=False)
    planting_date = Column(DateTime, nullable=False)
    harvest_date = Column(DateTime, nullable=True)
    season_name = Column(String(50), nullable=True) # Ex: Safra 2024/2025, Safrinha 2025
    productivity_kg_ha = Column(Float, nullable=True)
    water_consumption_estimated_mm = Column(Float, nullable=True)
    production_cost_brl = Column(Float, nullable=True)
    pest_or_disease_issues = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    
    plot = relationship("Plot", back_populates="crop_histories")

class UserPriority(Base):
    __tablename__ = "user_priorities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Pesos do algoritmo multicritério (soma = 100)
    weight_environmental = Column(Float, default=40.0)
    weight_social = Column(Float, default=35.0)
    weight_economic = Column(Float, default=25.0)
    
    # Sub-prioridades do agricultor
    priority_water_conservation = Column(Integer, default=5) # 1 a 5
    priority_soil_recovery = Column(Integer, default=5)
    priority_income_increase = Column(Integer, default=4)
    priority_cost_reduction = Column(Integer, default=4)
    priority_food_security = Column(Integer, default=3)
    priority_diversification = Column(Integer, default=4)
    priority_risk_reduction = Column(Integer, default=5)
    priority_easy_management = Column(Integer, default=3)
    
    user = relationship("User", back_populates="priorities")

class EnvironmentalRecord(Base):
    __tablename__ = "environmental_records"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=True)
    observation_date = Column(DateTime, nullable=False, index=True)
    
    # Variáveis
    temperature_mean_c = Column(Float, nullable=True)
    temperature_max_c = Column(Float, nullable=True)
    temperature_min_c = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    soil_moisture_m3_m3 = Column(Float, nullable=True) # SMAP superficial (0-5cm)
    soil_moisture_anomaly = Column(Float, nullable=True) # Anomalia vs normal histórica
    evapotranspiration_mm = Column(Float, nullable=True)
    ndvi = Column(Float, nullable=True) # Normalized Difference Vegetation Index (-1 a +1)
    solar_radiation_mj_m2 = Column(Float, nullable=True)
    elevation_m = Column(Float, nullable=True)
    slope_deg = Column(Float, nullable=True)
    
    # Metadados científicos (Proveniência e Confiabilidade)
    source_name = Column(String(100), nullable=False) # Ex: "NASA POWER", "NASA SMAP", "Open-Elevation SRTM"
    product = Column(String(150), nullable=True) # Nome exato do produto/satélite
    data_status = Column(Enum(DataStatus), default=DataStatus.OBSERVED, nullable=False) # OBSERVED, ESTIMATED, SIMULATED, UNAVAILABLE
    processing_method = Column(String(255), nullable=True) # Método de processamento ou algoritmo aplicado
    spatial_resolution = Column(String(50), nullable=False) # Ex: "0.5 deg", "9 km", "30 m"
    temporal_resolution = Column(String(50), nullable=False) # Ex: "Daily", "Monthly", "Static"
    is_measured = Column(Boolean, default=False) # True = estação in-situ, False = satélite/reanálise/modelo
    confidence_level = Column(String(50), default="Alta") # Alta, Media, Baixa, Nenhuma
    raw_payload = Column(JSON, nullable=True)

class SocialIndicatorRecord(Base):
    __tablename__ = "social_indicators"
    
    id = Column(Integer, primary_key=True, index=True)
    municipality_ibge_code = Column(String(20), index=True, nullable=False)
    municipality_name = Column(String(150), nullable=False)
    state = Column(String(50), nullable=False)
    reference_year = Column(Integer, nullable=False)
    
    population_total = Column(Integer, nullable=True)
    population_rural_pct = Column(Float, nullable=True)
    idhm = Column(Float, nullable=True) # Índice de Desenvolvimento Humano Municipal
    idhm_education = Column(Float, nullable=True)
    idhm_income = Column(Float, nullable=True)
    idhm_longevity = Column(Float, nullable=True)
    poverty_rate_pct = Column(Float, nullable=True)
    agricultural_gdp_dependency_pct = Column(Float, nullable=True)
    family_farms_count = Column(Integer, nullable=True)
    commercial_farms_count = Column(Integer, nullable=True)
    rural_piped_water_access_pct = Column(Float, nullable=True)
    rural_internet_access_pct = Column(Float, nullable=True)
    
    source_name = Column(String(100), default="IBGE / Atlas Brasil")
    methodology = Column(String(255), nullable=True)

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    strategy_type = Column(String(50), nullable=False) # "current", "sustainable", "resilient"
    strategy_title = Column(String(200), nullable=False)
    strategy_description = Column(Text, nullable=False)
    crop_sequence = Column(JSON, nullable=False) # Lista de culturas recomendadas
    duration_months = Column(Integer, default=12)
    
    score_environmental = Column(Float, nullable=False) # 0-100
    score_social = Column(Float, nullable=False) # 0-100
    score_economic = Column(Float, nullable=False) # 0-100
    score_overall = Column(Float, nullable=False) # 0-100 ponderada
    confidence_level = Column(String(50), default="Media") # Alta, Media, Baixa
    
    potential_benefits = Column(JSON, nullable=False)
    risks = Column(JSON, nullable=False)
    limitations = Column(JSON, nullable=False)
    justification = Column(Text, nullable=False)
    sources_cited = Column(JSON, nullable=False)
    
    property = relationship("Property", back_populates="recommendations")
    plot = relationship("Plot", back_populates="recommendations")

class DiagnosticReport(Base):
    __tablename__ = "diagnostic_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    land_needs = Column(JSON, nullable=False) # "O que a terra precisa"
    farmer_needs = Column(JSON, nullable=False) # "O que o agricultor precisa"
    region_offers = Column(JSON, nullable=False) # "O que a região oferece"
    synthesis = Column(Text, nullable=False)
    active_alerts = Column(JSON, nullable=True)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    plot_id = Column(Integer, ForeignKey("plots.id"), nullable=True)
    alert_type = Column(String(100), nullable=False) # Ex: "SECA_CRITICA", "ESTRESSE_TERMICO", "SOLO_DESCOBERTO"
    severity = Column(String(50), default="media") # baixa, media, alta, critica
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    evidence = Column(JSON, nullable=True)
    confidence = Column(String(50), default="Media")
    recommended_action = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)

class AssistantChat(Base):
    __tablename__ = "assistant_chats"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=True)
    role = Column(String(50), nullable=False) # "user", "assistant"
    message = Column(Text, nullable=False)
    context_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="assistant_chats")
