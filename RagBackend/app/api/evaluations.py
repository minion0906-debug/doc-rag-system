"""
Evaluation endpoints using LLM-as-a-judge.
Supports both authenticated users and anonymous/guest sessions.
Supports custom user Gemini API Key and Model ID (BYOK).
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
from app.db.models import ChatSession, Evaluation
from app.middleware import format_user_facing_error
from app.api.schemas import EvaluationItemResponse
from app.api.deps import get_rag_engine

logger = get_logger("askdoc.api.evaluations")
router = APIRouter(tags=["evaluations"])


@router.post("/sessions/{session_id}/evaluate", response_model=List[EvaluationItemResponse])
async def evaluate_session(
    session_id: str,
    x_gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-API-Key"),
    x_gemini_model: Optional[str] = Header(None, alias="X-Gemini-Model"),
    user_id: Optional[str] = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(ChatSession).filter(ChatSession.id == session_id)
    if user_id:
        query = query.filter(ChatSession.user_id == user_id)
    session = query.first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        rag = await run_in_threadpool(get_rag_engine)
        eval_results = await run_in_threadpool(
            rag.evaluate_session, 
            session_id, 
            user_id=user_id,
            user_api_key=x_gemini_api_key,
            user_model_name=x_gemini_model
        )

        # Clear old evaluations for this session
        db.query(Evaluation).filter(Evaluation.session_id == session_id).delete(synchronize_session=False)

        saved_evals = []
        for res in eval_results:
            eval_record = Evaluation(
                id=str(uuid.uuid4()),
                session_id=session_id,
                user_id=user_id,
                question=res["question"],
                rag_answer=res["rag_answer"],
                relevance_score=res["relevance_score"],
                accuracy_score=res["accuracy_score"],
                completeness_score=res["completeness_score"],
                overall_score=res["overall_score"],
                feedback=res["feedback"],
                metrics_json=json.dumps(res.get("metrics", {}))
            )
            db.add(eval_record)
            saved_evals.append(eval_record)

        db.commit()
        logger.info(f"Evaluated session {session_id}: {len(saved_evals)} benchmarks processed")

        return [
            EvaluationItemResponse(
                id=e.id,
                session_id=e.session_id,
                question=e.question,
                rag_answer=e.rag_answer,
                relevance_score=e.relevance_score,
                accuracy_score=e.accuracy_score,
                completeness_score=e.completeness_score,
                overall_score=e.overall_score,
                feedback=e.feedback,
                metrics=json.loads(e.metrics_json) if e.metrics_json else None,
                created_at=e.created_at.isoformat()
            ) for e in saved_evals
        ]
    except Exception as e:
        logger.error(f"Failed to evaluate session {session_id}: {e}", exc_info=True)
        user_error = format_user_facing_error(e, default_prefix="Evaluation failed")
        raise HTTPException(status_code=500, detail=user_error)


@router.get("/sessions/{session_id}/evaluations", response_model=List[EvaluationItemResponse])
async def get_session_evaluations(
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

    evals = db.query(Evaluation).filter(Evaluation.session_id == session_id).order_by(Evaluation.created_at.desc()).all()
    return [
        EvaluationItemResponse(
            id=e.id,
            session_id=e.session_id,
            question=e.question,
            rag_answer=e.rag_answer,
            relevance_score=e.relevance_score,
            accuracy_score=e.accuracy_score,
            completeness_score=e.completeness_score,
            overall_score=e.overall_score,
            feedback=e.feedback,
            metrics=json.loads(e.metrics_json) if e.metrics_json else None,
            created_at=e.created_at.isoformat()
        ) for e in evals
    ]
