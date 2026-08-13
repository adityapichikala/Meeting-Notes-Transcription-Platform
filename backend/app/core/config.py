"""
Application configuration using pydantic-settings.
All values can be overridden via environment variables or a .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ─────────────────────────────────────────────────────────────
    # On Render: set DATABASE_URL to the persistent disk path e.g. sqlite:////data/meetingmind.db
    DATABASE_URL: str = "sqlite:///./meetingmind.db"

    # ── CORS ─────────────────────────────────────────────────────────────────
    # On Render: set CORS_ORIGINS to your Vercel frontend URL e.g. https://meetingmind.vercel.app
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── App metadata ─────────────────────────────────────────────────────────
    APP_NAME: str = "MeetingMind API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # ── LLM Settings ─────────────────────────────────────────────────────────
    # LLM_PROVIDER: "mock" | "openai" | "anthropic"
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: str | None = None

    # ── Seeding ──────────────────────────────────────────────────────────────
    # Set SEED_ON_BOOT=true on first deploy to populate sample data
    SEED_ON_BOOT: bool = False


settings = Settings()
