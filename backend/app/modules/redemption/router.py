from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.redemption.dependencies import RedemptionActorDependency
from app.modules.redemption.models import (
    CardRedemption,
    CardStatus,
    CustomerCard,
    OrderStatus,
    RedemptionOrder,
)
from app.modules.redemption.schemas import (
    CardOption,
    PendingRedemptionView,
    RedemptionCreate,
    RedemptionView,
)
from app.modules.redemption.service import redeem_employee_card

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/pending", response_model=list[PendingRedemptionView], summary="员工待核销服务")
async def list_pending_redemptions(
    actor: RedemptionActorDependency, session: DbSession
) -> list[PendingRedemptionView]:
    if actor.role != "employee":
        raise HTTPException(status_code=403, detail="该入口仅供服务员工查看")
    orders = list(
        (
            await session.scalars(
                select(RedemptionOrder)
                .where(
                    RedemptionOrder.merchant_id == actor.merchant_id,
                    RedemptionOrder.store_id == actor.store_id,
                    RedemptionOrder.employee_id == actor.id,
                    RedemptionOrder.status == OrderStatus.PENDING,
                )
                .order_by(RedemptionOrder.created_at.desc())
            )
        ).all()
    )
    if not orders:
        return []
    customer_ids = {order.customer_id for order in orders}
    service_ids = {order.service_id for order in orders}
    cards = list(
        (
            await session.scalars(
                select(CustomerCard).where(
                    CustomerCard.merchant_id == actor.merchant_id,
                    CustomerCard.customer_id.in_(customer_ids),
                    CustomerCard.service_id.in_(service_ids),
                    CustomerCard.status == CardStatus.ACTIVE,
                    CustomerCard.remaining_times > 0,
                    CustomerCard.expires_at >= datetime.now(UTC).date(),
                )
            )
        ).all()
    )
    return [
        PendingRedemptionView(
            order_id=order.id,
            appointment_id=order.appointment_id,
            customer_id=order.customer_id,
            customer_name=order.customer_name,
            service_id=order.service_id,
            service_name=order.service_name,
            employee_id=order.employee_id,
            created_at=order.created_at,
            cards=[
                CardOption(
                    id=card.id,
                    name=card.name,
                    remaining_times=card.remaining_times,
                    expires_at=card.expires_at,
                )
                for card in cards
                if card.customer_id == order.customer_id and card.service_id == order.service_id
            ],
        )
        for order in orders
    ]


@router.get("/history", response_model=list[RedemptionView], summary="员工本人核销流水")
async def list_redemption_history(
    actor: RedemptionActorDependency, session: DbSession
) -> list[CardRedemption]:
    if actor.role != "employee":
        raise HTTPException(status_code=403, detail="该入口仅供服务员工查看")
    result = await session.scalars(
        select(CardRedemption)
        .where(
            CardRedemption.merchant_id == actor.merchant_id,
            CardRedemption.store_id == actor.store_id,
            CardRedemption.employee_id == actor.id,
        )
        .order_by(CardRedemption.created_at.desc())
    )
    return list(result.all())


@router.post(
    "/orders/{order_id}",
    response_model=RedemptionView,
    summary="员工核销本人服务对应次卡",
)
async def redeem_order(
    order_id: str,
    payload: RedemptionCreate,
    actor: RedemptionActorDependency,
    session: DbSession,
) -> CardRedemption:
    async with session.begin():
        return await redeem_employee_card(session, actor, order_id, payload.card_id)
