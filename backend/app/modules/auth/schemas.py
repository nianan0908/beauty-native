from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class RoleCode(StrEnum):
    PLATFORM = "platform"
    OWNER = "owner"
    MANAGER = "manager"
    RECEPTIONIST = "receptionist"
    EMPLOYEE = "employee"
    CUSTOMER = "customer"


class Principal(BaseModel):
    model_config = ConfigDict(frozen=True)

    user_id: str
    username: str
    display_name: str
    role: RoleCode
    roles: frozenset[RoleCode]
    permissions: frozenset[str]
    tenant_id: str | None = None
    store_ids: frozenset[str] = frozenset()
    entity_id: str | None = None


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=80)
    password: str = Field(min_length=1, max_length=200)


class UserView(BaseModel):
    id: str
    username: str
    display_name: str = Field(alias="displayName")
    role: RoleCode
    roles: list[RoleCode]
    permissions: list[str]
    tenant_id: str | None = Field(default=None, alias="tenantId")
    store_ids: list[str] = Field(alias="storeIds")
    entity_id: str | None = Field(default=None, alias="entityId")

    @classmethod
    def from_principal(cls, principal: Principal) -> "UserView":
        return cls(
            id=principal.user_id,
            username=principal.username,
            displayName=principal.display_name,
            role=principal.role,
            roles=sorted(principal.roles, key=str),
            permissions=sorted(principal.permissions),
            tenantId=principal.tenant_id,
            storeIds=sorted(principal.store_ids),
            entityId=principal.entity_id,
        )


class TokenResponse(BaseModel):
    access_token: str = Field(alias="accessToken")
    token_type: str = Field(default="bearer", alias="tokenType")
    expires_in: int = Field(alias="expiresIn")
    user: UserView


class LogoutResponse(BaseModel):
    success: bool = True
