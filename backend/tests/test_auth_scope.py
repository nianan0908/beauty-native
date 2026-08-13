import pytest

from app.common.errors import ForbiddenError, UnauthorizedError
from app.modules.auth.dependencies import assert_store_scope, assert_tenant_scope
from app.modules.auth.models import Role, User
from app.modules.auth.schemas import Principal, RoleCode
from app.modules.auth.service import principal_from_user
from app.modules.tenant.models import Tenant


def principal(role: RoleCode, tenant_id: str | None, stores: set[str]) -> Principal:
    return Principal(
        user_id="U_TEST",
        username="tester",
        display_name="测试账号",
        role=role,
        roles=frozenset({role}),
        permissions=frozenset(),
        tenant_id=tenant_id,
        store_ids=frozenset(stores),
    )


def test_owner_can_access_multiple_stores_in_own_tenant() -> None:
    owner = principal(RoleCode.OWNER, "T001", {"MS001", "MS006"})

    assert_store_scope(owner, "T001", "MS001")
    assert_store_scope(owner, "T001", "MS006")


def test_manager_cannot_access_another_store() -> None:
    manager = principal(RoleCode.MANAGER, "T001", {"MS001"})

    with pytest.raises(ForbiddenError):
        assert_store_scope(manager, "T001", "MS006")


def test_non_platform_user_cannot_cross_tenant() -> None:
    owner = principal(RoleCode.OWNER, "T001", {"MS001", "MS006"})

    with pytest.raises(ForbiddenError):
        assert_tenant_scope(owner, "T002")


def test_inactive_user_is_rejected() -> None:
    user = User(
        id="U_INACTIVE",
        username="inactive",
        password_hash="unused",
        display_name="停用账号",
        is_active=False,
        roles=[Role(id="ROLE_OWNER", code="owner", name="老板")],
    )

    with pytest.raises(UnauthorizedError, match="停用"):
        principal_from_user(user)


def test_frozen_tenant_is_rejected() -> None:
    tenant = Tenant(id="T_FROZEN", name="冻结商户", status="frozen")
    user = User(
        id="U_FROZEN",
        tenant_id=tenant.id,
        username="frozen",
        password_hash="unused",
        display_name="冻结商户账号",
        is_active=True,
        tenant=tenant,
        roles=[Role(id="ROLE_OWNER", code="owner", name="老板")],
    )

    with pytest.raises(UnauthorizedError, match="冻结"):
        principal_from_user(user)
