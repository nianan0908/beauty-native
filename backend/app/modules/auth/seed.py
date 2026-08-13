from collections.abc import Iterable
from datetime import UTC, date, datetime, time
from decimal import Decimal
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.auth.models import Permission, Role, User
from app.modules.auth.security import hash_password
from app.modules.schedule.models import StaffSchedule
from app.modules.service.models import BeautyService
from app.modules.staff.models import StaffProfile
from app.modules.store.models import Store
from app.modules.tenant.models import Plan, Tenant

PERMISSIONS = {
    "platform:manage": "管理平台商户与套餐",
    "tenant:manage": "管理当前商户",
    "store:read": "查看门店",
    "store:manage": "管理门店",
    "service:read": "查看服务项目",
    "service:manage": "管理服务项目",
    "staff:read": "查看员工",
    "staff:manage": "管理员工",
    "schedule:read": "查看排班",
    "schedule:manage": "管理排班",
    "customer:read": "查看会员",
    "customer:manage": "管理会员",
    "appointment:read": "查看预约",
    "appointment:create": "创建预约",
    "appointment:receive": "确认与接待预约",
    "appointment:service": "执行服务状态",
    "order:read": "查看订单",
    "order:settle": "收银结算",
    "after_sale:read": "查看售后",
    "after_sale:handle": "处理售后",
    "after_sale:approve": "审批售后",
    "report:tenant": "查看商户报表",
    "report:store": "查看门店报表",
    "report:self": "查看个人业绩",
    "inventory:read": "查看耗材库存",
    "inventory:request": "提交耗材申请",
    "inventory:manage": "管理和审批耗材",
    "self:read": "查看本人数据",
}

ROLE_PERMISSIONS = {
    "platform": {"platform:manage"},
    "owner": set(PERMISSIONS) - {"platform:manage", "self:read"},
    "manager": {
        "store:read",
        "staff:read",
        "staff:manage",
        "service:read",
        "schedule:read",
        "schedule:manage",
        "customer:read",
        "customer:manage",
        "appointment:read",
        "appointment:create",
        "appointment:receive",
        "order:read",
        "order:settle",
        "after_sale:read",
        "after_sale:handle",
        "after_sale:approve",
        "report:store",
        "inventory:read",
        "inventory:manage",
    },
    "receptionist": {
        "store:read",
        "staff:read",
        "service:read",
        "customer:read",
        "customer:manage",
        "appointment:read",
        "appointment:create",
        "appointment:receive",
        "order:read",
        "order:settle",
        "after_sale:read",
        "after_sale:handle",
        "inventory:read",
    },
    "employee": {
        "store:read",
        "service:read",
        "schedule:read",
        "customer:read",
        "appointment:read",
        "appointment:service",
        "report:self",
        "inventory:read",
        "inventory:request",
    },
    "customer": {"self:read", "appointment:create", "after_sale:read"},
}

ROLE_NAMES = {
    "platform": "平台管理员",
    "owner": "商家老板",
    "manager": "门店店长",
    "receptionist": "门店前台",
    "employee": "服务员工",
    "customer": "品牌会员",
}


def role_id(code: str) -> str:
    return f"ROLE_{code.upper()}"


async def upsert_permissions(session: AsyncSession) -> dict[str, Permission]:
    existing = {item.code: item for item in (await session.scalars(select(Permission))).all()}
    used_ids = {item.id for item in existing.values()}
    next_id = max((int(item_id.removeprefix("PERM")) for item_id in used_ids), default=0) + 1
    for code, description in PERMISSIONS.items():
        permission = existing.get(code)
        if permission is None:
            while f"PERM{next_id:03d}" in used_ids:
                next_id += 1
            permission = Permission(
                id=f"PERM{next_id:03d}", code=code, description=description
            )
            used_ids.add(permission.id)
            next_id += 1
            session.add(permission)
            existing[code] = permission
        else:
            permission.description = description
    await session.flush()
    return existing


