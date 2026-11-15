import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import (
    auth, users, properties, plots, crops, history, priorities,
    environmental, social, economic, recommendations, diagnostics,
    assistant, sources, dashboard
)
from app.seeds.seed_data import seed_database
from app.core.database import SessionLocal

logger = logging.getLogger("terraviva")

# Aplique as migrações Alembic antes de iniciar a aplicação.
try:
    with SessionLocal() as db:
        seed_database(db)
except Exception:
    logger.exception("Falha ao carregar o catálogo e os dados de referência iniciais.")
    raise

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Plataforma de Inteligência Socioambiental e Agrícola TerraViva - API Oficial",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar Rotas da API v1
api_v1_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_v1_prefix)
app.include_router(users.router, prefix=api_v1_prefix)
app.include_router(properties.router, prefix=api_v1_prefix)
app.include_router(plots.router, prefix=api_v1_prefix)
app.include_router(crops.router, prefix=api_v1_prefix)
app.include_router(history.router, prefix=api_v1_prefix)
app.include_router(priorities.router, prefix=api_v1_prefix)
app.include_router(environmental.router, prefix=api_v1_prefix)
app.include_router(social.router, prefix=api_v1_prefix)
app.include_router(economic.router, prefix=api_v1_prefix)
app.include_router(recommendations.router, prefix=api_v1_prefix)
app.include_router(diagnostics.router, prefix=api_v1_prefix)
app.include_router(assistant.router, prefix=api_v1_prefix)
app.include_router(sources.router, prefix=api_v1_prefix)
app.include_router(dashboard.router, prefix=api_v1_prefix)

@app.get("/")
def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
