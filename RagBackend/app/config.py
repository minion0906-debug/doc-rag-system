"""
Centralized configuration module.
All environment variables, constants, and logging setup live here.
Every other module imports from app.config instead of calling os.getenv directly.
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv()

# ─── Logging ───────────────────────────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)

# ─── API Keys ──────────────────────────────────────────────────────────────────
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "djrag")

# ─── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv("DATABASE_URL")

# ─── Supabase ──────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    os.getenv("NEXT_PUBLIC_SUPABASE_URL", "https://dklgzlkrykmbwkudkexl.supabase.co")
).rstrip("/")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv("SUPABASE_KEY", os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ""))
)
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
STORAGE_BUCKET_NAME = "chat-documents"

# ─── Gemini Model & Pricing ───────────────────────────────────────────────────
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip() or "gemini-3.6-flash"
GEMINI_INPUT_COST_PER_1M = float(os.getenv("GEMINI_INPUT_COST_PER_1M", "0.075"))
GEMINI_OUTPUT_COST_PER_1M = float(os.getenv("GEMINI_OUTPUT_COST_PER_1M", "0.30"))

# ─── Application Settings ─────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://askdoc.dilip.website,https://www.askdoc.dilip.website,https://askdoc-backend.vercel.app").split(",")
    if origin.strip()
]

MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
RATE_LIMIT_RPM = int(os.getenv("RATE_LIMIT_RPM", "45"))
