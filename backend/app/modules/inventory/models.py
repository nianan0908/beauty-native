import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def new_id(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:20].upper()}"


class TransactionType(StrEnum):
    RESTOCK = "入库"
    STANDARD_USAGE = "标准消耗"
    EXTRA_PICK = "额外领用"
    RETURN = "退回"
    DAMAGE = "报损"
    STOCKTAKE = "盘点调整"


class TransactionStatus(StrEnum):
    PENDING = "待审批"
    APPROVED = "已通过"
    REJECTED = "已驳回"


class Consumable(Base):
    __tablename__ = "consumables"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(50))
    unit: Mapped[str] = mapped_column(String(20))
    unit_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)


class ConsumableStock(Base):
    __tablename__ = "consumable_stocks"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="quantity_nonnegative"),
        UniqueConstraint("store_id", "consumable_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    store_id: Mapped[str] = mapped_column(String(32), index=True)
    consumable_id: Mapped[str] = mapped_column(ForeignKey("consumables.id"))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0"))
    safety_stock: Mapped[Decimal] = mapped_column(Numeric(14, 3), default=Decimal("0"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)


class ServiceConsumableUsage(Base):
    __tablename__ = "service_consumable_usages"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        UniqueConstraint("service_id", "consumable_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    service_id: Mapped[str] = mapped_column(String(32), index=True)
    consumable_id: Mapped[str] = mapped_column(ForeignKey("consumables.id"))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))


class ConsumableTransaction(Base):
    __tablename__ = "consumable_transactions"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        UniqueConstraint(
            "appointment_id", "consumable_id", "type", name="uq_consumable_service_deduction"
        ),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    store_id: Mapped[str] = mapped_column(String(32), index=True)
    consumable_id: Mapped[str] = mapped_column(ForeignKey("consumables.id"))
    type: Mapped[TransactionType] = mapped_column(String(30))
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    change: Mapped[Decimal] = mapped_column(Numeric(14, 3))
    status: Mapped[TransactionStatus] = mapped_column(String(20), index=True)
    employee_id: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    service_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    appointment_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    operator_id: Mapped[str] = mapped_column(String(32))
    approver_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
