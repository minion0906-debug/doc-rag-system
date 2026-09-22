# AskDoc Backend — Enterprise Document Intelligence & Hybrid RAG Platform

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com/langgraph)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Pinecone](https://img.shields.io/badge/Pinecone-Serverless_Vector_DB-000000?style=for-the-badge&logo=pinecone&logoColor=white)](https://www.pinecone.io/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Storage-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**High-performance, agentic Retrieval-Augmented Generation (RAG) backend orchestrating multi-format document ingestion, dense vector search, Reciprocal Rank Fusion, FlashRank reranking, and dynamic Bring-Your-Own-Key (BYOK) LLM execution.**

[Live Web Application](https://askdoc.dilip.website) • [GitHub Repository](https://github.com/DJ-InfinityCoder/RAG) • [Author Portfolio](https://dilipmeghwal.in)

</div>

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
  - [1. Agentic LangGraph Workflow](#1-agentic-langgraph-workflow)
  - [2. Document Ingestion Pipeline](#2-document-ingestion-pipeline)
- [Key Features](#key-features)
- [Repository Structure](#repository-structure)
- [Core Subsystems](#core-subsystems)
  - [1. Structure-Aware Document Processors](#1-structure-aware-document-processors)
  - [2. Hybrid Search & Reciprocal Rank Fusion (RRF)](#2-hybrid-search--reciprocal-rank-fusion-rrf)
  - [3. FlashRank Neural Reranking](#3-flashrank-neural-reranking)
  - [4. LangGraph Multi-Node Quality Loop](#4-langgraph-multi-node-quality-loop)
  - [5. Checkpointer & Memory Persistence](#5-checkpointer--memory-persistence)
  - [6. High-Performance Query Response Cache](#6-high-performance-query-response-cache)
  - [7. LLM-as-a-Judge Evaluation Suite](#7-llm-as-a-judge-evaluation-suite)
  - [8. Bring-Your-Own-Key (BYOK) & Free Tier Quotas](#8-bring-your-own-key-byok--free-tier-quotas)
- [API Reference](#api-reference)
  - [Chat & Streaming](#chat--streaming)
  - [Document Management](#document-management)
  - [Session Lifecycle](#session-lifecycle)
  - [Evaluation Benchmarks](#evaluation-benchmarks)
- [Environment Configuration](#environment-configuration)
- [Installation & Local Setup](#installation--local-setup)
- [Automated Testing](#automated-testing)
- [Production Deployment](#production-deployment)
- [Author & Credits](#author--credits)

---

## Overview

**AskDoc Backend** is an enterprise-grade async FastAPI service built to transform unstructured documents (PDFs with complex multi-column tables, Word documents, PowerPoint presentations, Excel spreadsheets, and CSVs) into accurate, cited conversational intelligence.

It replaces standard naive RAG pipelines with a **10-node cyclic LangGraph state machine**, pairing **Pinecone Inference embeddings (`llama-text-embed-v2`, 1024 dimensions)** with **PostgreSQL Full-Text Search**, **Reciprocal Rank Fusion (RRF)**, and **FlashRank reranking** to eliminate hallucinations and maximize factual precision.

---

## System Architecture

### 1. Agentic LangGraph Workflow

```mermaid
graph TD
    Start([User Prompt]) --> Classify[Node: Classify Intent]
    
    Classify -->|Chitchat / Smalltalk| DirectAns[Node: Generate Direct Answer]
    Classify -->|Needs Retrieval| Rephrase[Node: Rephrase & Expand Query]
    
    Rephrase --> Retrieve[Node: Hybrid Retrieve Vector + Keyword]
    Retrieve --> RRF[Service: Reciprocal Rank Fusion]
    RRF --> Rerank[Node: FlashRank Neural Reranker]
    
    Rerank --> Grade[Node: Grade Retrieval Quality]
    
    Grade -->|Context Missing & Retries < 2| Rewrite[Node: Rewrite Query Strategy]
    Rewrite --> Retrieve
    
    Grade -->|Context Relevant| CheckAmbiguity[Node: Check Query Ambiguity]
    
    CheckAmbiguity -->|Ambiguous Reference| Clarify[Node: Generate Clarifying Question]
    CheckAmbiguity -->|Clear Query| Generate[Node: Generate Cited Answer]
    
    Generate --> Output([SSE Token Stream + Sources + Metrics])
    DirectAns --> Output
    Clarify --> Output
```

### 2. Document Ingestion Pipeline

```mermaid
graph LR
    Upload[File Upload] --> Validate[Size & Extension Validator]
    Validate --> Storage[Supabase Storage Bucket]
    Validate --> Parser[Structure-Aware Parsers<br/>PDF/DOCX/PPTX/XLSX/CSV]
    
    Parser --> Markdown[Tabular Markdown Formatter]
    Markdown --> Splitter[Recursive Splitter<br/>1800 char / 300 overlap]
    
    Splitter --> Embed[Pinecone Inference API<br/>llama-text-embed-v2 1024d]
    Splitter --> PostgresFTS[Postgres document_chunks<br/>Full-Text Search Index]
    
    Embed --> Pinecone[(Pinecone Vector DB)]
```

---

## Key Features

- **Multi-Format Structured Extraction**: Preserves tables, merged headers, cell coordinates, and slide notes across PDF, DOCX, PPTX, XLSX, CSV, and TXT files.
- **Hybrid Retrieval (RRF)**: Merges dense cosine vector search with Postgres lexical full-text search using reciprocal rank fusion ($k=60$).
- **FlashRank Neural Reranker**: Reranks top candidates down to the 8 highest-relevance contexts without added cloud latency.
- **Agentic Quality Loop**: LangGraph auto-evaluates context adequacy; if missing, it reformulates query keywords and retries up to 2 times.
- **Multi-Turn Session Memory**: Uses `PostgresSaver` connection pooling (or `MemorySaver`) for conversation continuity.
- **Sub-Millisecond Query Cache**: In-memory TTL cache with automated instant invalidation on file upload or session deletion.
- **LLM-as-a-Judge Evaluation**: Automated tri-factor scoring (Relevance, Accuracy, Completeness) with feedback.
- **Bring-Your-Own-Key (BYOK)**: Users can supply their own Google Gemini API key and choose any model (`gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-1.5-flash`, `gemini-1.5-pro`).
- **Free Tier Guardrails**: Server defaults provide 1 session, 1 document, and 2 messages before requiring a custom API key.
- **Cloud Storage & Persistence**: Supabase Storage for raw documents with pre-signed download URLs, and Supabase PostgreSQL with cascade deletion.

---

## Repository Structure

```text
RagBackend/
├── app/
│   ├── api/                           # REST API layer & schemas
│   │   ├── chat.py                    # SSE streaming, regenerate, markdown export
│   │   ├── deps.py                    # FastAPI dependency injection (RAGEngine, user ID)
│   │   ├── documents.py               # File uploads, text ingestion, pre-signed download URLs
│   │   ├── evaluations.py             # LLM-as-a-judge session evaluation endpoints
│   │   ├── router.py                  # APIRouter aggregator & factory
│   │   ├── schemas.py                 # Pydantic request and response schemas
│   │   └── sessions.py                # Chat session CRUD, message history, cascade deletion
│   ├── core/                          # RAG pipeline orchestration & LangGraph state machine
│   │   ├── graph.py                   # StateGraph definition and conditional edge wiring
│   │   ├── graph_nodes.py             # 10 execution nodes (intent, retrieval, grading, answering)
│   │   ├── query_cache.py             # In-memory TTL semantic query cache
│   │   └── rag_engine.py              # Central engine, dynamic LLM factory, checkpointer setup
│   ├── db/                            # Database connection & models
│   │   ├── database.py                # SQLAlchemy engine & session factory
│   │   └── models.py                  # PostgreSQL ORM models (sessions, messages, chunks, evals)
│   ├── document_processors/           # Structure-aware file extractors
│   │   ├── base.py                    # Base processor & markdown table formatter
│   │   ├── csv_parser.py              # CSV chunking preserving headers
│   │   ├── docx.py                    # python-docx structured heading & paragraph extraction
│   │   ├── pdf.py                     # pdfplumber table extraction + OCR fallback
│   │   ├── pptx.py                    # python-pptx slide layout & notes extraction
│   │   └── xlsx.py                    # openpyxl multi-sheet tabular markdown parser
│   ├── services/                      # Cloud integrations & search services
│   │   ├── embeddings.py              # Pinecone Inference Embeddings (llama-text-embed-v2)
│   │   ├── search.py                  # Reciprocal Rank Fusion & Postgres FTS
│   │   └── storage.py                 # Supabase Storage bucket manager
│   ├── auth.py                        # Supabase JWT extraction & guest session handling
│   ├── config.py                      # Centralized environment variables, logging & cost constants
│   ├── middleware.py                  # Sliding-window rate limiter & exception formatter
│   └── resilience.py                  # Tenacity retry decorators for transient API errors
├── tests/                             # Automated test suite
│   ├── __init__.py
│   └── test_rag_pipeline.py           # Unit tests for models, cache, RRF, and rate limiter
├── main.py                            # ASGI entrypoint (uvicorn main:app)
├── requirements.txt                   # Production Python dependencies
├── .env.example                       # Template environment variables
└── README.md                          # Comprehensive documentation
```

---

## Core Subsystems

### 1. Structure-Aware Document Processors
Located in `app/document_processors/`:
- **PDF (`pdf.py`)**: Uses `pdfplumber` to extract tables and format them as Markdown with headers, column separation, and row fidelity. Falls back to `pytesseract` OCR if pages contain purely scanned image content.
- **Excel (`xlsx.py`)**: Traverses all sheets via `openpyxl`, preserves sheet names as markdown headers, and chunks tabular grids without truncating row headers.
- **Word (`docx.py`)**: Identifies heading hierarchies (`Heading 1`, `Heading 2`) and nested tables.
- **PowerPoint (`pptx.py`)**: Extracts slide text by shapes and includes speaker notes.
- **Chunking Strategy**: Uses `RecursiveCharacterTextSplitter` with `chunk_size=1800` and `chunk_overlap=300`, utilizing structured markdown header separators (`\n# `, `\n## `, `\n### `) so table cells and syllabus scheme rows remain contiguous.

### 2. Hybrid Search & Reciprocal Rank Fusion (RRF)
Located in `app/services/search.py`:
- **Dense Vector Search**: Queries Pinecone Serverless with cosine similarity.
- **Lexical Search**: Queries `document_chunks` table in Postgres using `to_tsvector` and `plainto_tsquery`.
- **RRF Formula**:
  $$\text{Score}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$
  Where $k=60$ and $r_m(d)$ is the document's rank in retrieval method $m$.

### 3. FlashRank Neural Reranking
Located in `app/core/graph_nodes.py`:
- Fused documents pass through a local `FlashRank` Ranker instance.
- Top 8 reranked contexts are formatted into numbered `Source [N]:` blocks with complete metadata (filename, page numbers, chunk index) for inline citation generation (`[1]`, `[2]`).

### 4. LangGraph Multi-Node Quality Loop
Located in `app/core/graph.py` and `app/core/graph_nodes.py`:
- **Intent Classification**: Distinguishes greetings/small talk from factual document queries.
- **Retrieval Grader**: Validates if retrieved contexts contain adequate facts for the query.
- **Query Rewriter**: If confidence is low or relevance check fails, expands search terms and loops back (max 2 retries).
- **Ambiguity Detector**: Prompts the user with a focused clarifying question if the query refers to unspecified document entities.

### 5. Checkpointer & Memory Persistence
Located in `app/core/rag_engine.py`:
- Integrates `PostgresSaver` with psycopg connection pooling against Supabase PostgreSQL.
- Maintains conversation history across turns keyed by `session_id`. Falls back cleanly to `MemorySaver` if database checkpointer is unavailable.

### 6. High-Performance Query Response Cache
Located in `app/core/query_cache.py`:
- Thread-safe TTL cache storing full answers, citations, and metrics.
- Sub-millisecond response time for repeated queries.
- Invalidation hooks automatically purge session cache on file uploads or deletions.

### 7. LLM-as-a-Judge Evaluation Suite
Located in `app/api/evaluations.py`:
- Uses structured Gemini prompts to grade RAG responses across:
  1. **Relevance Score (0-100)**: Directness in addressing the prompt.
  2. **Accuracy Score (0-100)**: Faithfulness to context passages without hallucinations.
  3. **Completeness Score (0-100)**: Exhaustiveness of coverage.
  4. **Overall Score**: Weighted composite average.
  5. **Qualitative Feedback**: Actionable critique of strengths and omissions.

### 8. Bring-Your-Own-Key (BYOK) & Free Tier Quotas
Located in `app/api/chat.py` and `app/core/rag_engine.py`:
- Clients can send custom `X-Gemini-API-Key` and `X-Gemini-Model` HTTP headers.
- `RAGEngine.get_llm(api_key, model_name)` dynamically instantiates the LLM per request.
- **Free Tier Policy**: When using the server key, users are restricted to **1 session, 1 document, and 2 chat messages**. Beyond this, endpoints return `402 Payment Required` prompting the user to supply their own Gemini key.

---

## API Reference

### Chat & Streaming

#### `POST /sessions/{session_id}/chat`
Streams assistant answers via Server-Sent Events (SSE).

**Headers:**
- `Authorization: Bearer <supabase_jwt>` *(optional)*
- `X-Gemini-API-Key: <api_key>` *(optional)*
- `X-Gemini-Model: <model_id>` *(optional)*

**Request Body:**
```json
{
  "question": "What are the core technical requirements for the role?",
  "api_key": "AIzaSy...",
  "model_name": "gemini-3.6-flash"
}
```

**SSE Event Types:**
- `{"type": "status", "label": "Searching documents..."}`
- `{"type": "token", "content": "The"}`
- `{"type": "done", "answer": "...", "sources": [...], "metrics": {...}}`
- `{"type": "error", "content": "..."}`

#### `POST /sessions/{session_id}/regenerate`
Regenerates the last assistant response with updated model parameters or cache bypass.

#### `GET /sessions/{session_id}/export?format=markdown`
Exports entire session history with timestamps and cited sources as a Markdown document.

---

### Document Management

#### `POST /sessions/{session_id}/upload`
Uploads and indexes a file into Supabase Storage and Pinecone.

**Form Data:**
- `file`: Binary file (`.pdf`, `.docx`, `.pptx`, `.xlsx`, `.csv`, `.txt`)

**Response:**
```json
{
  "message": "Successfully processed SDE_JD.pdf",
  "chunks": 12,
  "title": "SDE_JD.pdf",
  "file_name": "SDE_JD.pdf",
  "file_size": 245120,
  "file_url": "https://...supabase.co/storage/v1/object/sign/..."
}
```

#### `POST /sessions/{session_id}/ingest_text`
Directly chunks and indexes raw text into the vector database.

#### `GET /sessions/{session_id}/document`
Retrieves document metadata and a signed download URL for the attached session file.

---

### Session Lifecycle

- `POST /sessions`: Create a new chat session.
- `GET /sessions`: List all user sessions ordered by `created_at DESC`.
- `GET /sessions/{session_id}/messages`: Retrieve message history with sources and metrics.
- `PATCH /sessions/{session_id}`: Rename session title.
- `DELETE /sessions/{session_id}`: Cascade delete session, Supabase storage files, and Pinecone vectors.
- `DELETE /sessions`: Delete all sessions and vectors for the authenticated user.

---

### Evaluation Benchmarks

#### `POST /sessions/{session_id}/evaluate`
Runs the LLM-as-a-judge benchmark across session documents.

**Response:**
```json
[
  {
    "id": "7b8e5c1d-...",
    "session_id": "...",
    "question": "What are the main topics discussed?",
    "rag_answer": "...",
    "relevance_score": 95.0,
    "accuracy_score": 92.0,
    "completeness_score": 88.0,
    "overall_score": 91.7,
    "feedback": "Comprehensive and faithful to source documents with clear citations.",
    "metrics": { "time": 1.42, "total_tokens": 820 },
    "created_at": "2026-08-22T01:00:00Z"
  }
]
```

---

## Environment Configuration

Create a `.env` file in `RagBackend/` with the following variables:

```env
# Google Gemini AI
GOOGLE_API_KEY=your_default_gemini_api_key
GEMINI_MODEL=gemini-3.6-flash

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=djrag

# Supabase PostgreSQL (IPv4 Session Pooler recommended)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres

# Supabase Cloud Storage & Auth
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_or_service_key

# Security & CORS
ALLOWED_ORIGINS=http://localhost:3000,https://askdoc.dilip.website
RATE_LIMIT_RPM=60
MAX_UPLOAD_MB=25

# Observability (Optional)
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key
LANGCHAIN_PROJECT=askdoc-backend
```

---

## Installation & Local Setup

### Prerequisites
- Python 3.10 or higher
- PostgreSQL instance (or Supabase project)
- Pinecone account & index

### 1. Clone & Set Up Virtual Environment
```bash
git clone https://github.com/DJ-InfinityCoder/RagBackend.git
cd RagBackend

python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Run Development Server
```bash
uvicorn main:app --reload --port 8000
```

- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

## Automated Testing

The backend includes a comprehensive unit test suite covering database models, query caching, Reciprocal Rank Fusion, and rate limiting:

```bash
# Run all unit tests
python -m unittest tests.test_rag_pipeline

# Or run discovery
python -m unittest discover -s tests
```

---

## Production Deployment

### Production Uvicorn Run
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers --forwarded-allow-ips='*'
```

### Docker Deployment
```dockerfile
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Author & Credits

**Dilip Meghwal**
- **Website**: [https://dilipmeghwal.in](https://dilipmeghwal.in)
- **LinkedIn**: [linkedin.com/in/dilipmeghwal13](https://www.linkedin.com/in/dilipmeghwal13/)
- **GitHub**: [@DJ-InfinityCoder](https://github.com/DJ-InfinityCoder)
- **Contact**: [contact@dilip.website](mailto:contact@dilip.website)

---

<div align="center">
  <sub>Built by Dilip Meghwal • AskDoc Enterprise RAG Platform</sub>
</div>
