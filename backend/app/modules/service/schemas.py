from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=2, max_length=50)
    duration: int = Field(gt=0, le=1440)
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    tone: str = Field(default="service-green", max_length=30)
    store_ids: list[str] = Field(min_length=1, alias="storeIds")
    is_online: bool = Field(default=True, alias="isOnline")
    booking_enabled: bool = Field(default=True, alias="bookingEnabled")

    model_config = ConfigDict(populate_by_name=True)


class ServiceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    category: str | None = Field(default=None, min_length=2, max_length=50)
    duration: int | None = Field(default=None, gt=0, le=1440)
    price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    tone: str | None = Field(default=None, max_length=30)
    store_ids: list[str] | None = Field(default=None, min_length=1, alias="storeIds")
    is_online: bool | None = Field(default=None, alias="isOnline")
    booking_enabled: bool | None = Field(default=None, alias="bookingEnabled")

    model_config = ConfigDict(populate_by_name=True)


class ServiceView(BaseModel):
    id: str
    tenant_id: str = Field(alias="tenantId")
    name: str
    category: str
    duration: int
    price: Decimal
    tone: str
    store_ids: list[str] = Field(alias="storeIds")
    is_online: bool = Field(alias="isOnline")
    booking_enabled: bool = Field(alias="bookingEnabled")

    model_config = ConfigDict(populate_by_name=True)
