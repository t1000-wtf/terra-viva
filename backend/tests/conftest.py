import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.core.database import Base, SessionLocal, engine
import app.models.all_models
from app.seeds.seed_data import seed_database

Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_database(db)
