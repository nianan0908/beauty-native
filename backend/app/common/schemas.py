from typing import Any, Literal

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    code: str
    message: str
    request_id: str = Field(alias="requestId")
    details: Any = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    message: str | None = None


class ReadyHealthResponse(BaseModel):
    status: Literal["ok"]
    services: dict[str, Literal["up", "down"]]
