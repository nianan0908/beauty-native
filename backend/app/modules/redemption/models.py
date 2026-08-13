import uuid
from datetime import date, datetime
from enum import StrEnum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def new_id(prefix: str) -> str:
    return f"{prefix}{uuid.uuid4().hex[:20].upper()}"


class OrderStatus(StrEnum):
    PENDING = "待结算"
    COMPLETED = "已完成"
    REFUNDED = "已退款"


class CardStatus(StrEnum):
    ACTIVE = "使用中"
    EXHAUSTED = "已用完"
    EXPIRED = "已过期"


class RedemptionOrder(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    store_id: Mapped[str] = mapped_column(String(32), index=True)
    customer_id: Mapped[str] = mapped_column(String(32), index=True)
    service_id: Mapped[str] = mapped_column(String(32), index=True)
    employee_id: Mapped[str] = mapped_column(String(32), index=True)
    appointment_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100))
    service_name: Mapped[str] = mapped_column(String(100))
    employee_name: Mapped[str] = mapped_column(String(100))
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False), default=OrderStatus.PENDING, index=True
    )
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_card_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class CustomerCard(Base):
    __tablename__ = "customer_cards"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    customer_id: Mapped[str] = mapped_column(String(32), index=True)
    service_id: Mapped[str] = mapped_column(String(32), index=True)
    name: Mapped[str] = mapped_column(String(120))
    remaining_times: Mapped[int] = mapped_column(Integer)
    expires_at: Mapped[date] = mapped_column(Date)
    status: Mapped[CardStatus] = mapped_column(
        Enum(CardStatus, native_enum=False), default=CardStatus.ACTIVE, index=True
    )


class CardRedemption(Base):
    __tablename__ = "card_redemptions"
    __table_args__ = (UniqueConstraint("order_id", name="uq_card_redemptions_order_id"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    merchant_id: Mapped[str] = mapped_column(String(32), index=True)
    store_id: Mapped[str] = mapped_column(String(32), index=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    appointment_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    card_id: Mapped[str] = mapped_column(ForeignKey("customer_cards.id"), index=True)
    customer_id: Mapped[str] = mapped_column(String(32), index=True)
    service_id: Mapped[str] = mapped_column(String(32))
    employee_id: Mapped[str] = mapped_column(String(32), index=True)
    balance: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(20), default="员工核销")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now)
