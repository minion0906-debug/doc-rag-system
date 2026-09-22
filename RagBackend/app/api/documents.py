"""
Document upload, text ingestion, and document retrieval endpoints.
Supports both authenticated users and anonymous/guest sessions.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Header
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.orm import Session

from app.config import MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, get_logger
from app.auth import get_current_user_id
from app.db.database import get_db
from app.db.models import ChatSession, ChatMessage
from app.services.storage import storage_manager
from app.middleware import format_user_facing_error
from app.api.schemas import IngestTextRequest
from app.api.deps import get_rag_engine

logger = get_logger("askdoc.api.documents")
router = APIRouter(tags=["documents"])


@router.get("/sessions/{session_id}/document")
async def get_session_document(
    session_id: str,
    user_id: Optional[str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session.file_path:
        raise HTTPException(status_code=404, detail="No document attached to this session")

    signed_url = storage_manager.get_signed_url(session.file_path, expires_in=7200)
    return {
        "file_name": session.file_name,
        "file_path": session.file_path,
        "file_size": session.file_size,
        "file_type": session.file_type,
        "download_url": signed_url,
        "session_id": session_id
    }


@router.post("/sessions/{session_id}/ingest_text")
async def ingest_text(
    session_id: str, 
    request: IngestTextRequest, 
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Free tier limit: without custom Gemini API key, max 1 document allowed
    if not (x_gemini_api_key or "").strip() and session.file_name:
        raise HTTPException(
            status_code=402,
            detail="Free demo allows 1 document. Please configure your own Gemini API Key in Settings for unlimited documents."
        )
        
    try:
        rag = await run_in_threadpool(get_rag_engine)
        num_chunks = await run_in_threadpool(rag.ingest_text, request.text, request.title, session_id, user_id)
        
        # Update session title if it's "New Chat"
        if session.title == "New Chat":
            session.title = request.title

        # Add text ingestion confirmation message
        doc_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=f"**Indexed Text:** \"{request.title}\"\n\nIndexed **{num_chunks} chunks**. Ready for questions."
        )
        db.add(doc_msg)
        db.commit()
        
        logger.info(f"Ingested text '{request.title}' ({num_chunks} chunks) for session {session_id}")
        return {"message": f"Successfully ingested text", "chunks": num_chunks, "title": session.title}
    except Exception as e:
        logger.error(f"Failed to ingest text for session {session_id}: {e}", exc_info=True)
        user_error = format_user_facing_error(e, default_prefix="Failed to ingest text")
        raise HTTPException(status_code=500, detail=user_error)


@router.post("/sessions/{session_id}/upload")
async def upload_document(
    session_id: str, 
    file: UploadFile = File(...), 
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Free tier limit: without custom Gemini API key, max 1 document allowed
    if not (x_gemini_api_key or "").strip() and session.file_name:
        raise HTTPException(
            status_code=402,
            detail="Free demo allows 1 document. Please configure your own Gemini API Key in Settings to upload unlimited documents."
        )

    if not file.filename.lower().endswith(('.pdf', '.docx', '.xlsx', '.csv', '.pptx', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, PPTX, Excel, CSV, and TXT files are supported")
    
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        logger.warning(f"File upload '{file.filename}' rejected: {len(content)} bytes exceeds limit {MAX_UPLOAD_BYTES} bytes")
        raise HTTPException(
            status_code=413, 
            detail=f"File '{file.filename}' exceeds maximum allowed size limit of {MAX_UPLOAD_MB}MB."
        )

    try:
        # Step 1: Upload raw binary to Supabase Storage
        storage_info = storage_manager.upload_file(session_id, file.filename, content)
        
        # Step 2: Index in vector database and full-text search
        rag = await run_in_threadpool(get_rag_engine)
        num_chunks = await run_in_threadpool(rag.process_file, content, file.filename, session_id, user_id)

        # Step 3: Persist document metadata in Postgres session record
        session.title = file.filename
        session.file_name = file.filename
        session.file_path = storage_info.get("file_path")
        session.file_size = storage_info.get("file_size")
        session.file_type = storage_info.get("file_type")

        # Step 4: Add document indexing confirmation message to chat history with direct download/view link
        doc_url = storage_info.get("storage_url") or storage_manager.get_signed_url(session.file_path)
        doc_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=f"**Uploaded Document:** [{file.filename}]({doc_url})\n\nStored in Supabase Storage and indexed **{num_chunks} chunks**. The document is ready for questions."
        )
        db.add(doc_msg)
        db.commit()
        db.refresh(session)
        
        logger.info(f"Processed uploaded file '{file.filename}' ({num_chunks} chunks, {storage_info.get('file_size')} bytes) for session {session_id}")
        return {
            "message": f"Successfully processed {file.filename}", 
            "chunks": num_chunks,
            "title": session.title,
            "file_name": session.file_name,
            "file_path": session.file_path,
            "file_size": session.file_size,
            "file_type": session.file_type,
            "file_url": doc_url
        }
    except Exception as e:
        import traceback
        tb_str = traceback.format_exc()
        logger.error(f"Failed to process uploaded file '{file.filename}' for session {session_id}: {e}\n{tb_str}")
        user_error = format_user_facing_error(e, default_prefix="Failed to process uploaded file")
        raise HTTPException(status_code=500, detail=user_error)
