from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


class RedemptionActor(BaseModel):
    id: str
    role: Literal["owner", "manager", "receptionist", "employee"]
    merchant_id: str
    store_id: str | None = None


class CardOption(BaseModel):
    id: str
    name: str
    remaining_times: int
    expires_at: date


class PendingRedemptionView(BaseModel):
    order_id: str
    appointment_id: str | None
    customer_id: str
    customer_name: str
    service_id: str
    service_name: str
    employee_id: str
    created_at: datetime
    cards: list[CardOption]


class RedemptionCreate(BaseModel):
    card_id: str


class RedemptionView(BaseModel):
    id: str
    order_id: str
    appointment_id: str | None
    card_id: str
    customer_id: str
    service_id: str
    employee_id: str
    balance: int
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}
