from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "TerraViva Backend"
    VERSION: str = "1.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Banco de Dados
    DATABASE_URL: str = "sqlite:///./terraviva.db"
    
    # CORS (específico por padrão)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8000"
    ]
    
    # APIs Externas
    NASA_EARTHDATA_TOKEN: Optional[str] = None
    IBGE_API_BASE_URL: str = "https://servicodados.ibge.gov.br/api/v1"
    IBGE_AGREGADOS_BASE_URL: str = "https://servicodados.ibge.gov.br/api/v3/agregados"
    INMET_API_BASE_URL: str = "https://apitempo.inmet.gov.br"
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    model_config = ConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
