from datetime import date

import pytest
from fastapi import HTTPException

from app.modules.redemption.models import CardStatus, CustomerCard, RedemptionOrder
from app.modules.redemption.schemas import RedemptionActor
from app.modules.redemption.service import assert_card_matches_order, assert_employee_order_scope


def order() -> RedemptionOrder:
    return RedemptionOrder(
        id="O1",
        merchant_id="T1",
        store_id="S1",
        customer_id="C1",
        service_id="SV1",
        employee_id="E1",
        customer_name="会员",
        service_name="护理",
        employee_name="员工",
    )


def card(**overrides: object) -> CustomerCard:
    values: dict[str, object] = {
        "id": "CC1",
        "merchant_id": "T1",
        "customer_id": "C1",
        "service_id": "SV1",
        "name": "护理次卡",
        "remaining_times": 2,
        "expires_at": date(2027, 1, 1),
        "status": CardStatus.ACTIVE,
    }
    values.update(overrides)
    return CustomerCard(**values)


def test_employee_can_only_redeem_own_service() -> None:
    assert_employee_order_scope(
        RedemptionActor(
            id="E1", role="employee", merchant_id="T1", store_id="S1"
        ),
        order(),
    )

    with pytest.raises(HTTPException) as error:
        assert_employee_order_scope(
            RedemptionActor(
                id="E2", role="employee", merchant_id="T1", store_id="S1"
            ),
            order(),
        )
    assert error.value.status_code == 403


def test_non_employee_cannot_use_employee_redemption() -> None:
    with pytest.raises(HTTPException) as error:
        assert_employee_order_scope(
            RedemptionActor(
                id="M1", role="manager", merchant_id="T1", store_id="S1"
            ),
            order(),
        )
    assert error.value.status_code == 403


@pytest.mark.parametrize(
    "invalid_card",
    [
        card(customer_id="C2"),
        card(service_id="SV2"),
        card(remaining_times=0),
        card(expires_at=date(2025, 1, 1)),
    ],
)
def test_card_must_match_customer_service_and_validity(invalid_card: CustomerCard) -> None:
    with pytest.raises(HTTPException) as error:
        assert_card_matches_order(invalid_card, order(), date(2026, 8, 14))
    assert error.value.status_code == 409


def test_matching_active_card_is_redeemable() -> None:
    assert_card_matches_order(card(), order(), date(2026, 8, 14))
