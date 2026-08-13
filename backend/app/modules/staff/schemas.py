from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class StaffCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=5, max_length=30)
    title: str = Field(min_length=2, max_length=100)
    role: str = Field(pattern="^(manager|receptionist|employee)$")
    store_id: str = Field(alias="storeId")
    service_ids: list[str] = Field(default_factory=list, alias="serviceIds")
    joined_at: date = Field(alias="joinedAt")
    monthly_target: Decimal = Field(default=Decimal("0"), ge=0, alias="monthlyTarget")

    model_config = ConfigDict(populate_by_name=True)


class StaffUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    phone: str | None = Field(default=None, min_length=5, max_length=30)
    title: str | None = Field(default=None, min_length=2, max_length=100)
    role: str | None = Field(default=None, pattern="^(manager|receptionist|employee)$")
    store_id: str | None = Field(default=None, alias="storeId")
    joined_at: date | None = Field(default=None, alias="joinedAt")
    monthly_target: Decimal | None = Field(default=None, ge=0, alias="monthlyTarget")

    model_config = ConfigDict(populate_by_name=True)


class StaffServicesUpdate(BaseModel):
    service_ids: list[str] = Field(alias="serviceIds")

    model_config = ConfigDict(populate_by_name=True)


class StaffView(BaseModel):
    id: str
    tenant_id: str = Field(alias="tenantId")
    store_id: str = Field(alias="storeId")
    name: str
    phone: str
    title: str
    role: str
    status: str
    joined_at: date = Field(alias="joinedAt")
    monthly_target: Decimal = Field(alias="monthlyTarget")
    service_ids: list[str] = Field(alias="serviceIds")
    services: list[str]

    model_config = ConfigDict(populate_by_name=True)
