from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List, Optional
import os
import secrets

class Settings(BaseSettings):
    PROJECT_NAME: str = "TerraViva Backend"
    VERSION: str = "1.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Segurança
    # Em produção, SECRET_KEY deve vir obrigatoriamente de variável de ambiente
    SECRET_KEY: str = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 horas (mais seguro que 7 dias)
    
    # Banco de Dados
    DATABASE_URL: str = "sqlite:///./terraviva.db"
    
    # CORS (específico por padrão)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ]
    
    # APIs Externas
    GEMINI_API_KEY: Optional[str] = None
    NASA_EARTHDATA_TOKEN: Optional[str] = None
    IBGE_API_BASE_URL: str = "https://servicodados.ibge.gov.br/api/v1"
    IBGE_AGREGADOS_BASE_URL: str = "https://servicodados.ibge.gov.br/api/v3/agregados"
    INMET_API_BASE_URL: str = "https://apitempo.inmet.gov.br"
    NASA_POWER_BASE_URL: str = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    model_config = ConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
