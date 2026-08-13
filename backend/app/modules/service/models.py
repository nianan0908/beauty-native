import secrets
from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.store.models import Store


def utc_now() -> datetime:
    return datetime.now(UTC)


def new_service_id() -> str:
    return f"S{secrets.token_hex(10).upper()}"


service_store_relations = Table(
    "service_store_relations",
    Base.metadata,
    Column("service_id", ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
    Column("store_id", ForeignKey("stores.id", ondelete="CASCADE"), primary_key=True),
)

staff_service_relations = Table(
    "staff_service_relations",
    Base.metadata,
    Column("staff_id", ForeignKey("staff_profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
)


class BeautyService(Base):
    __tablename__ = "services"
    __table_args__ = (
        CheckConstraint("duration_minutes > 0", name="duration_positive"),
        CheckConstraint("price >= 0", name="price_nonnegative"),
        UniqueConstraint("tenant_id", "name"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_service_id)
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True
    )
    name: Mapped[str] = mapped_column(String(120))
    category: Mapped[str] = mapped_column(String(50))
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    tone: Mapped[str] = mapped_column(String(30), default="service-green")
    is_online: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    booking_enabled: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
    stores: Mapped[list["Store"]] = relationship(
        secondary=service_store_relations,
        lazy="selectin",
    )
