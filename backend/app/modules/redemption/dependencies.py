from typing import Annotated

from fastapi import Depends

from app.common.errors import ForbiddenError
from app.modules.auth.dependencies import CurrentPrincipal
from app.modules.auth.schemas import RoleCode
from app.modules.redemption.schemas import RedemptionActor


async def current_redemption_actor(principal: CurrentPrincipal) -> RedemptionActor:
    allowed_roles = {
        RoleCode.OWNER,
        RoleCode.MANAGER,
        RoleCode.RECEPTIONIST,
        RoleCode.EMPLOYEE,
    }
    if principal.role not in allowed_roles:
        raise ForbiddenError("当前角色没有核销权限。")
    if principal.tenant_id is None:
        raise ForbiddenError("当前账号未关联商户。")
    store_id = next(iter(principal.store_ids), None)
    if principal.role != RoleCode.OWNER and store_id is None:
        raise ForbiddenError("当前账号未分配门店。")
    return RedemptionActor.model_validate(
        {
            "id": principal.entity_id or principal.user_id,
            "role": principal.role.value,
            "merchant_id": principal.tenant_id,
            "store_id": store_id,
        }
    )


RedemptionActorDependency = Annotated[RedemptionActor, Depends(current_redemption_actor)]
