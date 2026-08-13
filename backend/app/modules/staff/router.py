import secrets
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.common.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.database import get_db_session
from app.modules.auth.dependencies import assert_store_scope, require_permissions
from app.modules.auth.models import User
from app.modules.auth.schemas import Principal, RoleCode
from app.modules.service.models import BeautyService
from app.modules.staff.models import StaffProfile
from app.modules.staff.schemas import StaffCreate, StaffServicesUpdate, StaffUpdate, StaffView
from app.modules.store.models import Store

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
StaffReader = Annotated[Principal, Depends(require_permissions("staff:read"))]
StaffManager = Annotated[Principal, Depends(require_permissions("staff:manage"))]


def tenant_for(principal: Principal) -> str:
    if principal.tenant_id is None:
        raise ForbiddenError("当前账号未关联商户。")
    return principal.tenant_id


def view(profile: StaffProfile) -> StaffView:
    return StaffView(
        id=profile.id,
        tenant_id=profile.tenant_id,
        store_id=profile.store_id,
        name=profile.name,
        phone=profile.phone,
        title=profile.title,
        role=profile.role,
        status=profile.status,
        joined_at=profile.joined_at,
        monthly_target=profile.monthly_target,
        service_ids=sorted(item.id for item in profile.services),
        services=sorted(item.name for item in profile.services),
    )


async def ensure_store(session: AsyncSession, principal: Principal, store_id: str) -> None:
    tenant_id = tenant_for(principal)
    assert_store_scope(principal, tenant_id, store_id)
    exists = await session.scalar(
        select(Store.id).where(Store.id == store_id, Store.tenant_id == tenant_id)
    )
    if exists is None:
        raise NotFoundError("门店不存在。")


async def scoped_staff(
    session: AsyncSession, principal: Principal, staff_id: str
) -> StaffProfile:
    profile = await session.scalar(
        select(StaffProfile)
        .where(StaffProfile.id == staff_id, StaffProfile.tenant_id == tenant_for(principal))
        .options(selectinload(StaffProfile.services))
    )
    if profile is None:
        raise NotFoundError("员工不存在。")
    assert_store_scope(principal, profile.tenant_id, profile.store_id)
    return profile


async def resolve_services(
    session: AsyncSession, tenant_id: str, service_ids: list[str], store_id: str
) -> list[BeautyService]:
    services = list(
        (
            await session.scalars(
                select(BeautyService).where(
                    BeautyService.tenant_id == tenant_id,
                    BeautyService.id.in_(set(service_ids)),
                ).options(selectinload(BeautyService.stores))
            )
        ).all()
    )
    if len(services) != len(set(service_ids)):
        raise NotFoundError("部分服务项目不存在。")
    if any(store_id not in {store.id for store in service.stores} for service in services):
        raise ConflictError("员工只能配置所属门店提供的服务项目。")
    return services


@router.get("", response_model=list[StaffView], summary="员工列表")
async def list_staff(principal: StaffReader, session: DbSession) -> list[StaffView]:
    statement = (
        select(StaffProfile)
        .where(StaffProfile.tenant_id == tenant_for(principal))
        .options(selectinload(StaffProfile.services))
        .order_by(StaffProfile.created_at, StaffProfile.id)
    )
    if principal.role != RoleCode.OWNER:
        statement = statement.where(StaffProfile.store_id.in_(principal.store_ids))
    return [view(item) for item in (await session.scalars(statement)).all()]


@router.post("", response_model=StaffView, summary="新增员工")
async def create_staff(
    payload: StaffCreate, principal: StaffManager, session: DbSession
) -> StaffView:
    await ensure_store(session, principal, payload.store_id)
    tenant_id = tenant_for(principal)
    duplicate = await session.scalar(
        select(StaffProfile.id).where(
            StaffProfile.tenant_id == tenant_id, StaffProfile.phone == payload.phone.strip()
        )
    )
    if duplicate is not None:
        raise ConflictError("当前商户已存在相同手机号的员工。")
    profile = StaffProfile(
        id=f"E{secrets.token_hex(10).upper()}",
        tenant_id=tenant_id,
        store_id=payload.store_id,
        name=payload.name.strip(),
        phone=payload.phone.strip(),
        title=payload.title.strip(),
        role=payload.role,
        status="active",
        joined_at=payload.joined_at,
        monthly_target=payload.monthly_target,
        services=await resolve_services(
            session, tenant_id, payload.service_ids, payload.store_id
        ),
    )
    session.add(profile)
    await session.commit()
    return view(profile)


@router.get("/{staff_id}", response_model=StaffView, summary="员工详情")
async def get_staff(staff_id: str, principal: StaffReader, session: DbSession) -> StaffView:
    return view(await scoped_staff(session, principal, staff_id))


@router.patch("/{staff_id}", response_model=StaffView, summary="编辑员工")
async def update_staff(
    staff_id: str,
    payload: StaffUpdate,
    principal: StaffManager,
    session: DbSession,
) -> StaffView:
    profile = await scoped_staff(session, principal, staff_id)
    changes = payload.model_dump(exclude_unset=True)
    if "store_id" in changes:
        await ensure_store(session, principal, changes["store_id"])
        await resolve_services(
            session,
            profile.tenant_id,
            [service.id for service in profile.services],
            changes["store_id"],
        )
    for field, value in changes.items():
        setattr(profile, field, value.strip() if isinstance(value, str) else value)
    await session.commit()
    return view(profile)


@router.put("/{staff_id}/services", response_model=StaffView, summary="配置员工服务能力")
async def update_staff_services(
    staff_id: str,
    payload: StaffServicesUpdate,
    principal: StaffManager,
    session: DbSession,
) -> StaffView:
    profile = await scoped_staff(session, principal, staff_id)
    profile.services = await resolve_services(
        session, profile.tenant_id, payload.service_ids, profile.store_id
    )
    await session.commit()
    return view(profile)


async def set_staff_status(
    staff_id: str,
    status: str,
    active: bool,
    principal: StaffManager,
    session: DbSession,
) -> StaffView:
    profile = await scoped_staff(session, principal, staff_id)
    profile.status = status
    user = await session.scalar(
        select(User).where(
            User.tenant_id == profile.tenant_id,
            User.entity_id == profile.id,
        )
    )
    if user is not None:
        user.is_active = active
        user.token_version += 1
    await session.commit()
    return view(profile)


@router.post("/{staff_id}/disable", response_model=StaffView, summary="停用员工")
async def disable_staff(
    staff_id: str, principal: StaffManager, session: DbSession
) -> StaffView:
    return await set_staff_status(staff_id, "disabled", False, principal, session)


@router.post("/{staff_id}/enable", response_model=StaffView, summary="恢复员工")
async def enable_staff(
    staff_id: str, principal: StaffManager, session: DbSession
) -> StaffView:
    return await set_staff_status(staff_id, "active", True, principal, session)
