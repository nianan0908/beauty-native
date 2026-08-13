from typing import Annotated

from fastapi import APIRouter, Query

from app.common.errors import ServiceUnavailableError
from app.common.schemas import HealthResponse, ReadyHealthResponse
from app.core.health import check_database, check_redis

router = APIRouter()


@router.get("/ping", response_model=HealthResponse, summary="API ping")
async def ping(
    echo: Annotated[str, Query(max_length=64)] = "pong",
) -> HealthResponse:
    return HealthResponse(status="ok", service="api", message=echo)


@router.get("/ready", response_model=ReadyHealthResponse, summary="Dependency readiness")
async def ready() -> ReadyHealthResponse:
    database_ok, redis_ok = await check_database(), await check_redis()
    services = {
        "database": "up" if database_ok else "down",
        "redis": "up" if redis_ok else "down",
    }
    if not all((database_ok, redis_ok)):
        raise ServiceUnavailableError(details={"services": services})
    return ReadyHealthResponse(status="ok", services=services)
