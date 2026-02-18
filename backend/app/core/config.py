# @TASK P0-T0.3 - Backend configuration with Pydantic Settings
# @SPEC docs/planning/02-trd.md#backend-config
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/app"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Claude API
    ANTHROPIC_API_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # App
    APP_NAME: str = "AI System API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    model_config = {
        "env_file": "../.env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


settings = Settings()
