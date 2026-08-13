from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.errors import UnauthorizedError
from app.core.config import settings
from app.core.database import get_db_session
from app.modules.auth.dependencies import CurrentPrincipal
from app.modules.auth.schemas import LoginRequest, LogoutResponse, TokenResponse, UserView
from app.modules.auth.service import (
    access_response_values,
    authenticate_user,
    clear_login_rate_limit,
    enforce_login_rate_limit,
    issue_refresh_token,
    revoke_refresh_token,
    rotate_refresh_token,
)

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
RefreshCookie = Annotated[
    str | None,
    Cookie(alias=settings.refresh_cookie_name),
]


def set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=raw_token,
        max_age=settings.refresh_token_days * 24 * 60 * 60,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite="lax",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite="lax",
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: DbSession,
) -> TokenResponse:
    client_key = request.client.host if request.client else "unknown"
    rate_key = await enforce_login_rate_limit(payload.username, client_key)
    user = await authenticate_user(session, payload.username, payload.password)
    raw_refresh, refresh = issue_refresh_token(user)
    session.add(refresh)
    await session.commit()
    await clear_login_rate_limit(rate_key)
    set_refresh_cookie(response, raw_refresh)
    access_token, expires_in, principal = access_response_values(user)
    return TokenResponse(
        accessToken=access_token,
        expiresIn=expires_in,
        user=UserView.from_principal(principal),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    session: DbSession,
    refresh_token: RefreshCookie = None,
) -> TokenResponse:
    if not refresh_token:
        raise UnauthorizedError("缺少刷新令牌。")
    user, raw_refresh, _replacement = await rotate_refresh_token(session, refresh_token)
    await session.commit()
    set_refresh_cookie(response, raw_refresh)
    access_token, expires_in, principal = access_response_values(user)
    return TokenResponse(
        accessToken=access_token,
        expiresIn=expires_in,
        user=UserView.from_principal(principal),
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    response: Response,
    session: DbSession,
    refresh_token: RefreshCookie = None,
) -> LogoutResponse:
    await revoke_refresh_token(session, refresh_token)
    await session.commit()
    clear_refresh_cookie(response)
    return LogoutResponse()


@router.get("/me", response_model=UserView)
async def me(principal: CurrentPrincipal) -> UserView:
    return UserView.from_principal(principal)
