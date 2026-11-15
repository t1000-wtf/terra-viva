"""Allow platform records without an authenticated account.

Revision ID: 8c4a12de901f
Revises: 57f8a7c3d12e
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "8c4a12de901f"
down_revision: Union[str, None] = "57f8a7c3d12e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Existing owner/user IDs and foreign keys are retained; only NULL is permitted.
    with op.batch_alter_table("properties") as batch_op:
        batch_op.alter_column("owner_id", existing_type=sa.Integer(), nullable=True)
    with op.batch_alter_table("assistant_chats") as batch_op:
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=True)

def downgrade() -> None:
    raise RuntimeError("A revers?o exige atribuir usu?rios a registros an?nimos e pode corromper os dados.")
