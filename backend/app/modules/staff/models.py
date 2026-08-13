import secrets
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.modules.service.models import BeautyService


def utc_now() -> datetime:
    return datetime.now(UTC)


def new_staff_id() -> str:
    return f"E{secrets.token_hex(10).upper()}"


class StaffProfile(Base):
    __tablename__ = "staff_profiles"
    __table_args__ = (UniqueConstraint("tenant_id", "phone"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_staff_id)
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"), index=True
    )
    store_id: Mapped[str] = mapped_column(
        ForeignKey("stores.id", ondelete="RESTRICT"), index=True
    )
    name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(30))
    title: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(20), index=True)
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    joined_at: Mapped[date] = mapped_column(Date)
    monthly_target: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
    services: Mapped[list["BeautyService"]] = relationship(
        secondary="staff_service_relations",
        lazy="selectin",
    )
