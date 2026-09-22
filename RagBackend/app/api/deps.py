"""
FastAPI dependency providers for RAGEngine instance and helper functions.
"""

from fastapi import HTTPException
from app.config import get_logger
from app.core.rag_engine import RAGEngine
from app.db.models import ChatSession
from app.services.storage import storage_manager
from app.api.schemas import SessionResponse

logger = get_logger("askdoc.api.deps")

# Global singleton RAGEngine initialized lazily
_rag_engine = None


def get_rag_engine() -> RAGEngine:
    global _rag_engine
    if _rag_engine is None:
        try:
            _rag_engine = RAGEngine()
        except Exception as e:
            logger.error(f"Failed to initialize RAGEngine: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"RAG Engine initialization failed: {str(e)}")
    return _rag_engine


def to_session_response(s: ChatSession) -> SessionResponse:
    file_url = None
    if s.file_path:
        file_url = storage_manager.get_signed_url(s.file_path)
    return SessionResponse(
        id=s.id,
        title=s.title,
        file_name=s.file_name,
        file_path=s.file_path,
        file_size=s.file_size,
        file_type=s.file_type,
        file_url=file_url,
        created_at=s.created_at.isoformat()
    )
