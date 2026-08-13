from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.modules.inventory.models import TransactionType
from app.modules.inventory.schemas import Actor
from app.modules.inventory.service import assert_store_scope, signed_change


def test_stock_changes_have_correct_direction() -> None:
    assert signed_change(TransactionType.RESTOCK, Decimal("10")) == Decimal("10")
    assert signed_change(TransactionType.RETURN, Decimal("2")) == Decimal("2")
    assert signed_change(TransactionType.STANDARD_USAGE, Decimal("3")) == Decimal("-3")
    assert signed_change(TransactionType.EXTRA_PICK, Decimal("3")) == Decimal("-3")
    assert signed_change(TransactionType.DAMAGE, Decimal("3")) == Decimal("-3")


def test_owner_can_access_all_merchant_stores() -> None:
    actor = Actor(id="U1", role="owner", merchant_id="T1")
    assert_store_scope(actor, "T1", "S2")


def test_manager_cannot_access_another_store() -> None:
    actor = Actor(id="U2", role="manager", merchant_id="T1", store_id="S1")
    with pytest.raises(HTTPException) as error:
        assert_store_scope(actor, "T1", "S2")
    assert error.value.status_code == 403


def test_actor_cannot_cross_tenant_boundary() -> None:
    actor = Actor(id="U1", role="owner", merchant_id="T1")
    with pytest.raises(HTTPException) as error:
        assert_store_scope(actor, "T2", "S1")
    assert error.value.status_code == 403
