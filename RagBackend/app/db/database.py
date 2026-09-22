"""
Database engine, session factory, and base model.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.config import DATABASE_URL, get_logger

logger = get_logger("askdoc.database")

# Supabase / Postgres DATABASE_URL configuration
if not DATABASE_URL or "your_" in DATABASE_URL:
    logger.warning("DATABASE_URL is not configured with a valid connection string. Database features will fail.")
    engine = None
    SessionLocal = None
else:
    _db_url = DATABASE_URL
    # Ensure postgresql:// prefix for SQLAlchemy compatibility
    if _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)

    is_sqlite = "sqlite" in _db_url
    engine_kwargs = {}
    if is_sqlite:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        # Postgres connection options
        engine_kwargs["pool_pre_ping"] = True

    engine = create_engine(_db_url, **engine_kwargs)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base = declarative_base()

def get_db():
    if SessionLocal is None:
        raise Exception("Database not configured. Please set DATABASE_URL.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
