import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any, cast

import structlog
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from app.common.errors import TooManyRequestsError, UnauthorizedError
from app.core.config import settings
from app.core.redis import redis_client
from app.modules.auth.models import RefreshToken, Role, User
from app.modules.auth.schemas import Principal, RoleCode
from app.modules.auth.security import (
    create_access_token,
    generate_refresh_token,
    refresh_token_digest,
    verify_password,
)

logger = structlog.get_logger(__name__)


def user_load_options() -> tuple[Any, ...]:
    return (
        joinedload(User.tenant),
        selectinload(User.stores),
        selectinload(User.roles).selectinload(Role.permissions),
    )


async def load_user(session: AsyncSession, user_id: str) -> User | None:
    statement = select(User).where(User.id == user_id).options(*user_load_options())
    return cast(User | None, await session.scalar(statement))


def principal_from_user(user: User) -> Principal:
    if not user.is_active:
        raise UnauthorizedError("当前账号已停用。")
    if user.tenant is not None and user.tenant.status == "frozen":
        raise UnauthorizedError("当前商户已被冻结，请联系平台管理员。")
    roles = frozenset(RoleCode(role.code) for role in user.roles)
    if not roles:
        raise UnauthorizedError("当前账号尚未分配角色。")
    role_order = (
        RoleCode.PLATFORM,
        RoleCode.OWNER,
        RoleCode.MANAGER,
        RoleCode.RECEPTIONIST,
        RoleCode.EMPLOYEE,
        RoleCode.CUSTOMER,
    )
    primary_role = next(role for role in role_order if role in roles)
    permissions = frozenset(
        permission.code for role in user.roles for permission in role.permissions
    )
    return Principal(
        user_id=user.id,
        username=user.username,
        display_name=user.display_name,
        role=primary_role,
        roles=roles,
        permissions=permissions,
        tenant_id=user.tenant_id,
        store_ids=frozenset(store.id for store in user.stores),
        entity_id=user.entity_id,
    )


async def enforce_login_rate_limit(
    username: str,
    client_key: str,
    client: Redis = redis_client,
) -> str:
    identity = hashlib.sha256(f"{client_key}:{username.lower()}".encode()).hexdigest()
    key = f"auth:login:{identity}"
    try:
        attempts = await client.incr(key)
        if attempts == 1:
            await client.expire(key, settings.login_rate_window_seconds)
        if attempts > settings.login_rate_limit:
            raise TooManyRequestsError()
    except TooManyRequestsError:
        raise
    except Exception as exc:
        logger.warning("login_rate_limit_unavailable", error_type=type(exc).__name__)
    return key


async def clear_login_rate_limit(key: str, client: Redis = redis_client) -> None:
    try:
        await client.delete(key)
    except Exception as exc:
        logger.warning("login_rate_limit_clear_failed", error_type=type(exc).__name__)


async def authenticate_user(session: AsyncSession, username: str, password: str) -> User:
    statement = (
        select(User)
        .where(User.username == username.strip().lower())
        .options(*user_load_options())
    )
    user = await session.scalar(statement)
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError("账号或密码不正确。")
    principal_from_user(user)
    user.last_login_at = datetime.now(UTC)
    return user


def issue_refresh_token(user: User) -> tuple[str, RefreshToken]:
    raw, digest = generate_refresh_token()
    token = RefreshToken(
        id=f"RT{secrets_id()}",
        user_id=user.id,
        token_hash=digest,
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
    )
    return raw, token


def secrets_id() -> str:
    return secrets.token_hex(10).upper()


async def rotate_refresh_token(
    session: AsyncSession, raw_token: str
) -> tuple[User, str, RefreshToken]:
    now = datetime.now(UTC)
    statement = (
        select(RefreshToken)
        .where(RefreshToken.token_hash == refresh_token_digest(raw_token))
        .with_for_update(of=RefreshToken)
        .options(
            joinedload(RefreshToken.user).joinedload(User.tenant),
            joinedload(RefreshToken.user).selectinload(User.stores),
            joinedload(RefreshToken.user)
            .selectinload(User.roles)
            .selectinload(Role.permissions),
        )
    )
    current = await session.scalar(statement)
    if current is None or current.revoked_at is not None or current.expires_at <= now:
        raise UnauthorizedError("刷新令牌无效或已过期。")
    user = current.user
    principal_from_user(user)
    raw, replacement = issue_refresh_token(user)
    current.revoked_at = now
    current.last_used_at = now
    current.replaced_by_id = replacement.id
    session.add(replacement)
    return user, raw, replacement


async def revoke_refresh_token(session: AsyncSession, raw_token: str | None) -> None:
    if not raw_token:
        return
    token = await session.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == refresh_token_digest(raw_token))
    )
    if token is not None and token.revoked_at is None:
        token.revoked_at = datetime.now(UTC)


def access_response_values(user: User) -> tuple[str, int, Principal]:
    principal = principal_from_user(user)
    access_token, expires_in = create_access_token(user.id, user.token_version)
    return access_token, expires_in, principal
