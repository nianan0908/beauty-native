from collections.abc import Iterable
from datetime import UTC, date, datetime
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import Permission, Role, User
from app.modules.auth.security import hash_password
from app.modules.store.models import Store
from app.modules.tenant.models import Plan, Tenant

PERMISSIONS = {
    "platform:manage": "管理平台商户与套餐",
    "tenant:manage": "管理当前商户",
    "store:read": "查看门店",
    "store:manage": "管理门店",
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
    for index, (code, description) in enumerate(PERMISSIONS.items(), start=1):
        permission = existing.get(code)
        if permission is None:
            permission = Permission(id=f"PERM{index:03d}", code=code, description=description)
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
