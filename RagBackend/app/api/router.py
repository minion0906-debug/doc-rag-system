"""
FastAPI application factory and route aggregator.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import ALLOWED_ORIGINS, get_logger
from app.db.database import engine, Base
from app.api.sessions import router as sessions_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.evaluations import router as evaluations_router

logger = get_logger("askdoc.api")


def init_db():
    """Create tables & ensure necessary columns exist."""
    if engine is not None:
        Base.metadata.create_all(bind=engine)
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE messages ADD COLUMN IF NOT EXISTS metrics TEXT;"))
                conn.commit()
        except Exception as e:
            logger.warning(f"Could not execute migration for metrics column: {e}")


def create_app() -> FastAPI:
    """FastAPI application factory."""
    try:
        init_db()
    except Exception as e:
        logger.warning(f"Database init warning on startup: {e}")

    app = FastAPI(title="AskDoc API")

    # CORS Setup - Specific origins from env + regex for Vercel deployment preview and prod URLs
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_origin_regex=r"^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|.*\.vercel\.app|.*\.website)$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    async def root():
        return {"message": "DJ RAG Backend is running!"}

    @app.get("/health")
    async def health_check():
        return {"status": "ok", "version": "v2-inmemory-parsers"}

    # Include all modular sub-routers
    app.include_router(sessions_router)
    app.include_router(chat_router)
    app.include_router(documents_router)
    app.include_router(evaluations_router)

    return app
