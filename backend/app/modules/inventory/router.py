from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.modules.inventory.dependencies import ActorDependency
from app.modules.inventory.models import (
    Consumable,
    ConsumableStock,
    ConsumableTransaction,
    TransactionStatus,
    TransactionType,
    new_id,
)
from app.modules.inventory.schemas import (
    InventoryRequestCreate,
    RestockCreate,
    ServiceDeductionCreate,
    StockView,
    TransactionView,
)
from app.modules.inventory.service import (
    apply_stock_change,
    assert_store_scope,
    create_request,
    deduct_service_consumables,
    locked_stock,
    review_request,
)

router = APIRouter()
DbSession = Annotated[AsyncSession, Depends(get_db_session)]


@router.get("/stocks", response_model=list[StockView], summary="库存概览")
async def list_stocks(
    actor: ActorDependency,
    session: DbSession,
    store_id: Annotated[str | None, Query()] = None,
) -> list[StockView]:
    if actor.role != "owner" and store_id and store_id != actor.store_id:
        raise HTTPException(status_code=403, detail="不能查看其他门店库存")
    scope_store_id = store_id if actor.role == "owner" else actor.store_id
    statement = (
        select(ConsumableStock, Consumable)
        .join(Consumable, Consumable.id == ConsumableStock.consumable_id)
        .where(ConsumableStock.merchant_id == actor.merchant_id)
        .order_by(ConsumableStock.store_id, Consumable.name)
    )
    if scope_store_id:
        statement = statement.where(ConsumableStock.store_id == scope_store_id)
    rows = (await session.execute(statement)).all()
    return [
        StockView(
            consumable_id=item.id,
            name=item.name,
            category=item.category,
            unit=item.unit,
            unit_cost=item.unit_cost,
            store_id=stock.store_id,
            quantity=stock.quantity,
            safety_stock=stock.safety_stock,
        )
        for stock, item in rows
    ]


@router.get("/transactions", response_model=list[TransactionView], summary="库存流水")
async def list_transactions(
    actor: ActorDependency,
    session: DbSession,
    status: Annotated[TransactionStatus | None, Query()] = None,
) -> list[ConsumableTransaction]:
    statement = select(ConsumableTransaction).where(
        ConsumableTransaction.merchant_id == actor.merchant_id
    )
    if actor.role == "employee":
        statement = statement.where(ConsumableTransaction.employee_id == actor.id)
    elif actor.role == "manager":
        statement = statement.where(ConsumableTransaction.store_id == actor.store_id)
    if status:
        statement = statement.where(ConsumableTransaction.status == status)
    result = await session.scalars(
        statement.order_by(ConsumableTransaction.created_at.desc())
    )
    return list(result.all())


@router.post("/restocks", response_model=TransactionView, summary="耗材入库")
async def restock(
    payload: RestockCreate, actor: ActorDependency, session: DbSession
) -> ConsumableTransaction:
    if actor.role not in {"owner", "manager"}:
        raise HTTPException(status_code=403, detail="只有老板或店长可以入库")
    assert_store_scope(actor, actor.merchant_id, payload.store_id)
    async with session.begin():
        stock = await locked_stock(
            session, actor.merchant_id, payload.store_id, payload.consumable_id
        )
        await apply_stock_change(session, stock, payload.quantity)
        transaction = ConsumableTransaction(
            id=new_id("MT"),
            merchant_id=actor.merchant_id,
            store_id=payload.store_id,
            consumable_id=payload.consumable_id,
            type=TransactionType.RESTOCK,
            quantity=payload.quantity,
            change=payload.quantity,
            status=TransactionStatus.APPROVED,
            operator_id=actor.id,
            approver_id=actor.id,
        )
        session.add(transaction)
    return transaction


@router.post("/requests", response_model=TransactionView, summary="员工提交耗材申请")
async def submit_request(
    payload: InventoryRequestCreate, actor: ActorDependency, session: DbSession
) -> ConsumableTransaction:
    async with session.begin():
        return await create_request(session, actor, payload)


@router.post("/requests/{transaction_id}/approve", response_model=TransactionView)
async def approve_request(
    transaction_id: str, actor: ActorDependency, session: DbSession
) -> ConsumableTransaction:
    async with session.begin():
        return await review_request(session, actor, transaction_id, True)


@router.post("/requests/{transaction_id}/reject", response_model=TransactionView)
async def reject_request(
    transaction_id: str, actor: ActorDependency, session: DbSession
) -> ConsumableTransaction:
    async with session.begin():
        return await review_request(session, actor, transaction_id, False)


@router.post(
    "/service-completions",
    response_model=list[TransactionView],
    summary="服务完成后自动扣减标准耗材",
)
async def complete_service_inventory(
    payload: ServiceDeductionCreate, actor: ActorDependency, session: DbSession
) -> list[ConsumableTransaction]:
    assert_store_scope(actor, payload.merchant_id, payload.store_id)
    if actor.role == "employee" and actor.id != payload.employee_id:
        raise HTTPException(status_code=403, detail="员工只能完成本人的服务")
    async with session.begin():
        return await deduct_service_consumables(session, payload)
