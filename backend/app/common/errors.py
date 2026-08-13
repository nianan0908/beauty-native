from collections.abc import Mapping
from typing import Any


class AppError(Exception):
    def __init__(
        self,
        *,
        code: str,
        message: str,
        status_code: int,
        details: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = dict(details or {})


class ServiceUnavailableError(AppError):
    def __init__(self, *, details: Mapping[str, Any] | None = None) -> None:
        super().__init__(
            code="SERVICE_UNAVAILABLE",
            message="服务暂未就绪，请稍后重试。",
            status_code=503,
            details=details,
        )


class UnauthorizedError(AppError):
    def __init__(self, message: str = "登录状态无效或已过期。") -> None:
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=401,
        )


class ForbiddenError(AppError):
    def __init__(self, message: str = "当前账号没有执行此操作的权限。") -> None:
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=403,
        )


class TooManyRequestsError(AppError):
    def __init__(self, message: str = "尝试次数过多，请稍后再试。") -> None:
        super().__init__(
            code="TOO_MANY_REQUESTS",
            message=message,
            status_code=429,
        )


class NotFoundError(AppError):
    def __init__(self, message: str = "请求的资源不存在。") -> None:
        super().__init__(code="NOT_FOUND", message=message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(code="CONFLICT", message=message, status_code=409)
