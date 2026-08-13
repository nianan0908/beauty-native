import asyncio

from app.core.database import session_factory
from app.modules.auth.seed import seed_demo_data


async def main() -> None:
    async with session_factory() as session:
        await seed_demo_data(session)


if __name__ == "__main__":
    asyncio.run(main())
