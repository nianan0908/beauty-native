from collections.abc import Awaitable, Callable

from httpx import AsyncClient
from pytest import MonkeyPatch

from app.api import system


async def test_liveness_returns_request_id(client: AsyncClient) -> None:
    response = await client.get("/health/live", headers={"X-Request-ID": "test-request-1"})

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "api", "message": None}
    assert response.headers["X-Request-ID"] == "test-request-1"


async def test_readiness_reports_healthy_dependencies(
    client: AsyncClient, monkeypatch: MonkeyPatch
) -> None:
    async def healthy() -> bool:
        return True

    monkeypatch.setattr(system, "check_database", healthy)
    monkeypatch.setattr(system, "check_redis", healthy)

    response = await client.get("/api/v1/system/ready")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "services": {"database": "up", "redis": "up"},
    }


async def test_readiness_uses_standard_error_shape(
    client: AsyncClient, monkeypatch: MonkeyPatch
) -> None:
    checks: list[Callable[[], Awaitable[bool]]] = []

    async def database_down() -> bool:
        return False

    async def redis_up() -> bool:
        return True

    checks.extend((database_down, redis_up))
    monkeypatch.setattr(system, "check_database", checks[0])
    monkeypatch.setattr(system, "check_redis", checks[1])

    response = await client.get(
        "/api/v1/system/ready", headers={"X-Request-ID": "readiness-test"}
    )

    assert response.status_code == 503
    assert response.json() == {
        "code": "SERVICE_UNAVAILABLE",
        "message": "服务暂未就绪，请稍后重试。",
        "requestId": "readiness-test",
        "details": {"services": {"database": "down", "redis": "up"}},
    }


async def test_validation_and_not_found_use_standard_errors(client: AsyncClient) -> None:
    validation = await client.get("/api/v1/system/ping", params={"echo": "x" * 65})
    missing = await client.get("/api/v1/not-found")

    assert validation.status_code == 422
    assert validation.json()["code"] == "VALIDATION_ERROR"
    assert validation.json()["requestId"] == validation.headers["X-Request-ID"]
    assert missing.status_code == 404
    assert missing.json()["code"] == "NOT_FOUND"
    assert missing.json()["requestId"] == missing.headers["X-Request-ID"]
