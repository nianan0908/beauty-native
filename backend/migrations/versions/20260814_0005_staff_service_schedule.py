"""Add staff profiles, services and staff schedules.

Revision ID: 20260814_0005
Revises: 20260814_0004
Create Date: 2026-08-14
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260814_0005"
down_revision: str | None = "20260814_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "staff_profiles",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("tenant_id", sa.String(32), nullable=False),
        sa.Column("store_id", sa.String(32), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(30), nullable=False),
        sa.Column("title", sa.String(100), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("joined_at", sa.Date(), nullable=False),
        sa.Column("monthly_target", sa.Numeric(12, 2), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("tenant_id", "phone"),
    )
    op.create_index("ix_staff_profiles_tenant_id", "staff_profiles", ["tenant_id"])
    op.create_index("ix_staff_profiles_store_id", "staff_profiles", ["store_id"])
    op.create_index("ix_staff_profiles_role", "staff_profiles", ["role"])
    op.create_index("ix_staff_profiles_status", "staff_profiles", ["status"])
    op.add_column(
        "stores", sa.Column("manager_staff_id", sa.String(32), nullable=True)
    )
    op.create_foreign_key(
        "fk_stores_manager_staff_id_staff_profiles",
        "stores",
        "staff_profiles",
        ["manager_staff_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_stores_manager_staff_id", "stores", ["manager_staff_id"])

    op.create_table(
        "services",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("tenant_id", sa.String(32), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("tone", sa.String(30), nullable=False),
        sa.Column("is_online", sa.Boolean(), nullable=False),
        sa.Column("booking_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("duration_minutes > 0", name="duration_positive"),
        sa.CheckConstraint("price >= 0", name="price_nonnegative"),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("tenant_id", "name"),
    )
    op.create_index("ix_services_tenant_id", "services", ["tenant_id"])
    op.create_index("ix_services_is_online", "services", ["is_online"])
    op.create_index("ix_services_booking_enabled", "services", ["booking_enabled"])

    op.create_table(
        "service_store_relations",
        sa.Column("service_id", sa.String(32), nullable=False),
        sa.Column("store_id", sa.String(32), nullable=False),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("service_id", "store_id"),
    )
    op.create_table(
        "staff_service_relations",
        sa.Column("staff_id", sa.String(32), nullable=False),
        sa.Column("service_id", sa.String(32), nullable=False),
        sa.ForeignKeyConstraint(["staff_id"], ["staff_profiles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("staff_id", "service_id"),
    )
    op.create_table(
        "staff_schedules",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("tenant_id", sa.String(32), nullable=False),
        sa.Column("store_id", sa.String(32), nullable=False),
        sa.Column("staff_id", sa.String(32), nullable=False),
        sa.Column("work_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("schedule_type", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "schedule_type != 'work' OR start_time < end_time",
            name="work_time_order",
        ),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["store_id"], ["stores.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["staff_id"], ["staff_profiles.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("staff_id", "work_date"),
    )
    op.create_index("ix_staff_schedules_tenant_id", "staff_schedules", ["tenant_id"])
    op.create_index("ix_staff_schedules_store_id", "staff_schedules", ["store_id"])
    op.create_index("ix_staff_schedules_staff_id", "staff_schedules", ["staff_id"])
    op.create_index("ix_staff_schedules_work_date", "staff_schedules", ["work_date"])
    op.create_index(
        "ix_staff_schedules_schedule_type", "staff_schedules", ["schedule_type"]
    )


def downgrade() -> None:
    op.drop_table("staff_schedules")
    op.drop_table("staff_service_relations")
    op.drop_table("service_store_relations")
    op.drop_table("services")
    op.drop_index("ix_stores_manager_staff_id", table_name="stores")
    op.drop_constraint(
        "fk_stores_manager_staff_id_staff_profiles", "stores", type_="foreignkey"
    )
    op.drop_column("stores", "manager_staff_id")
    op.drop_table("staff_profiles")
