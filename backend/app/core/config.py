from functools import lru_cache
from typing import Literal

from pydantic import AnyHttpUrl, Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="QIGUANG_",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "美天美业 API"
    environment: Literal["development", "test", "staging", "production"] = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://qiguang:qiguang@localhost:5432/qiguang"
    redis_url: str = "redis://localhost:6379/0"
    cors_origins: list[AnyHttpUrl] = Field(
        default_factory=lambda: [AnyHttpUrl("http://localhost:5173")]
    )
    log_level: str = "INFO"
    jwt_secret: SecretStr = SecretStr("development-only-change-before-production")
    jwt_algorithm: Literal["HS256"] = "HS256"
    access_token_minutes: int = Field(default=15, ge=5, le=60)
    refresh_token_days: int = Field(default=14, ge=1, le=90)
    refresh_cookie_name: str = "qiguang_refresh_token"
    refresh_cookie_secure: bool = False
    login_rate_limit: int = Field(default=10, ge=1, le=100)
    login_rate_window_seconds: int = Field(default=60, ge=10, le=3600)

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if (
            self.environment == "production"
            and self.jwt_secret.get_secret_value() == "development-only-change-before-production"
        ):
            raise ValueError("production requires a non-default QIGUANG_JWT_SECRET")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
