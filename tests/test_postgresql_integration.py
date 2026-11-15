import os

import pytest
import sqlalchemy as sa
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import _normalize_database_url
from app.models.all_models import Base


TEST_POSTGRESQL_URL = os.getenv("TEST_POSTGRESQL_URL")
pytestmark = pytest.mark.skipif(
    not TEST_POSTGRESQL_URL,
    reason="Defina TEST_POSTGRESQL_URL para validar PostgreSQL sem escrita."
)


def test_postgresql_connection_and_schema_are_readable():
    database_url = _normalize_database_url(TEST_POSTGRESQL_URL or "")
    assert database_url.startswith("postgresql+psycopg://")
    engine = create_engine(
        database_url,
        connect_args={"connect_timeout": 10},
        pool_pre_ping=True
    )

    try:
        with engine.connect() as connection:
            with connection.begin():
                connection.execute(text("SET TRANSACTION READ ONLY"))
                assert connection.execute(text("SELECT 1")).scalar_one() == 1
                inspector = sa.inspect(connection)
                existing_tables = set(inspector.get_table_names())
                missing_tables = sorted(set(Base.metadata.tables) - existing_tables)
                missing_columns = {}
                incompatible_columns = {}
                missing_foreign_keys = {}
                for table_name in sorted(set(Base.metadata.tables) & existing_tables):
                    actual_columns = {
                        column["name"]: column
                        for column in inspector.get_columns(table_name)
                    }
                    expected_table = Base.metadata.tables[table_name]
                    expected_columns = {column.name for column in expected_table.columns}
                    missing = sorted(expected_columns - set(actual_columns))
                    if missing:
                        missing_columns[table_name] = missing
                    incompatible = []
                    for column in expected_table.columns:
                        actual = actual_columns.get(column.name)
                        if actual is None:
                            continue
                        if actual["nullable"] != column.nullable:
                            incompatible.append(f"{column.name}:nullability")
                        if (
                            actual["type"]._type_affinity
                            is not column.type._type_affinity
                        ):
                            incompatible.append(f"{column.name}:type")
                    if incompatible:
                        incompatible_columns[table_name] = incompatible

                    expected_fks = {
                        (foreign_key.parent.name, foreign_key.column.table.name, foreign_key.column.name)
                        for column in expected_table.columns
                        for foreign_key in column.foreign_keys
                    }
                    actual_fks = {
                        (source_column, target_table, target_column)
                        for foreign_key in inspector.get_foreign_keys(table_name)
                        for source_column, target_column in zip(
                            foreign_key["constrained_columns"],
                            foreign_key["referred_columns"]
                        )
                        for target_table in [foreign_key["referred_table"]]
                    }
                    missing_fks = sorted(expected_fks - actual_fks)
                    if missing_fks:
                        missing_foreign_keys[table_name] = missing_fks
                assert not missing_tables, f"Missing PostgreSQL tables: {missing_tables}"
                assert not missing_columns, f"Missing PostgreSQL columns: {missing_columns}"
                assert not incompatible_columns, (
                    f"Incompatible PostgreSQL columns: {incompatible_columns}"
                )
                assert not missing_foreign_keys, (
                    f"Missing PostgreSQL foreign keys: {missing_foreign_keys}"
                )
    except SQLAlchemyError as error:
        pytest.fail(
            f"PostgreSQL connection or schema check failed ({type(error).__name__}).",
            pytrace=False
        )
    finally:
        engine.dispose()