async def upsert_roles(
    session: AsyncSession, permissions: dict[str, Permission]
) -> dict[str, Role]:
    existing = {item.code: item for item in (await session.scalars(select(Role))).all()}
    for code, name in ROLE_NAMES.items():
        role = existing.get(code)
        if role is None:
            role = Role(id=role_id(code), code=code, name=name)
            session.add(role)
            existing[code] = role
        role.name = name
        role.permissions = [permissions[item] for item in sorted(ROLE_PERMISSIONS[code])]
    await session.flush()
    return existing


async def add_if_missing(session: AsyncSession, items: Iterable[Any]) -> None:
    for item in items:
        model = type(item)
        item_id = item.id
        if await session.get(model, item_id) is None:
            session.add(item)
    await session.flush()


async def seed_services(
    session: AsyncSession, stores: dict[str, Store]
) -> dict[str, BeautyService]:
    definitions = [
        ("S001", "水光焕肤护理", "面部护理", 60, "298", ["MS001", "MS006"]),
        ("S002", "肩颈舒缓 SPA", "身体舒缓", 75, "368", ["MS001"]),
        ("S003", "轻奢手部护理", "手部护理", 45, "168", ["MS006"]),
        ("S004", "深层清洁护理", "面部护理", 60, "258", ["MS001", "MS006"]),
    ]
    existing = {
        item.id: item
        for item in (
            await session.scalars(
                select(BeautyService)
                .where(BeautyService.tenant_id == "T001")
                .options(selectinload(BeautyService.stores))
            )
        ).all()
    }
    for index, (service_id, name, category, duration, price, store_ids) in enumerate(
        definitions
    ):
        service = existing.get(service_id)
        if service is None:
            service = BeautyService(id=service_id, tenant_id="T001")
            session.add(service)
            existing[service_id] = service
        service.name = name
        service.category = category
        service.duration_minutes = duration
        service.price = Decimal(price)
        service.tone = ["service-green", "service-coral", "service-blue", "service-gold"][
            index
        ]
        service.is_online = True
        service.booking_enabled = True
        service.stores = [stores[store_id] for store_id in store_ids]
    await session.flush()
    return existing


async def seed_staff(
    session: AsyncSession,
    services: dict[str, BeautyService],
) -> dict[str, StaffProfile]:
    definitions = [
        (
            "E001", "MS001", "苏禾", "138****5126", "资深美容师", "employee",
            "2024-06-18", "30000", ["S001", "S002"],
        ),
        (
            "E002", "MS001", "孟然", "137****8062", "SPA 理疗师", "employee",
            "2025-02-12", "26000", ["S002"],
        ),
        (
            "E003", "MS001", "周琳", "159****2730", "皮肤管理师", "employee",
            "2024-11-03", "28000", ["S004", "S001"],
        ),
        (
            "E004", "MS001", "陈妍", "136****1985", "云锦路店店长", "manager",
            "2023-08-20", "50000", ["S001"],
        ),
        (
            "R001", "MS001", "张悦", "135****2068", "门店前台", "receptionist",
            "2025-09-08", "0", [],
        ),
        (
            "E005", "MS006", "叶晨", "188****6412", "美容师", "employee",
            "2026-03-15", "18000", ["S003"],
        ),
    ]
    existing = {
        item.id: item
        for item in (
            await session.scalars(
                select(StaffProfile)
                .where(StaffProfile.tenant_id == "T001")
                .options(selectinload(StaffProfile.services))
            )
        ).all()
    }
    for staff_id, store_id, name, phone, title, role, joined, target, service_ids in definitions:
        profile = existing.get(staff_id)
        if profile is None:
            profile = StaffProfile(id=staff_id, tenant_id="T001")
            session.add(profile)
            existing[staff_id] = profile
        profile.store_id = store_id
        profile.name = name
        profile.phone = phone
        profile.title = title
        profile.role = role
        profile.status = "active"
        profile.joined_at = date.fromisoformat(joined)
        profile.monthly_target = Decimal(target)
        profile.services = [services[service_id] for service_id in service_ids]
    await session.flush()
    return existing


