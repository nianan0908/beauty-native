from datetime import UTC, date, datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.redemption.models import (
    CardRedemption,
    CardStatus,
    CustomerCard,
    OrderStatus,
    RedemptionOrder,
    new_id,
)
from app.modules.redemption.schemas import RedemptionActor


def assert_employee_order_scope(actor: RedemptionActor, order: RedemptionOrder) -> None:
    if actor.role != "employee":
        raise HTTPException(status_code=403, detail="该入口仅供服务员工核销")
    if actor.merchant_id != order.merchant_id or actor.store_id != order.store_id:
        raise HTTPException(status_code=403, detail="不能核销其他门店的订单")
    if actor.id != order.employee_id:
        raise HTTPException(status_code=403, detail="员工只能核销本人服务的订单")


def assert_card_matches_order(card: CustomerCard, order: RedemptionOrder, today: date) -> None:
    if card.merchant_id != order.merchant_id:
        raise HTTPException(status_code=403, detail="不能使用其他商户的次卡")
    if card.customer_id != order.customer_id or card.service_id != order.service_id:
        raise HTTPException(status_code=409, detail="次卡与本次会员或服务项目不匹配")
    if card.status != CardStatus.ACTIVE or card.remaining_times <= 0:
        raise HTTPException(status_code=409, detail="该次卡当前不可用")
    if card.expires_at < today:
        raise HTTPException(status_code=409, detail="该次卡已过期")


async def redeem_employee_card(
    session: AsyncSession,
    actor: RedemptionActor,
    order_id: str,
    card_id: str,
) -> CardRedemption:
    order = await session.scalar(
        select(RedemptionOrder).where(RedemptionOrder.id == order_id).with_for_update()
    )
    if order is None:
        raise HTTPException(status_code=404, detail="待核销订单不存在")
    assert_employee_order_scope(actor, order)

    previous = await session.scalar(
        select(CardRedemption).where(CardRedemption.order_id == order.id)
    )
    if previous is not None:
        return previous
    if order.status != OrderStatus.PENDING:
        raise HTTPException(status_code=409, detail="该订单已经结算，不能重复核销")

    card = await session.scalar(
        select(CustomerCard).where(CustomerCard.id == card_id).with_for_update()
    )
    if card is None:
        raise HTTPException(status_code=404, detail="次卡不存在")
    assert_card_matches_order(card, order, datetime.now(UTC).date())

    card.remaining_times -= 1
    if card.remaining_times == 0:
        card.status = CardStatus.EXHAUSTED
    completed_at = datetime.now(UTC)
    order.status = OrderStatus.COMPLETED
    order.payment_method = "次卡"
    order.customer_card_id = card.id
    order.completed_at = completed_at
    redemption = CardRedemption(
        id=new_id("CR"),
        merchant_id=order.merchant_id,
        store_id=order.store_id,
        order_id=order.id,
        appointment_id=order.appointment_id,
        card_id=card.id,
        customer_id=order.customer_id,
        service_id=order.service_id,
        employee_id=actor.id,
        balance=card.remaining_times,
        source="员工核销",
        created_at=completed_at,
    )
    session.add(redemption)
    await session.flush()
    return redemption
