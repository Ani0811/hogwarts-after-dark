"""
Hogwarts After Dark — Companion Service
Application settings loaded from environment variables / .env file.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import AnyUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # === Service binding ===
    companion_host: str = Field(default="127.0.0.1")
    companion_port: int = Field(default=8765, ge=1024, le=65535)

    # === Allowed origins for CORS ===
    # Production: add the exact GitHub Pages URL here
    companion_allowed_origins: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    # === AI Provider ===
    ai_provider_base_url: str = Field(default="http://127.0.0.1:1234/v1")
    ai_request_timeout_seconds: float = Field(default=60.0, ge=5.0, le=300.0)
    ai_max_retries: int = Field(default=2, ge=0, le=5)
    ai_max_output_tokens: int = Field(default=1024, ge=64, le=8192)
    ai_max_input_chars: int = Field(default=4096, ge=64, le=32768)
    ai_max_history_turns: int = Field(default=10, ge=2, le=40)

    # === Game data paths ===
    game_data_path: Path = Field(default=Path("../../game-data"))
    saves_path: Path = Field(default=Path("./saves"))

    # === Logging ===
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    log_json: bool = False

    # === Security ===
    max_request_body_bytes: int = Field(default=65536, ge=1024, le=10_485_760)
    rate_limit_per_minute: int = Field(default=30, ge=1, le=600)

    # === Mode ===
    demo_mode: bool = False  # Force demo mode regardless of AI availability

    @field_validator("companion_host")
    @classmethod
    def host_must_be_loopback(cls, v: str) -> str:
        """Enforce that the companion never binds to a public interface."""
        allowed = {"127.0.0.1", "localhost", "::1"}
        if v not in allowed:
            raise ValueError(
                f"companion_host must be a loopback address (got '{v}'). "
                "The companion must not be exposed to the network."
            )
        return v

    @field_validator("game_data_path", "saves_path", mode="before")
    @classmethod
    def resolve_path(cls, v: str | Path) -> Path:
        return Path(v)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings. Call once per process."""
    return Settings()

