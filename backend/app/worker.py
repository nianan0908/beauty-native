"""Dramatiq worker entry point.

Business actors will be imported here as modules are implemented.
"""

from app.core.tasks import broker

__all__ = ["broker"]
