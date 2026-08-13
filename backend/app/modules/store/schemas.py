from pydantic import BaseModel, ConfigDict, Field


class StoreCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=2, max_length=255)
    phone: str = Field(min_length=5, max_length=30)
    business_hours: str = Field(
        default="09:30 - 21:00", alias="businessHours", max_length=50
    )
    manager_staff_id: str | None = Field(default=None, alias="managerStaffId")

    model_config = ConfigDict(populate_by_name=True)


class StoreUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    address: str | None = Field(default=None, min_length=2, max_length=255)
    phone: str | None = Field(default=None, min_length=5, max_length=30)
    business_hours: str | None = Field(
        default=None, alias="businessHours", max_length=50
    )
    manager_staff_id: str | None = Field(default=None, alias="managerStaffId")

    model_config = ConfigDict(populate_by_name=True)


class StoreView(BaseModel):
    id: str
    tenant_id: str = Field(alias="tenantId")
    name: str
    address: str
    phone: str
    business_hours: str = Field(alias="businessHours")
    manager_staff_id: str | None = Field(alias="managerStaffId")
    status: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
