"""Add consumable inventory and auditable stock transactions.

Revision ID: 20260814_0002
Revises: 20260813_0001
Create Date: 2026-08-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260814_0002"
down_revision: str | None = "20260813_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "consumables",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("unit", sa.String(20), nullable=False),
        sa.Column("unit_cost", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "consumable_stocks",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("store_id", sa.String(32), nullable=False, index=True),
        sa.Column("consumable_id", sa.String(32), sa.ForeignKey("consumables.id"), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False, server_default="0"),
        sa.Column("safety_stock", sa.Numeric(14, 3), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("quantity >= 0", name="quantity_nonnegative"),
        sa.UniqueConstraint("store_id", "consumable_id"),
    )
    op.create_table(
        "service_consumable_usages",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("service_id", sa.String(32), nullable=False, index=True),
        sa.Column("consumable_id", sa.String(32), sa.ForeignKey("consumables.id"), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
        sa.CheckConstraint("quantity > 0", name="quantity_positive"),
        sa.UniqueConstraint("service_id", "consumable_id"),
    )
    op.create_table(
        "consumable_transactions",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("store_id", sa.String(32), nullable=False, index=True),
        sa.Column("consumable_id", sa.String(32), sa.ForeignKey("consumables.id"), nullable=False),
        sa.Column("type", sa.String(30), nullable=False),
        sa.Column("quantity", sa.Numeric(14, 3), nullable=False),
        sa.Column("change", sa.Numeric(14, 3), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, index=True),
        sa.Column("employee_id", sa.String(32), nullable=True, index=True),
        sa.Column("service_id", sa.String(32), nullable=True),
        sa.Column("appointment_id", sa.String(32), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("operator_id", sa.String(32), nullable=False),
        sa.Column("approver_id", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("quantity > 0", name="quantity_positive"),
        sa.UniqueConstraint(
            "appointment_id", "consumable_id", "type", name="uq_consumable_service_deduction"
        ),
    )


def downgrade() -> None:
    op.drop_table("consumable_transactions")
    op.drop_table("service_consumable_usages")
    op.drop_table("consumable_stocks")
    op.drop_table("consumables")
