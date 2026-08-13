"""Add employee card redemption records and required order/card data.

Revision ID: 20260814_0004
Revises: 20260814_0003
Create Date: 2026-08-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260814_0004"
down_revision: str | None = "20260814_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("store_id", sa.String(32), nullable=False, index=True),
        sa.Column("customer_id", sa.String(32), nullable=False, index=True),
        sa.Column("service_id", sa.String(32), nullable=False, index=True),
        sa.Column("employee_id", sa.String(32), nullable=False, index=True),
        sa.Column("appointment_id", sa.String(32), nullable=True),
        sa.Column("customer_name", sa.String(100), nullable=False),
        sa.Column("service_name", sa.String(100), nullable=False),
        sa.Column("employee_name", sa.String(100), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, index=True),
        sa.Column("payment_method", sa.String(20), nullable=True),
        sa.Column("customer_card_id", sa.String(32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        "customer_cards",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("customer_id", sa.String(32), nullable=False, index=True),
        sa.Column("service_id", sa.String(32), nullable=False, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("remaining_times", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.Date(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, index=True),
        sa.CheckConstraint("remaining_times >= 0", name="remaining_times_nonnegative"),
    )
    op.create_table(
        "card_redemptions",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("merchant_id", sa.String(32), nullable=False, index=True),
        sa.Column("store_id", sa.String(32), nullable=False, index=True),
        sa.Column("order_id", sa.String(32), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("appointment_id", sa.String(32), nullable=True),
        sa.Column(
            "card_id", sa.String(32), sa.ForeignKey("customer_cards.id"), nullable=False
        ),
        sa.Column("customer_id", sa.String(32), nullable=False, index=True),
        sa.Column("service_id", sa.String(32), nullable=False),
        sa.Column("employee_id", sa.String(32), nullable=False, index=True),
        sa.Column("balance", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("balance >= 0", name="balance_nonnegative"),
        sa.UniqueConstraint("order_id", name="uq_card_redemptions_order_id"),
    )


def downgrade() -> None:
    op.drop_table("card_redemptions")
    op.drop_table("customer_cards")
    op.drop_table("orders")
