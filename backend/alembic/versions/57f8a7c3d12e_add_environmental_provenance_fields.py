"""Add model fields absent from the legacy SQLite schema.

Revision ID: 57f8a7c3d12e
Revises: d3023bc0994e
"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "57f8a7c3d12e"
down_revision: Union[str, None] = "d3023bc0994e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    offline = context.is_offline_mode()

    if offline:
        op.add_column(
            "crop_catalog",
            sa.Column("botanical_family", sa.String(length=100), nullable=True)
        )
        op.add_column(
            "environmental_records",
            sa.Column("product", sa.String(length=150), nullable=True)
        )
        status_type = sa.Enum(
            "OBSERVED", "ESTIMATED", "SIMULATED", "UNAVAILABLE",
            name="datastatus"
        )
        if bind.dialect.name == "postgresql":
            status_type.create(bind, checkfirst=False)
        op.add_column(
            "environmental_records",
            sa.Column("data_status", status_type, nullable=True)
        )
        op.add_column(
            "environmental_records",
            sa.Column("processing_method", sa.String(length=255), nullable=True)
        )
        return

    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "crop_catalog" in tables:
        columns = {column["name"] for column in inspector.get_columns("crop_catalog")}
        if "botanical_family" not in columns:
            op.add_column(
                "crop_catalog",
                sa.Column("botanical_family", sa.String(length=100), nullable=True)
            )

    if "environmental_records" in tables:
        columns = {
            column["name"]
            for column in inspector.get_columns("environmental_records")
        }
        if "product" not in columns:
            op.add_column(
                "environmental_records",
                sa.Column("product", sa.String(length=150), nullable=True)
            )
        if "data_status" not in columns:
            status_type = sa.Enum(
                "OBSERVED", "ESTIMATED", "SIMULATED", "UNAVAILABLE",
                name="datastatus"
            )
            if bind.dialect.name == "postgresql":
                status_type.create(bind, checkfirst=True)
            op.add_column(
                "environmental_records",
                sa.Column("data_status", status_type, nullable=True)
            )
        if "processing_method" not in columns:
            op.add_column(
                "environmental_records",
                sa.Column("processing_method", sa.String(length=255), nullable=True)
            )


def downgrade() -> None:
    raise RuntimeError(
        "Esta revisão pode armazenar novos valores de proveniência. "
        "Remover as colunas causaria perda de dados; restaure um backup validado."
    )
