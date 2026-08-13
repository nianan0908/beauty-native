from fastapi import APIRouter

from app.api.system import router as system_router
from app.modules.auth.router import router as auth_router
from app.modules.inventory.router import router as inventory_router
from app.modules.redemption.router import router as redemption_router

api_router = APIRouter()
api_router.include_router(system_router, prefix="/system", tags=["system"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["inventory"])
api_router.include_router(redemption_router, prefix="/redemptions", tags=["redemptions"])
