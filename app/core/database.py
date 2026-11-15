from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


def _normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def _is_postgresql_url(database_url: str) -> bool:
    return database_url.startswith("postgresql+psycopg://")


database_url = _normalize_database_url(settings.DATABASE_URL)
if database_url.startswith("sqlite:"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )
elif _is_postgresql_url(database_url):
    engine = create_engine(
        database_url,
        connect_args={"connect_timeout": 10},
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        pool_recycle=1800
    )
else:
    engine = create_engine(database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
