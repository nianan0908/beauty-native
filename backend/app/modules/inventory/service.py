from datetime import UTC, datetime
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.inventory.models import (
    Consumable,
    ConsumableStock,
    ConsumableTransaction,
    ServiceConsumableUsage,
    TransactionStatus,
    TransactionType,
    new_id,
)
from app.modules.inventory.schemas import Actor, InventoryRequestCreate, ServiceDeductionCreate


def signed_change(transaction_type: TransactionType, quantity: Decimal) -> Decimal:
    if transaction_type in {TransactionType.RESTOCK, TransactionType.RETURN}:
        return abs(quantity)
    if transaction_type in {
        TransactionType.STANDARD_USAGE,
        TransactionType.EXTRA_PICK,
        TransactionType.DAMAGE,
    }:
        return -abs(quantity)
    return quantity


def assert_store_scope(actor: Actor, merchant_id: str, store_id: str) -> None:
    if actor.merchant_id != merchant_id:
        raise HTTPException(status_code=403, detail="不能访问其他商户数据")
    if actor.role != "owner" and actor.store_id != store_id:
        raise HTTPException(status_code=403, detail="不能访问其他门店数据")


async def locked_stock(
    session: AsyncSession, merchant_id: str, store_id: str, consumable_id: str
) -> ConsumableStock:
    statement = (
        select(ConsumableStock)
        .where(
            ConsumableStock.merchant_id == merchant_id,
            ConsumableStock.store_id == store_id,
            ConsumableStock.consumable_id == consumable_id,
        )
        .with_for_update()
    )
    stock = await session.scalar(statement)
    if stock is None:
        raise HTTPException(status_code=404, detail="该门店尚未建立此耗材库存")
    return stock


async def apply_stock_change(
    session: AsyncSession, stock: ConsumableStock, change: Decimal
) -> None:
    next_quantity = stock.quantity + change
    if next_quantity < 0:
        raise HTTPException(status_code=409, detail="库存不足，无法完成操作")
    stock.quantity = next_quantity
    stock.updated_at = datetime.now(UTC)
    await session.flush()


async def create_request(
    session: AsyncSession, actor: Actor, payload: InventoryRequestCreate
) -> ConsumableTransaction:
    assert_store_scope(actor, actor.merchant_id, payload.store_id)
    if actor.role != "employee":
        raise HTTPException(status_code=403, detail="该入口仅用于员工提交耗材申请")
    exists = await session.scalar(
        select(Consumable.id).where(
            Consumable.id == payload.consumable_id,
            Consumable.merchant_id == actor.merchant_id,
            Consumable.enabled.is_(True),
        )
    )
    if exists is None:
        raise HTTPException(status_code=404, detail="耗材不存在或已停用")
    transaction = ConsumableTransaction(
        id=new_id("MT"),
        merchant_id=actor.merchant_id,
        store_id=payload.store_id,
        consumable_id=payload.consumable_id,
        type=TransactionType(payload.type),
        quantity=payload.quantity,
        change=signed_change(TransactionType(payload.type), payload.quantity),
        status=TransactionStatus.PENDING,
        employee_id=actor.id,
        service_id=payload.service_id,
        appointment_id=payload.appointment_id,
        reason=payload.reason,
        operator_id=actor.id,
    )
    session.add(transaction)
    await session.flush()
    return transaction


async def review_request(
    session: AsyncSession, actor: Actor, transaction_id: str, approve: bool
) -> ConsumableTransaction:
    if actor.role not in {"owner", "manager"}:
        raise HTTPException(status_code=403, detail="只有老板或店长可以审批")
    transaction = await session.scalar(
        select(ConsumableTransaction)
        .where(ConsumableTransaction.id == transaction_id)
        .with_for_update()
    )
    if transaction is None:
        raise HTTPException(status_code=404, detail="耗材申请不存在")
    assert_store_scope(actor, transaction.merchant_id, transaction.store_id)
    if transaction.status != TransactionStatus.PENDING:
        raise HTTPException(status_code=409, detail="该申请已经处理")
    if approve:
        stock = await locked_stock(
            session, transaction.merchant_id, transaction.store_id, transaction.consumable_id
        )
        await apply_stock_change(session, stock, transaction.change)
        transaction.status = TransactionStatus.APPROVED
    else:
        transaction.status = TransactionStatus.REJECTED
    transaction.approver_id = actor.id
    transaction.approved_at = datetime.now(UTC)
    await session.flush()
    return transaction


async def deduct_service_consumables(
    session: AsyncSession, payload: ServiceDeductionCreate
) -> list[ConsumableTransaction]:
    usages = list(
        (
            await session.scalars(
                select(ServiceConsumableUsage).where(
                    ServiceConsumableUsage.merchant_id == payload.merchant_id,
                    ServiceConsumableUsage.service_id == payload.service_id,
                )
            )
        ).all()
    )
    created: list[ConsumableTransaction] = []
    for usage in usages:
        previous = await session.scalar(
            select(ConsumableTransaction.id).where(
                ConsumableTransaction.appointment_id == payload.appointment_id,
                ConsumableTransaction.consumable_id == usage.consumable_id,
                ConsumableTransaction.type == TransactionType.STANDARD_USAGE,
            )
        )
        if previous is not None:
            continue
        stock = await locked_stock(
            session, payload.merchant_id, payload.store_id, usage.consumable_id
        )
        change = signed_change(TransactionType.STANDARD_USAGE, usage.quantity)
        await apply_stock_change(session, stock, change)
        transaction = ConsumableTransaction(
            id=new_id("MT"),
            merchant_id=payload.merchant_id,
            store_id=payload.store_id,
            consumable_id=usage.consumable_id,
            type=TransactionType.STANDARD_USAGE,
            quantity=usage.quantity,
            change=change,
            status=TransactionStatus.APPROVED,
            employee_id=payload.employee_id,
            service_id=payload.service_id,
            appointment_id=payload.appointment_id,
            operator_id="system",
            approver_id="system",
            approved_at=datetime.now(UTC),
        )
        session.add(transaction)
        created.append(transaction)
    await session.flush()
    return created
