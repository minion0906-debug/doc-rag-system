"""
Pydantic schema definitions for API request and response bodies.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


class SessionResponse(BaseModel):
    id: str
    title: str
    file_name: Optional[str] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_type: Optional[str] = None
    file_url: Optional[str] = None
    created_at: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: Optional[List[dict]] = None
    metrics: Optional[dict] = None
    created_at: str


class ChatRequest(BaseModel):
    question: str
    api_key: Optional[str] = None
    model_name: Optional[str] = None


class UpdateSessionRequest(BaseModel):
    title: str


class IngestTextRequest(BaseModel):
    text: str
    title: str = "Pasted Text"


class EvaluationItemResponse(BaseModel):
    id: str
    session_id: str
    question: str
    rag_answer: Optional[str] = None
    relevance_score: Optional[float] = None
    accuracy_score: Optional[float] = None
    completeness_score: Optional[float] = None
    overall_score: Optional[float] = None
    feedback: Optional[str] = None
    metrics: Optional[dict] = None
    created_at: str
