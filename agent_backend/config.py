import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic import BaseModel

# Load environment variables from .env in the project root
ROOT_DIR = Path(__file__).resolve().parent.parent
dotenv_path = ROOT_DIR / ".env"
if dotenv_path.exists():
    load_dotenv(dotenv_path)
else:
    load_dotenv()

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
    FORTYGUARD_BASE_URL: str = os.getenv("FORTYGUARD_BASE_URL", "https://api.fortyguard.com")
    
    # Gemini / Vertex AI credentials
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS Origins - Cloudflare Pages + Forma + Local Dev
    ALLOWED_ORIGINS: List[str] = [
        "https://*.pages.dev",
        "https://formaguard.pages.dev",
        "https://app.autodeskforma.com",
        "https://app.autodeskforma.eu",
        "https://*.autodeskforma.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
