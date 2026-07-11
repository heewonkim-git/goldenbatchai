"""Runtime configuration loaded from environment (.env at repo root)."""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Load repo-root .env (backend/ is one level below the root).
REPO_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(REPO_ROOT / ".env")


def _flag(name: str, default: str = "0") -> bool:
    return os.getenv(name, default).strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    # Anthropic / MSAT
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    msat_model: str = os.getenv("MSAT_MODEL", "claude-opus-4-8")

    # Runtime
    seed_mode: bool = _flag("SEED_MODE", "1")
    time_budget_s: int = int(os.getenv("TIME_BUDGET_S", "120"))
    automl_framework: str = os.getenv("AUTOML_FRAMEWORK", "autogluon")

    # Server
    host: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    port: int = int(os.getenv("BACKEND_PORT", "8000"))
    cors_origins: list[str] = [
        o.strip()
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ]

    # Paths
    repo_root: Path = REPO_ROOT
    data_dir: Path = REPO_ROOT / "data"
    kb_dir: Path = REPO_ROOT / "knowledge_base"
    artifacts_dir: Path = REPO_ROOT / "backend" / "artifacts"

    @property
    def has_api_key(self) -> bool:
        return bool(self.anthropic_api_key and self.anthropic_api_key.startswith("sk-"))


settings = Settings()
settings.artifacts_dir.mkdir(parents=True, exist_ok=True)
