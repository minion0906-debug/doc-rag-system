"""
Session management endpoints (CRUD, list, messages, delete).
Supports both authenticated users and anonymous/guest sessions.
"""

import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.config import get_logger
from app.auth import get_current_user_id
from app.db.database import get_db
from app.db.models import ChatSession, ChatMessage
from app.services.storage import storage_manager
from app.middleware import format_user_facing_error
from app.api.schemas import CreateSessionRequest, SessionResponse, UpdateSessionRequest, MessageResponse
from app.api.deps import get_rag_engine, to_session_response

logger = get_logger("askdoc.api.sessions")
router = APIRouter(tags=["sessions"])


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest, 
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    # Free tier limit: without custom Gemini API key, max 1 session allowed
    if not (x_gemini_api_key or "").strip() and user_id:
        existing_count = db.query(ChatSession).filter(ChatSession.user_id == user_id).count()
        if existing_count >= 1:
            raise HTTPException(
                status_code=402,
                detail="Free demo allows 1 chat session. Please configure your own Gemini API Key in Settings for unlimited sessions."
            )

    session_id = str(uuid.uuid4())
    db_session = ChatSession(id=session_id, title=request.title, user_id=user_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    logger.info(f"Created new session {db_session.id} ('{db_session.title}') for user {user_id or 'guest'}")
    return to_session_response(db_session)


@router.get("/sessions", response_model=List[SessionResponse])
async def list_sessions(
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    else:
        query = query.filter(ChatSession.user_id.is_(None))
    sessions = query.order_by(ChatSession.created_at.desc()).all()
    return [to_session_response(s) for s in sessions]


@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: str,
    limit: int = 100,
    offset: int = 0,
    before_id: Optional[int] = None,
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msg_query = db.query(ChatMessage).filter(ChatMessage.session_id == session_id)
    if before_id is not None:
        msg_query = msg_query.filter(ChatMessage.id < before_id)

    messages = msg_query.order_by(ChatMessage.created_at.asc()).offset(offset).limit(limit).all()
    
    # Deduplicate identical message contents per session
    deduped_messages = []
    seen_signatures = set()
    for m in messages:
        sig = (m.role, (m.content or "").strip())
        if sig in seen_signatures:
            continue
        seen_signatures.add(sig)
        deduped_messages.append(m)

    return [
        MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            sources=json.loads(m.sources) if m.sources else None,
            metrics=json.loads(m.metrics) if getattr(m, "metrics", None) else None,
            created_at=m.created_at.isoformat()
        ) for m in deduped_messages
    ]


@router.patch("/sessions/{session_id}", response_model=SessionResponse)
async def update_session_title(
    session_id: str,
    request: UpdateSessionRequest,
    user_id: Optional[str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    clean_title = request.title.strip()
    if clean_title:
        session.title = clean_title
        db.commit()
        db.refresh(session)
        logger.info(f"Updated session {session_id} title to '{clean_title}'")

    return to_session_response(session)


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str, 
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    # Verify session exists and belongs to user if authenticated
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        # Tier 1: Delete all vectors from Pinecone
        rag = await run_in_threadpool(get_rag_engine)
        await run_in_threadpool(rag.delete_vectors, session_id)
        
        # Tier 2: Delete all files from Supabase Storage bucket
        await run_in_threadpool(storage_manager.delete_session_files, session_id)
        
        # Tier 3: Delete from PostgreSQL Database (cascade handles messages, document_chunks, evaluations)
        db.delete(session)
        db.commit()
        
        logger.info(f"Completely purged session {session_id} across Pinecone, Supabase Storage, and PostgreSQL for user {user_id or 'guest'}")
        return {"message": "Session and all associated data completely deleted"}
    except Exception as e:
        logger.error(f"Failed to delete session {session_id}: {e}", exc_info=True)
        user_error = format_user_facing_error(e, default_prefix="Failed to delete session")
        raise HTTPException(status_code=500, detail=user_error)


@router.delete("/sessions")
async def delete_all_sessions(
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    try:
        query = db.query(ChatSession)
        if user_id:
            query = query.filter(ChatSession.user_id == user_id)
        else:
            query = query.filter(ChatSession.user_id.is_(None))
        sessions = query.all()
        session_ids = [s.id for s in sessions]
        rag = await run_in_threadpool(get_rag_engine)
        
        # Tier 1: Delete all vectors from Pinecone across matching sessions
        for session in sessions:
            try:
                await run_in_threadpool(rag.delete_vectors, session.id)
            except Exception as e:
                logger.error(f"Error deleting vectors for session {session.id}: {e}", exc_info=True)

        # Tier 2: Bulk delete all files from Supabase Storage across matching sessions
        if session_ids:
            try:
                await run_in_threadpool(storage_manager.delete_multiple_sessions_files, session_ids)
            except Exception as e:
                logger.error(f"Error deleting storage files for sessions: {e}", exc_info=True)

        # Tier 3: Delete matching sessions from PostgreSQL Database
        delete_query = db.query(ChatSession)
        if user_id:
            delete_query = delete_query.filter(ChatSession.user_id == user_id)
        else:
            delete_query = delete_query.filter(ChatSession.user_id.is_(None))
        delete_query.delete(synchronize_session=False)
        db.commit()
        
        logger.info(f"Completely purged all {len(sessions)} sessions across Pinecone, Supabase Storage, and PostgreSQL for user {user_id or 'guest'}")
        return {"message": "All sessions and associated files completely deleted"}
    except Exception as e:
        logger.error(f"Failed to delete all sessions for user {user_id or 'guest'}: {e}", exc_info=True)
        user_error = format_user_facing_error(e, default_prefix="Failed to delete sessions")
        raise HTTPException(status_code=500, detail=user_error)
