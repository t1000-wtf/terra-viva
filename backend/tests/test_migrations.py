from pathlib import Path

import sqlalchemy as sa
from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.autogenerate import compare_metadata
from sqlalchemy import create_engine, text

from app.core.database import Base
import app.models.all_models


PROJECT_ROOT = Path(__file__).resolve().parents[1]
BASELINE_REVISION = "d3023bc0994e"


def _migration_config(database_url: str) -> Config:
    config = Config(str(PROJECT_ROOT / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return config


def test_fresh_database_migrates_to_current_schema(tmp_path):
    database_path = tmp_path / "fresh.sqlite"
    database_url = f"sqlite:///{database_path.as_posix()}"
    config = _migration_config(database_url)

    command.upgrade(config, "head")

    engine = create_engine(database_url)
    inspector = sa.inspect(engine)
    assert set(inspector.get_table_names()) >= {
        "users", "properties", "plots", "crop_catalog",
        "environmental_records", "alembic_version"
    }
    assert {
        column["name"]
        for column in inspector.get_columns("crop_catalog")
    } >= {"botanical_family"}
    assert {
        column["name"]
        for column in inspector.get_columns("environmental_records")
    } >= {"product", "data_status", "processing_method"}
    with engine.connect() as connection:
        assert connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one() == "57f8a7c3d12e"
        differences = compare_metadata(
            MigrationContext.configure(connection),
            Base.metadata
        )
    assert differences == []
    engine.dispose()


def test_legacy_schema_upgrade_preserves_rows_and_unknown_provenance(tmp_path):
    database_path = tmp_path / "legacy.sqlite"
    database_url = f"sqlite:///{database_path.as_posix()}"
    config = _migration_config(database_url)

    command.upgrade(config, BASELINE_REVISION)

    engine = create_engine(database_url)
    with engine.begin() as connection:
        connection.execute(
            text("ALTER TABLE crop_catalog ADD COLUMN botanical_family VARCHAR(100)")
        )
        connection.execute(
            text(
                "INSERT INTO social_indicators "
                "(municipality_ibge_code, municipality_name, state, reference_year) "
                "VALUES ('1234567', 'Municipio de teste', 'MG', 2020)"
            )
        )
        connection.execute(
            text(
                "INSERT INTO environmental_records "
                "(property_id, observation_date, temperature_mean_c, source_name, "
                "spatial_resolution, temporal_resolution) "
                "VALUES (1, '2025-01-01 00:00:00', 22.5, 'NASA POWER', '0.5 degrees', 'Daily')"
            )
        )

    command.upgrade(config, "head")

    with engine.connect() as connection:
        social_row = connection.execute(
            text(
                "SELECT municipality_ibge_code, municipality_name, reference_year "
                "FROM social_indicators"
            )
        ).one()
        climate_row = connection.execute(
            text(
                "SELECT temperature_mean_c, data_status, product, processing_method "
                "FROM environmental_records"
            )
        ).one()
        assert tuple(social_row) == ("1234567", "Municipio de teste", 2020)
        assert tuple(climate_row) == (22.5, None, None, None)
        assert connection.execute(
            text("SELECT COUNT(*) FROM crop_catalog")
        ).scalar_one() == 0
    engine.dispose()
