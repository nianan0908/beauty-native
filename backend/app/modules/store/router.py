import secrets
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.database import get_db_session
from app.modules.auth.dependencies import assert_store_scope, require_permissions
from app.modules.auth.schemas import Principal, RoleCode
from app.modules.store.models import Store
from app.modules.store.schemas import StoreCreate, StoreUpdate, StoreView

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
StoreReader = Annotated[Principal, Depends(require_permissions("store:read"))]
StoreManager = Annotated[Principal, Depends(require_permissions("store:manage"))]


def tenant_for(principal: Principal) -> str:
    if principal.tenant_id is None:
        raise ForbiddenError("当前账号未关联商户。")
    return principal.tenant_id


def store_statement(principal: Principal) -> Select[tuple[Store]]:
    statement = select(Store).where(Store.tenant_id == tenant_for(principal))
    if principal.role != RoleCode.OWNER:
        statement = statement.where(Store.id.in_(principal.store_ids))
    return statement


async def scoped_store(session: AsyncSession, principal: Principal, store_id: str) -> Store:
    tenant_id = tenant_for(principal)
    assert_store_scope(principal, tenant_id, store_id)
    store = await session.scalar(
        select(Store).where(Store.id == store_id, Store.tenant_id == tenant_id)
    )
    if store is None:
        raise NotFoundError("门店不存在。")
    return store


@router.get("", response_model=list[StoreView], summary="门店列表")
async def list_stores(principal: StoreReader, session: DbSession) -> list[Store]:
    result = await session.scalars(store_statement(principal).order_by(Store.created_at, Store.id))
    return list(result.all())


@router.post("", response_model=StoreView, summary="新增门店")
async def create_store(
    payload: StoreCreate, principal: StoreManager, session: DbSession
) -> Store:
    tenant_id = tenant_for(principal)
    duplicate = await session.scalar(
        select(Store.id).where(Store.tenant_id == tenant_id, Store.name == payload.name.strip())
    )
    if duplicate is not None:
        raise ConflictError("当前商户已存在同名门店。")
    store = Store(
        id=f"MS{secrets.token_hex(10).upper()}",
        tenant_id=tenant_id,
        name=payload.name.strip(),
        address=payload.address.strip(),
        phone=payload.phone.strip(),
        business_hours=payload.business_hours.strip(),
        manager_staff_id=payload.manager_staff_id,
        status="open",
    )
    session.add(store)
    await session.commit()
    return store


@router.get("/{store_id}", response_model=StoreView, summary="门店详情")
async def get_store(store_id: str, principal: StoreReader, session: DbSession) -> Store:
    return await scoped_store(session, principal, store_id)


@router.patch("/{store_id}", response_model=StoreView, summary="编辑门店")
async def update_store(
    store_id: str,
    payload: StoreUpdate,
    principal: StoreManager,
    session: DbSession,
) -> Store:
    store = await scoped_store(session, principal, store_id)
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(store, field, value.strip() if isinstance(value, str) else value)
    await session.commit()
    return store


async def set_store_status(
    store_id: str, status: str, principal: StoreManager, session: DbSession
) -> Store:
    store = await scoped_store(session, principal, store_id)
    store.status = status
    await session.commit()
    return store


@router.post("/{store_id}/pause", response_model=StoreView, summary="暂停门店营业")
async def pause_store(store_id: str, principal: StoreManager, session: DbSession) -> Store:
    return await set_store_status(store_id, "paused", principal, session)


@router.post("/{store_id}/resume", response_model=StoreView, summary="恢复门店营业")
async def resume_store(store_id: str, principal: StoreManager, session: DbSession) -> Store:
    return await set_store_status(store_id, "open", principal, session)
