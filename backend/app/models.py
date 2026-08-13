"""Import every SQLAlchemy model so Alembic sees complete metadata."""

from app.modules.auth.models import Permission, RefreshToken, Role, User
from app.modules.inventory.models import (
    Consumable,
    ConsumableStock,
    ConsumableTransaction,
    ServiceConsumableUsage,
)
from app.modules.redemption.models import CardRedemption, CustomerCard, RedemptionOrder
from app.modules.store.models import Store
from app.modules.tenant.models import Plan, Tenant

__all__ = [
    "Consumable",
    "ConsumableStock",
    "ConsumableTransaction",
    "CardRedemption",
    "CustomerCard",
    "Permission",
    "Plan",
    "RefreshToken",
    "RedemptionOrder",
    "Role",
    "ServiceConsumableUsage",
    "Store",
    "Tenant",
    "User",
]
