from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.errors import ForbiddenError, NotFoundError
from app.core.database import get_db_session
from app.modules.auth.dependencies import assert_store_scope, require_permissions
from app.modules.auth.schemas import Principal, RoleCode
from app.modules.schedule.models import StaffSchedule
from app.modules.schedule.schemas import ScheduleBatchUpdate, ScheduleView
from app.modules.staff.models import StaffProfile

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]
ScheduleReader = Annotated[Principal, Depends(require_permissions("schedule:read"))]
ScheduleManager = Annotated[Principal, Depends(require_permissions("schedule:manage"))]


def tenant_for(principal: Principal) -> str:
    if principal.tenant_id is None:
        raise ForbiddenError("当前账号未关联商户。")
    return principal.tenant_id


def schedule_view(schedule: StaffSchedule) -> ScheduleView:
    return ScheduleView(
        id=schedule.id,
        tenant_id=schedule.tenant_id,
        store_id=schedule.store_id,
        staff_id=schedule.staff_id,
        date=schedule.work_date,
        start_time=schedule.start_time,
        end_time=schedule.end_time,
        type=schedule.schedule_type,
    )


@router.get("", response_model=list[ScheduleView], summary="排班列表")
async def list_schedules(
    principal: ScheduleReader,
    session: DbSession,
    start_date: Annotated[date | None, Query(alias="startDate")] = None,
    end_date: Annotated[date | None, Query(alias="endDate")] = None,
) -> list[ScheduleView]:
    statement = select(StaffSchedule).where(
        StaffSchedule.tenant_id == tenant_for(principal)
    )
    if principal.role == RoleCode.EMPLOYEE:
        if principal.entity_id is None:
            raise ForbiddenError("当前员工账号未关联员工档案。")
        statement = statement.where(StaffSchedule.staff_id == principal.entity_id)
    elif principal.role != RoleCode.OWNER:
        statement = statement.where(StaffSchedule.store_id.in_(principal.store_ids))
    if start_date is not None:
        statement = statement.where(StaffSchedule.work_date >= start_date)
    if end_date is not None:
        statement = statement.where(StaffSchedule.work_date <= end_date)
    result = await session.scalars(
        statement.order_by(StaffSchedule.work_date, StaffSchedule.start_time)
    )
    return [schedule_view(item) for item in result.all()]


@router.put("/batch", response_model=list[ScheduleView], summary="批量保存排班")
async def save_schedule_batch(
    payload: ScheduleBatchUpdate,
    principal: ScheduleManager,
    session: DbSession,
) -> list[ScheduleView]:
    tenant_id = tenant_for(principal)
    staff_ids = {entry.staff_id for entry in payload.entries}
    profiles = list(
        (
            await session.scalars(
                select(StaffProfile).where(
                    StaffProfile.tenant_id == tenant_id,
                    StaffProfile.id.in_(staff_ids),
                    StaffProfile.status == "active",
                )
            )
        ).all()
    )
    if len(profiles) != len(staff_ids):
        raise NotFoundError("部分员工不存在或已停用。")
    profile_by_id = {profile.id: profile for profile in profiles}
    for profile in profiles:
        assert_store_scope(principal, tenant_id, profile.store_id)

    saved: list[StaffSchedule] = []
    for entry in payload.entries:
        profile = profile_by_id[entry.staff_id]
        statement = (
            insert(StaffSchedule)
            .values(
                tenant_id=tenant_id,
                store_id=profile.store_id,
                staff_id=profile.id,
                work_date=entry.date,
                start_time=entry.start_time,
                end_time=entry.end_time,
                schedule_type=entry.type,
            )
            .on_conflict_do_update(
                index_elements=[StaffSchedule.staff_id, StaffSchedule.work_date],
                set_={
                    "store_id": profile.store_id,
                    "start_time": entry.start_time,
                    "end_time": entry.end_time,
                    "schedule_type": entry.type,
                },
            )
            .returning(StaffSchedule)
        )
        saved.append((await session.scalars(statement)).one())
    await session.commit()
    return [schedule_view(item) for item in saved]


@router.delete("/{schedule_id}", status_code=204, summary="删除排班")
async def delete_schedule(
    schedule_id: str, principal: ScheduleManager, session: DbSession
) -> None:
    schedule = await session.scalar(
        select(StaffSchedule).where(
            StaffSchedule.id == schedule_id,
            StaffSchedule.tenant_id == tenant_for(principal),
        )
    )
    if schedule is None:
        raise NotFoundError("排班不存在。")
    assert_store_scope(principal, schedule.tenant_id, schedule.store_id)
    await session.execute(delete(StaffSchedule).where(StaffSchedule.id == schedule.id))
    await session.commit()
