from collections.abc import Awaitable
from typing import cast

from sqlalchemy import text

from app.core.database import engine
from app.core.redis import redis_client


async def check_database() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
    except Exception:
        return False
    return True


async def check_redis() -> bool:
    try:
        ping = cast(Awaitable[bool], redis_client.ping())
        return await ping
    except Exception:
        return False
