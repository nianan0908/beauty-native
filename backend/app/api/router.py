from fastapi import APIRouter

from app.api.system import router as system_router
from app.modules.auth.router import router as auth_router
from app.modules.inventory.router import router as inventory_router
from app.modules.redemption.router import router as redemption_router
from app.modules.schedule.router import router as schedule_router
from app.modules.service.router import router as service_router
from app.modules.staff.router import router as staff_router
from app.modules.store.router import router as store_router

api_router = APIRouter()
api_router.include_router(system_router, prefix="/system", tags=["system"])
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(inventory_router, prefix="/inventory", tags=["inventory"])
api_router.include_router(redemption_router, prefix="/redemptions", tags=["redemptions"])
api_router.include_router(store_router, prefix="/stores", tags=["stores"])
api_router.include_router(staff_router, prefix="/staff", tags=["staff"])
api_router.include_router(service_router, prefix="/services", tags=["services"])
api_router.include_router(schedule_router, prefix="/schedules", tags=["schedules"])
