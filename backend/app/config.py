from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    database_url: str | None = None
    supabase_url: str | None = None
    supabase_publishable_key: str | None = None
    cors_origins: str = "http://localhost:3000"
    supabase_auth_timeout_seconds: float = 5.0
    channel_link_ttl_seconds: int = 900
    channel_processing_lease_seconds: int = 120
    channel_provider_timeout_seconds: float = 10.0
    channel_max_audio_bytes: int = 8_000_000
    telegram_bot_token: str | None = None
    telegram_webhook_secret: str | None = None
    whatsapp_access_token: str | None = None
    whatsapp_app_secret: str | None = None
    whatsapp_verify_token: str | None = None
    whatsapp_phone_number_id: str | None = None
    whatsapp_graph_api_version: str | None = None
    gemini_api_key: str | None = None
    gemini_audio_model: str | None = None

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
