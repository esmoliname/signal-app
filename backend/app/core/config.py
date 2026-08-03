import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    LAST30DAYS_SKILL_PATH: str = "~/.agents/skills/last30days"
    DATABASE_URL: str = "sqlite+aiosqlite:///./signal_cache.db"
    CACHE_TTL_HOURS: int = 12
    TIMEOUT_SECONDS: int = 120

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: Union[List[str], str]) -> List[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @property
    def resolved_skill_path(self) -> str:
        return os.path.abspath(os.path.expanduser(self.LAST30DAYS_SKILL_PATH))

settings = Settings()
