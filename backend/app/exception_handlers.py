from typing import Any

import structlog
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from app.common.errors import AppError
from app.common.schemas import ErrorResponse
from app.middleware import current_request_id

logger = structlog.get_logger(__name__)


def error_response(
    *, status_code: int, code: str, message: str, details: Any = None
) -> JSONResponse:
    payload = ErrorResponse(
        code=code,
        message=message,
        requestId=current_request_id(),
        details=details or {},
    )
    return JSONResponse(status_code=status_code, content=jsonable_encoder(payload, by_alias=True))


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="请求参数不符合要求。",
        details={"errors": jsonable_encoder(exc.errors())},
    )


async def http_error_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
    message = "请求的资源不存在。" if exc.status_code == 404 else str(exc.detail)
    return error_response(
        status_code=exc.status_code,
        code="NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR",
        message=message,
    )


async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception(
        "unhandled_exception",
        method=request.method,
        path=request.url.path,
        error_type=type(exc).__name__,
    )
    return error_response(
        status_code=500,
        code="INTERNAL_SERVER_ERROR",
        message="服务器暂时无法处理该请求。",
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, http_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unexpected_error_handler)
