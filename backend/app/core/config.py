# @TASK P0-T0.3 - Backend configuration with Pydantic Settings
# @SPEC docs/planning/02-trd.md#backend-config
import os
from typing import Optional
from pydantic_settings import BaseSettings


def _get_env_file() -> str:
    """Determine which .env file to load based on APP_ENV.

    Priority:
    1. APP_ENV environment variable
    2. Default to development

    Returns:
        Path to the appropriate .env file
    """
    app_env = os.getenv("APP_ENV", "development")

    if app_env == "production":
        return ".env.production"
    elif app_env == "docker":
        # Docker containers get env vars from docker-compose
        return "../.env.docker"
    else:
        # Default to development
        return ".env.development"


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Supports multiple environments via APP_ENV:
    - development: SQLite + permissive CORS (default)
    - production: PostgreSQL + strict CORS
    - docker: Docker Compose managed services
    """

    # Environment
    APP_ENV: str = "development"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./app.db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OpenAI API
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # App
    APP_NAME: str = "AI System API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.APP_ENV == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.APP_ENV == "production"

    @property
    def is_docker(self) -> bool:
        """Check if running in Docker environment."""
        return self.APP_ENV == "docker"

    @property
    def cors_allow_credentials(self) -> bool:
        """Allow credentials in CORS based on environment."""
        return self.APP_ENV in ["development", "docker"]

    def validate_production_config(self) -> None:
        """Validate configuration for production deployment.

        Raises:
            RuntimeError: If production configuration is invalid.
        """
        if self.is_production:
            # Check SECRET_KEY is not default
            if self.SECRET_KEY == "change-me-in-production":
                raise RuntimeError(
                    "SECRET_KEY must be changed in production environment. "
                    "Set SECRET_KEY environment variable to a secure random value."
                )

            # Check CORS is not wildcard
            if "*" in self.CORS_ORIGINS:
                raise RuntimeError(
                    "CORS_ORIGINS cannot contain wildcard (*) in production. "
                    "Specify explicit origins in CORS_ORIGINS environment variable."
                )

    model_config = {
        "env_file": _get_env_file(),
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
settings.validate_production_config()
