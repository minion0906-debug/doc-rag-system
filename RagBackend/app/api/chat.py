"""
Chat streaming, regenerate, and export endpoints.
Supports both authenticated users and anonymous/guest sessions.
Supports custom user Gemini API Key and Model ID (BYOK).
"""

import time
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import get_logger
from app.auth import get_current_user_id
from app.db.database import get_db
from app.db.models import ChatSession, ChatMessage
from app.middleware import rate_limiter, format_user_facing_error
from app.api.schemas import ChatRequest
from app.api.deps import get_rag_engine

logger = get_logger("askdoc.api.chat")
router = APIRouter(tags=["chat"])


@router.post("/sessions/{session_id}/chat")
async def chat(
    session_id: str, 
    request: ChatRequest, 
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    user_id: Optional[str] = Depends(get_current_user_id), 
    db: Session = Depends(get_db)
):
    # Rate limit check per user
    if not rate_limiter.is_allowed(user_id or "anon"):
        raise HTTPException(status_code=429, detail="Too many chat requests. Please slow down and try again shortly.")

    # Resolve effective Gemini API Key and Model
    effective_api_key = (request.api_key or x_gemini_api_key or "").strip()
    effective_model = (request.model_name or x_gemini_model or "").strip()

    # Verify session exists and belongs to user if authenticated
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Auto-generate title from first prompt if title is "New Chat"
    if session.title == "New Chat" and request.question:
        clean_title = request.question.strip().split("\n")[0][:35].strip()
        if len(request.question) > 35:
            clean_title += "..."
        if clean_title:
            session.title = clean_title

    # Free tier limit check: if no custom Gemini API Key, allow max 2 assistant messages in this session
    if not effective_api_key:
        assistant_count = db.query(ChatMessage).filter(
            ChatMessage.session_id == session_id,
            ChatMessage.role == "assistant"
        ).count()
        if assistant_count >= 2:
            raise HTTPException(
                status_code=402,
                detail="Free trial limit reached (2 messages). Please configure your own Gemini API Key in Settings to continue."
            )

    # Save user message (retained for frontend UI message history list)
    user_msg = ChatMessage(session_id=session_id, role="user", content=request.question)
    db.add(user_msg)
    db.commit()

    async def event_generator():
        start_time = time.time()
        logger.info(f"Started SSE chat stream for session {session_id} with model '{effective_model or 'default'}'")
        rag = await run_in_threadpool(get_rag_engine)

        full_answer = ""
        sources = []
        needs_clarification = False
        metrics_dict = None

        try:
            async for item in rag.chat_stream_graph(
                request.question, 
                session_id, 
                user_id=user_id,
                user_api_key=effective_api_key,
                user_model_name=effective_model
            ):
                if item.get("type") == "status":
                    yield f"data: {json.dumps(item)}\n\n"
                elif item.get("type") == "token":
                    full_answer += item.get("content", "")
                    yield f"data: {json.dumps(item)}\n\n"
                elif item.get("type") == "done":
                    full_answer = item.get("answer", full_answer)
                    sources = item.get("sources", [])
                    needs_clarification = item.get("needs_clarification", False)
                    metrics_dict = item.get("metrics")
                    yield f"data: {json.dumps(item)}\n\n"
                elif item.get("type") == "error":
                    yield f"data: {json.dumps(item)}\n\n"
        except Exception as e:
            logger.error(f"Error during chat stream execution: {e}", exc_info=True)
            user_error = format_user_facing_error(e, default_prefix="Failed to generate AI response")
            error_event = {"type": "error", "content": user_error}
            yield f"data: {json.dumps(error_event)}\n\n"

        duration = time.time() - start_time
        logger.info(f"Completed chat stream for session {session_id} in {duration:.2f}s")

        # Save assistant message in DB once streaming completes
        if full_answer:
            try:
                if isinstance(full_answer, list):
                    clean_content = "".join([str(item) if isinstance(item, str) else item.get("text", "") if isinstance(item, dict) else str(item) for item in full_answer])
                elif not isinstance(full_answer, str):
                    clean_content = str(full_answer)
                else:
                    clean_content = full_answer

                # Ensure metrics_dict has duration and token counts populated
                if not metrics_dict:
                    prompt_tokens = max(1, len(request.question) // 4)
                    completion_tokens = max(1, len(clean_content) // 4)
                    metrics_dict = {
                        "time": round(duration, 2),
                        "total_tokens": prompt_tokens + completion_tokens
                    }
                elif isinstance(metrics_dict, dict):
                    metrics_dict["time"] = round(duration, 2)
                    if not metrics_dict.get("total_tokens"):
                        prompt_tokens = max(1, len(request.question) // 4)
                        completion_tokens = max(1, len(clean_content) // 4)
                        metrics_dict["total_tokens"] = prompt_tokens + completion_tokens

                bot_msg = ChatMessage(
                    session_id=session_id,
                    role="assistant",
                    content=clean_content,
                    sources=json.dumps(sources) if sources else None,
                    metrics=json.dumps(metrics_dict) if metrics_dict else None
                )
                db.add(bot_msg)
                db.commit()
            except Exception as e:
                logger.error(f"Error saving assistant message: {e}", exc_info=True)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/sessions/{session_id}/regenerate")
async def regenerate_message(
    session_id: str,
    request: Optional[ChatRequest] = None,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    user_id: Optional[str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Regenerates the answer for the last user prompt in this session.
    """
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Find last user message
    last_user_msg = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "user"
    ).order_by(ChatMessage.id.desc()).first()

    if not last_user_msg:
        raise HTTPException(status_code=400, detail="No user message found in this session to regenerate.")

    # Delete any assistant message following it
    db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "assistant",
        ChatMessage.id > last_user_msg.id
    ).delete(synchronize_session=False)
    db.commit()

    # Invalidate query cache for this session to ensure fresh generation
    rag = await run_in_threadpool(get_rag_engine)
    rag.query_cache.invalidate_session(session_id)

    effective_api_key = ((request.api_key if request else None) or x_gemini_api_key or "").strip()
    effective_model = ((request.model_name if request else None) or x_gemini_model or "").strip()

    # Re-invoke chat endpoint with the user's prompt
    return await chat(
        session_id, 
        ChatRequest(question=last_user_msg.content, api_key=effective_api_key, model_name=effective_model), 
        x_gemini_api_key=x_gemini_api_key,
        x_gemini_model=x_gemini_model,
        user_id=user_id, 
        db=db
    )


@router.get("/sessions/{session_id}/export")
async def export_session_chat(
    session_id: str,
    format: str = "markdown",
    user_id: Optional[str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Exports conversation history with sources and timestamps as a Markdown report.
    """
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

    export_lines = [
        f"# AskDoc Chat Export: {session.title or 'Conversation'}",
        f"**Session ID:** `{session_id}`",
        f"**Date:** {session.created_at.strftime('%Y-%m-%d %H:%M:%S UTC') if session.created_at else 'N/A'}",
        f"**Attached Document:** {session.file_name or 'None'}",
        "\n---\n"
    ]

    for msg in messages:
        role_title = "### 👤 User" if msg.role == "user" else "### 🤖 AskDoc Assistant"
        timestamp = msg.created_at.strftime('%H:%M:%S') if msg.created_at else ""
        export_lines.append(f"{role_title} *({timestamp})*\n\n{msg.content}\n")

        if msg.sources:
            try:
                sources_list = json.loads(msg.sources)
                if sources_list:
                    export_lines.append("\n**Sources Cited:**")
                    for s in sources_list:
                        src_title = s.get("title") or s.get("source", "Document")
                        page_info = f" (Page {s['page']})" if s.get("page") else ""
                        snippet = s.get("content", "").replace("\n", " ").strip()[:200]
                        export_lines.append(f"- **[{s.get('id', 'Source')}] {src_title}{page_info}:** *\"{snippet}...\"*")
                    export_lines.append("")
            except Exception:
                pass
        export_lines.append("\n---\n")

    return {
        "session_id": session_id,
        "title": session.title,
        "format": format,
        "content": "\n".join(export_lines)
    }
