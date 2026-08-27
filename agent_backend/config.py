import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Load environment variables from .env in the project root
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()


def _parse_origins(raw: str) -> List[str]:
    """Parse a comma-separated ALLOWED_ORIGINS env var into exact origin strings."""
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    # Starlette CORSMiddleware does not expand wildcards in allow_origins;
    # use allow_origin_regex for *.pages.dev / *.autodeskforma.* instead.
    return [
        origin
        for origin in origins
        if origin != "*" and "*" not in origin
    ]


_DEFAULT_ORIGINS = ",".join(
    [
        "https://formaguard.pages.dev",
        "https://app.autodeskforma.com",
        "https://app.autodeskforma.eu",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]
)


class Settings(BaseModel):
    """Configuration settings for FormaGuard Agent Backend."""

    PROJECT_NAME: str = "FormaGuard AI Agent Backend"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Environment & Port configuration
    PORT: int = int(os.getenv("PORT", "8080"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    WORKERS: int = int(os.getenv("WEB_CONCURRENCY", "1"))
    TIMEOUT_SECONDS: int = int(os.getenv("TIMEOUT_SECONDS", "300"))

    # FortyGuard Credentials & Base URL
    FORTYGUARD_API_KEY: str = os.getenv("FORTYGUARD_API_KEY", "")
    FORTYGUARD_BASE_URL: str = os.getenv(
        "FORTYGUARD_BASE_URL", "https://api.fortyguard.com"
    )

    # Gemini / Vertex AI credentials
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Exact CORS origins (env-driven). Wildcard hosts are handled via regex in main.py.
    ALLOWED_ORIGINS: List[str] = Field(
        default_factory=lambda: _parse_origins(
            os.getenv("ALLOWED_ORIGINS", _DEFAULT_ORIGINS)
        )
    )

    # Matches Cloudflare Pages preview/prod + Autodesk Forma iframe hosts
    CORS_ORIGIN_REGEX: str = os.getenv(
        "CORS_ORIGIN_REGEX",
        r"https://.*\.pages\.dev|https://.*\.autodeskforma\.(com|eu)|https://.*\.web\.app|https://.*\.firebaseapp\.com",
    )


settings = Settings()
