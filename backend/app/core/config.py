"""Application settings.

Everything that changes between development and production lives here and is
read from environment variables. Nothing secret is hard-coded.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL connection string, e.g.
    # postgresql+psycopg2://smartqueue:password@localhost:5432/smartqueue
    DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/smartqueue"

    # Secret used to sign JWTs. MUST be overridden in production.
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12 hours

    # Comma-separated list of allowed browser origins for CORS.
    FRONTEND_URL: str = "http://localhost:3000"

    ENVIRONMENT: str = "development"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_URL.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