async def seed_schedules(session: AsyncSession, staff: dict[str, StaffProfile]) -> None:
    definitions = [
        ("SH001", "E001", date(2026, 8, 14), time(9, 30), time(18, 30), "work"),
        ("SH002", "E002", date(2026, 8, 14), time(11), time(20), "work"),
        ("SH003", "E003", date(2026, 8, 14), time(9, 30), time(18, 30), "work"),
        ("SH004", "E004", date(2026, 8, 14), time(9, 30), time(18, 30), "work"),
        ("SH005", "E005", date(2026, 8, 14), time(10), time(20, 30), "rest"),
    ]
    for schedule_id, staff_id, work_date, start, end, schedule_type in definitions:
        schedule = await session.get(StaffSchedule, schedule_id)
        profile = staff[staff_id]
        if schedule is None:
            schedule = StaffSchedule(id=schedule_id)
            session.add(schedule)
        schedule.tenant_id = profile.tenant_id
        schedule.store_id = profile.store_id
        schedule.staff_id = staff_id
        schedule.work_date = work_date
        schedule.start_time = start
        schedule.end_time = end
        schedule.schedule_type = schedule_type
    await session.flush()


async def seed_demo_data(session: AsyncSession) -> None:
    now = datetime.now(UTC)
    plan = Plan(id="PLAN_PRO", code="pro", name="专业版", active=True)
    tenant = Tenant(
        id="T001",
        plan_id=plan.id,
        name="栖光美学",
        status="normal",
        timezone="Asia/Shanghai",
        expires_at=date(2027, 8, 13),
    )
    stores = [
        Store(
            id="MS001",
            tenant_id=tenant.id,
            name="云锦路店",
            address="上海市静安区云锦路 188 号",
            phone="021-6688 1028",
            business_hours="09:30 - 21:00",
            status="open",
        ),
        Store(
            id="MS006",
            tenant_id=tenant.id,
            name="湖滨路店",
            address="上海市徐汇区湖滨路 66 号",
            phone="021-6688 1066",
            business_hours="10:00 - 20:30",
            status="open",
        ),
    ]
    await add_if_missing(session, [plan])
    await add_if_missing(session, [tenant])
    await add_if_missing(session, stores)

    permissions = await upsert_permissions(session)
    roles = await upsert_roles(session, permissions)
    store_by_id = {
        store.id: cast(Store, await session.get(Store, store.id)) for store in stores
    }
    services = await seed_services(session, store_by_id)
    staff = await seed_staff(session, services)
    await seed_schedules(session, staff)
    store_by_id["MS001"].manager_staff_id = "E004"
    store_by_id["MS006"].manager_staff_id = "E005"
    password = hash_password("demo123")
    accounts = [
        ("U_PLATFORM", "admin", "平台运营", "platform", None, None, []),
        ("U_OWNER", "boss", "林知夏", "owner", "T001", "OWNER001", ["MS001", "MS006"]),
        ("U_MANAGER", "manager", "陈妍", "manager", "T001", "E004", ["MS001"]),
        ("U_RECEPTION", "reception", "张悦", "receptionist", "T001", "R001", ["MS001"]),
        ("U_STAFF", "staff", "苏禾", "employee", "T001", "E001", ["MS001"]),
        ("U_CUSTOMER", "customer", "周小姐", "customer", "T001", "C001", []),
    ]
    existing_users = {item.username: item for item in (await session.scalars(select(User))).all()}
    for user_id, username, name, role_code, tenant_id, entity_id, store_ids in accounts:
        user = existing_users.get(username)
        if user is None:
            user = User(
                id=user_id,
                username=username,
                password_hash=password,
                display_name=name,
                tenant_id=tenant_id,
                entity_id=entity_id,
                is_active=True,
                token_version=1,
                created_at=now,
                updated_at=now,
            )
            session.add(user)
        else:
            user.display_name = name
            user.tenant_id = tenant_id
            user.entity_id = entity_id
        user.roles = [roles[role_code]]
        user.stores = [store_by_id[item] for item in store_ids]
    await session.commit()
