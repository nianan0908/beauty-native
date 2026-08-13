from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.errors import ForbiddenError, UnauthorizedError
from app.core.database import get_db_session
from app.modules.auth.schemas import Principal
from app.modules.auth.security import decode_access_token
from app.modules.auth.service import load_user, principal_from_user

bearer = HTTPBearer(auto_error=False)
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_principal(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    session: DbSession,
) -> Principal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError()
    user_id, version = decode_access_token(credentials.credentials)
    user = await load_user(session, user_id)
    if user is None or user.token_version != version:
        raise UnauthorizedError()
    return principal_from_user(user)


CurrentPrincipal = Annotated[Principal, Depends(get_current_principal)]


def require_permissions(
    *required: str,
) -> Callable[[CurrentPrincipal], Awaitable[Principal]]:
    async def permission_dependency(principal: CurrentPrincipal) -> Principal:
        if not set(required).issubset(principal.permissions):
            raise ForbiddenError()
        return principal

    return permission_dependency


def assert_tenant_scope(principal: Principal, tenant_id: str) -> None:
    if principal.role.value == "platform":
        return
    if principal.tenant_id != tenant_id:
        raise ForbiddenError("不能访问其他商户的数据。")


def assert_store_scope(principal: Principal, tenant_id: str, store_id: str) -> None:
    assert_tenant_scope(principal, tenant_id)
    if principal.role.value in {"platform", "owner"}:
        return
    if store_id not in principal.store_ids:
        raise ForbiddenError("不能访问其他门店的数据。")
