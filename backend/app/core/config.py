from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Dynamic Trading Dashboard"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/dashboard"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # OpenAI
    OPENAI_API_KEY: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: list = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
