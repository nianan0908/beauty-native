from typing import Annotated

from fastapi import Depends

from app.common.errors import ForbiddenError
from app.modules.auth.dependencies import CurrentPrincipal
from app.modules.auth.schemas import RoleCode
from app.modules.inventory.schemas import Actor


async def current_actor(principal: CurrentPrincipal) -> Actor:
    if principal.role not in {RoleCode.OWNER, RoleCode.MANAGER, RoleCode.EMPLOYEE}:
        raise ForbiddenError("当前角色没有耗材权限。")
    if principal.tenant_id is None:
        raise ForbiddenError("当前账号未关联商户。")
    store_id = next(iter(principal.store_ids), None)
    if principal.role in {RoleCode.MANAGER, RoleCode.EMPLOYEE} and store_id is None:
        raise ForbiddenError("当前账号未分配门店。")
    return Actor.model_validate(
        {
            "id": principal.entity_id or principal.user_id,
            "role": principal.role.value,
            "merchant_id": principal.tenant_id,
            "store_id": store_id,
        }
    )


ActorDependency = Annotated[Actor, Depends(current_actor)]
