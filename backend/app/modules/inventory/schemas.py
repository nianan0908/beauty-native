from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

from app.modules.inventory.models import TransactionStatus, TransactionType


class Actor(BaseModel):
    id: str
    role: Literal["owner", "manager", "employee"]
    merchant_id: str
    store_id: str | None = None


class StockView(BaseModel):
    consumable_id: str
    name: str
    category: str
    unit: str
    unit_cost: Decimal
    store_id: str
    quantity: Decimal
    safety_stock: Decimal


class RestockCreate(BaseModel):
    store_id: str
    consumable_id: str
    quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)


class InventoryRequestCreate(BaseModel):
    store_id: str
    consumable_id: str
    type: Literal[TransactionType.EXTRA_PICK, TransactionType.RETURN, TransactionType.DAMAGE]
    quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)
    service_id: str | None = None
    appointment_id: str | None = None
    reason: str = Field(min_length=2, max_length=300)


class ServiceDeductionCreate(BaseModel):
    merchant_id: str
    store_id: str
    service_id: str
    appointment_id: str
    employee_id: str


class TransactionView(BaseModel):
    id: str
    store_id: str
    consumable_id: str
    type: TransactionType
    quantity: Decimal
    change: Decimal
    status: TransactionStatus
    employee_id: str | None
    service_id: str | None
    appointment_id: str | None
    reason: str | None
    operator_id: str
    approver_id: str | None
    created_at: datetime
    approved_at: datetime | None

    model_config = {"from_attributes": True}
