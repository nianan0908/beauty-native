from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.database import get_db_session
from app.modules.auth.dependencies import assert_store_scope, require_permissions
from app.modules.auth.schemas import Principal, RoleCode
from app.modules.service.models import BeautyService
from app.modules.service.schemas import ServiceCreate, ServiceUpdate, ServiceView
from app.modules.store.models import Store

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
ServiceReader = Annotated[Principal, Depends(require_permissions("service:read"))]
ServiceManager = Annotated[Principal, Depends(require_permissions("service:manage"))]


def tenant_for(principal: Principal) -> str:
    if principal.tenant_id is None:
        raise ForbiddenError("当前账号未关联商户。")
    return principal.tenant_id


def view(service: BeautyService) -> ServiceView:
    return ServiceView(
        id=service.id,
        tenant_id=service.tenant_id,
        name=service.name,
        category=service.category,
        duration=service.duration_minutes,
        price=service.price,
        tone=service.tone,
        store_ids=sorted(store.id for store in service.stores),
        is_online=service.is_online,
        booking_enabled=service.booking_enabled,
    )


async def resolve_stores(
    session: AsyncSession, principal: Principal, store_ids: list[str]
) -> list[Store]:
    tenant_id = tenant_for(principal)
    for store_id in set(store_ids):
        assert_store_scope(principal, tenant_id, store_id)
    stores = list(
        (
            await session.scalars(
                select(Store).where(
                    Store.tenant_id == tenant_id,
                    Store.id.in_(set(store_ids)),
                )
            )
        ).all()
    )
    if len(stores) != len(set(store_ids)):
        raise NotFoundError("部分适用门店不存在。")
    return stores


async def scoped_service(
    session: AsyncSession, principal: Principal, service_id: str
) -> BeautyService:
    service = await session.scalar(
        select(BeautyService)
        .where(
            BeautyService.id == service_id,
            BeautyService.tenant_id == tenant_for(principal),
        )
        .options(selectinload(BeautyService.stores))
    )
    if service is None:
        raise NotFoundError("服务项目不存在。")
    if principal.role != RoleCode.OWNER and not (
        {store.id for store in service.stores} & principal.store_ids
    ):
        raise ForbiddenError("不能访问其他门店的服务项目。")
    return service


@router.get("", response_model=list[ServiceView], summary="服务项目列表")
async def list_services(
    principal: ServiceReader, session: DbSession
) -> list[ServiceView]:
    statement = (
        select(BeautyService)
        .where(BeautyService.tenant_id == tenant_for(principal))
        .options(selectinload(BeautyService.stores))
        .order_by(BeautyService.created_at, BeautyService.id)
    )
    services = list((await session.scalars(statement)).all())
    if principal.role != RoleCode.OWNER:
        services = [
            service
            for service in services
            if {store.id for store in service.stores} & principal.store_ids
        ]
    return [view(service) for service in services]


@router.post("", response_model=ServiceView, summary="新增服务项目")
async def create_service(
    payload: ServiceCreate, principal: ServiceManager, session: DbSession
) -> ServiceView:
    tenant_id = tenant_for(principal)
    duplicate = await session.scalar(
        select(BeautyService.id).where(
            BeautyService.tenant_id == tenant_id,
            BeautyService.name == payload.name.strip(),
        )
    )
    if duplicate is not None:
        raise ConflictError("当前商户已存在同名服务项目。")
    service = BeautyService(
        tenant_id=tenant_id,
        name=payload.name.strip(),
        category=payload.category.strip(),
        duration_minutes=payload.duration,
        price=payload.price,
        tone=payload.tone,
        is_online=payload.is_online,
        booking_enabled=payload.booking_enabled,
        stores=await resolve_stores(session, principal, payload.store_ids),
    )
    session.add(service)
    await session.commit()
    return view(service)


@router.patch("/{service_id}", response_model=ServiceView, summary="编辑服务项目")
async def update_service(
    service_id: str,
    payload: ServiceUpdate,
    principal: ServiceManager,
    session: DbSession,
) -> ServiceView:
    service = await scoped_service(session, principal, service_id)
    changes = payload.model_dump(exclude_unset=True)
    store_ids = changes.pop("store_ids", None)
    if store_ids is not None:
        service.stores = await resolve_stores(session, principal, store_ids)
    if "duration" in changes:
        service.duration_minutes = changes.pop("duration")
    for field, value in changes.items():
        setattr(service, field, value.strip() if isinstance(value, str) else value)
    await session.commit()
    return view(service)


async def set_publish_status(
    service_id: str,
    published: bool,
    principal: ServiceManager,
    session: DbSession,
) -> ServiceView:
    service = await scoped_service(session, principal, service_id)
    service.is_online = published
    await session.commit()
    return view(service)


@router.post("/{service_id}/publish", response_model=ServiceView, summary="上架服务项目")
async def publish_service(
    service_id: str, principal: ServiceManager, session: DbSession
) -> ServiceView:
    return await set_publish_status(service_id, True, principal, session)


@router.post(
    "/{service_id}/unpublish", response_model=ServiceView, summary="下架服务项目"
)
async def unpublish_service(
    service_id: str, principal: ServiceManager, session: DbSession
) -> ServiceView:
    return await set_publish_status(service_id, False, principal, session)
