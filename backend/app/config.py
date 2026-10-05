"""
Application configuration.

All environment-dependent configuration should be centralized here.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Strongly typed application configuration."""

    APP_NAME: str = "Almanac"
    APP_VERSION: str = "0.1.0"

    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    DATABASE_URL: str | None = None
    USER: str | None = None
    PASSWORD: str | None = None
    HOST: str | None = None
    PORT: str | int | None = None
    DBNAME: str | None = None

    @property
    def computed_database_url(self) -> str:
        """Return a valid async SQLAlchemy PostgreSQL connection string."""
        url = self.DATABASE_URL
        if not url and self.HOST and self.USER and self.PASSWORD:
            port = self.PORT or 6543
            dbname = self.DBNAME or "postgres"
            url = f"postgresql://{self.USER}:{self.PASSWORD}@{self.HOST}:{port}/{dbname}?sslmode=require"

        if not url:
            url = "postgresql+psycopg://postgres:postgres@localhost:5433/personal_cfo"

        # Normalize driver for psycopg3 async engine
        if url.startswith("postgresql+psycopg2://"):
            url = url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)

        return url

    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    SECRET_KEY: str = Field(default="dev_secret_key_must_be_at_least_32_characters_long_for_security", min_length=32)

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    LLM_API_KEY: str | None = None
    LLM_MODEL: str | None = None

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5678",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return [
            "http://localhost:3000",
            "http://localhost:5678",
        ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """
    Return a cached settings instance.

    Caching ensures configuration is parsed once rather than repeatedly
    reading and validating environment variables.
    """

    return Settings()


settings = get_settings()
