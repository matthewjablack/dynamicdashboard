from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


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

    # API Keys
    TWITTER_API_KEY: str
    FINNHUB_API_KEY: str
    FRED_API_KEY: str

    # JWT Settings
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Apify
    APIFY_API_TOKEN: str
    APIFY_USER_ID: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
