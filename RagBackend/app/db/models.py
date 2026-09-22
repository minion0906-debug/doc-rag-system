"""
SQLAlchemy ORM models for the AskDoc application.
"""

import uuid
from sqlalchemy import Column, Integer, BigInteger, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime


class ChatSession(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True, index=True)  # UUID
    title = Column(String, default="New Chat")
    file_name = Column(String, nullable=True)  # Store original filename for SEO
    file_path = Column(String, nullable=True)  # Supabase Storage path: {session_id}/{filename}
    file_size = Column(BigInteger, nullable=True)  # File size in bytes
    file_type = Column(String, nullable=True)  # MIME type: application/pdf, etc.
    user_id = Column(String, nullable=True, index=True)  # UUID for auth
    created_at = Column(DateTime, default=datetime.utcnow)
    
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    sources = Column(Text, nullable=True)  # JSON string of sources
    metrics = Column(Text, nullable=True)  # JSON string of execution metrics (time, tokens, cost, etc.)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    user_id = Column(String, nullable=True, index=True)
    title = Column(String)
    content = Column(Text)
    chunk_index = Column(Integer)
    total_chunks = Column(Integer)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    user_id = Column(String, nullable=True, index=True)
    question = Column(Text, nullable=False)
    rag_answer = Column(Text, nullable=True)
    relevance_score = Column(Float, nullable=True)
    accuracy_score = Column(Float, nullable=True)
    completeness_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    metrics_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
