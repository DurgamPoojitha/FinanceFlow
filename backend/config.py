"""
Application Configuration using Pydantic Settings.

Reads from environment variables and .env file.
Provides type-safe, validated configuration for the entire application.
"""

import os
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration class.
    All values can be overridden via environment variables or a .env file.
    """

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application metadata
    app_name: str = "FinanceFlow BI API"
    app_version: str = "2.0.0"
    environment: str = "development"

    # Database
    database_url: str = "sqlite:///./database/finance.db"

    # Security
    secret_key: str = "dev-insecure-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS – stored as comma-separated string, parsed into list
    frontend_url: str = "http://localhost:5173"

    @property
    def allowed_origins(self) -> List[str]:
        """Parse comma-separated FRONTEND_URL into a list of allowed origins."""
        return [origin.strip() for origin in self.frontend_url.split(",") if origin.strip()]

    # Default admin credentials (only used on first DB initialization)
    admin_email: str = "admin@financeflow.com"
    admin_password: str = "admin123"

    # ETL Schedule
    etl_cron_hour: int = 2
    etl_cron_minute: int = 0

    # Default budget fallback (USD)
    default_budget: float = 3000.0

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings instance.
    Use this everywhere to avoid re-reading files on each request.
    """
    return Settings()
