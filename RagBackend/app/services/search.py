"""
Search utilities: RRF fusion, keyword search, Postgres chunk storage.
"""

import json
from typing import List, Optional, Dict, Any
from langchain_core.documents import Document
from sqlalchemy import text

from app.config import get_logger

logger = get_logger("askdoc.services.search")

try:
    from app.db.database import SessionLocal
    from app.db.models import DocumentChunk
except ImportError:
    SessionLocal = None
    DocumentChunk = None


def reciprocal_rank_fusion(vector_docs: List[Document], keyword_docs: List[Document], k: int = 60) -> List[Document]:
    """
    Combines dense vector similarity search and BM25 full-text keyword search results
    using Reciprocal Rank Fusion (RRF).
    RRF Score(d) = sum(1 / (k + rank(d)))
    """
    scores = {}
    doc_map = {}
    
    # Process vector search results
    for rank, doc in enumerate(vector_docs, start=1):
        key = doc.page_content.strip()
        doc_map[key] = doc
        scores[key] = scores.get(key, 0.0) + (1.0 / (k + rank))
        
    # Process keyword search results
    for rank, doc in enumerate(keyword_docs, start=1):
        key = doc.page_content.strip()
        if key not in doc_map:
            doc_map[key] = doc
        scores[key] = scores.get(key, 0.0) + (1.0 / (k + rank))
        
    # Sort candidate documents by RRF score descending
    sorted_keys = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
    return [doc_map[key] for key in sorted_keys]


def keyword_search(search_query: str, session_id: str = None, user_id: str = None, top_k: int = 10) -> List[Document]:
    """
    Full-text keyword search over Supabase Postgres document_chunks table using tsvector GIN index.
    """
    if SessionLocal is None:
        return []
    
    db = SessionLocal()
    try:
        sql = text("""
            SELECT content, title, metadata_json, session_id, user_id, chunk_index, total_chunks,
                   ts_rank(fts, websearch_to_tsquery('english', :query)) as rank
            FROM document_chunks
            WHERE (:session_id IS NULL OR session_id = :session_id)
              AND (:user_id IS NULL OR user_id = :user_id)
              AND fts @@ websearch_to_tsquery('english', :query)
            ORDER BY rank DESC
            LIMIT :limit
        """)
        results = db.execute(sql, {"query": search_query, "session_id": session_id, "user_id": user_id, "limit": top_k}).fetchall()
        
        docs = []
        for r in results:
            meta = {
                "source": r.title,
                "session_id": r.session_id,
                "user_id": r.user_id,
                "chunk_index": r.chunk_index,
                "total_chunks": r.total_chunks,
            }
            if r.metadata_json:
                try:
                    meta.update(json.loads(r.metadata_json))
                except Exception:
                    pass
            docs.append(Document(page_content=r.content, metadata=meta))
        return docs
    except Exception as e:
        logger.warning(f"Postgres keyword search warning: {e}")
        return []
    finally:
        db.close()


def store_chunks_in_postgres(docs: List[Document]):
    """
    Store document chunks into Supabase Postgres for BM25/FTS search.
    """
    if SessionLocal is None or DocumentChunk is None:
        return
    
    db = SessionLocal()
    try:
        db_chunks = []
        for doc in docs:
            meta = doc.metadata or {}
            db_chunk = DocumentChunk(
                session_id=meta.get("session_id"),
                user_id=meta.get("user_id"),
                title=meta.get("title") or meta.get("source", "Document"),
                content=doc.page_content,
                chunk_index=meta.get("chunk_index", 0),
                total_chunks=meta.get("total_chunks", 1),
                metadata_json=json.dumps(meta)
            )
            db_chunks.append(db_chunk)
        db.add_all(db_chunks)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error storing chunks in Postgres: {e}", exc_info=True)
    finally:
        db.close()


def delete_chunks_from_postgres(session_id: str):
    """
    Delete all document chunks for a session from Postgres.
    """
    if SessionLocal is None or DocumentChunk is None:
        return
    
    db = SessionLocal()
    try:
        db.query(DocumentChunk).filter(DocumentChunk.session_id == session_id).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting chunks from Postgres: {e}", exc_info=True)
    finally:
        db.close()
