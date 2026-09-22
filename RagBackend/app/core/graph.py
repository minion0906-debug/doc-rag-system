"""
LangGraph StateGraph definition and builder.
"""

from typing import List, Optional, Dict, Any, TypedDict
from langchain_core.documents import Document
from langgraph.graph import StateGraph, START, END

from app.core.graph_nodes import (
    create_node_classify_intent,
    create_node_generate_direct_answer,
    create_node_rephrase_query,
    create_node_retrieve,
    create_node_rerank,
    create_node_grade_retrieval,
    create_node_rewrite_query,
    create_node_check_ambiguity,
    create_node_generate_clarifying_question,
    create_node_generate_answer,
    route_intent,
    route_retrieval_quality,
    route_ambiguity,
)


class GraphState(TypedDict):
    question: str
    search_query: str
    session_id: Optional[str]
    user_id: Optional[str]
    chat_history: List[Any]
    intent: str
    retrieved_docs: List[Document]
    reranked_docs: List[Document]
    context_text: str
    sources: List[Dict[str, Any]]
    answer: str
    metrics: Dict[str, Any]
    retry_count: int
    relevance_verdict: str
    rewritten_query: Optional[str]
    low_confidence: bool
    is_ambiguous: bool
    needs_clarification: bool


def build_rag_graph(engine):
    """
    Constructs the LangGraph StateGraph workflow for the RAG pipeline.
    """
    workflow = StateGraph(GraphState)

    # Create node functions with engine closure
    node_classify_intent = create_node_classify_intent(engine)
    node_generate_direct_answer = create_node_generate_direct_answer(engine)
    node_rephrase_query = create_node_rephrase_query(engine)
    node_retrieve = create_node_retrieve(engine)
    node_rerank = create_node_rerank(engine)
    node_grade_retrieval = create_node_grade_retrieval(engine)
    node_rewrite_query = create_node_rewrite_query(engine)
    node_check_ambiguity = create_node_check_ambiguity(engine)
    node_generate_clarifying_question = create_node_generate_clarifying_question(engine)
    node_generate_answer = create_node_generate_answer(engine)

    # Register nodes
    workflow.add_node("classify_intent", node_classify_intent)
    workflow.add_node("generate_direct_answer", node_generate_direct_answer)
    workflow.add_node("rephrase_query", node_rephrase_query)
    workflow.add_node("retrieve", node_retrieve)
    workflow.add_node("rerank", node_rerank)
    workflow.add_node("grade_retrieval", node_grade_retrieval)
    workflow.add_node("rewrite_query", node_rewrite_query)
    workflow.add_node("check_ambiguity", node_check_ambiguity)
    workflow.add_node("generate_clarifying_question", node_generate_clarifying_question)
    workflow.add_node("generate_answer", node_generate_answer)

    # Wire edges
    workflow.add_edge(START, "classify_intent")
    workflow.add_conditional_edges(
        "classify_intent",
        route_intent,
        {
            "generate_direct_answer": "generate_direct_answer",
            "rephrase_query": "rephrase_query"
        }
    )
    workflow.add_edge("generate_direct_answer", END)

    workflow.add_edge("rephrase_query", "retrieve")
    workflow.add_edge("retrieve", "rerank")
    workflow.add_edge("rerank", "grade_retrieval")
    
    workflow.add_conditional_edges(
        "grade_retrieval",
        route_retrieval_quality,
        {
            "rewrite_query": "rewrite_query",
            "check_ambiguity": "check_ambiguity"
        }
    )
    
    workflow.add_edge("rewrite_query", "retrieve")
    
    workflow.add_conditional_edges(
        "check_ambiguity",
        route_ambiguity,
        {
            "generate_clarifying_question": "generate_clarifying_question",
            "generate_answer": "generate_answer"
        }
    )

    workflow.add_edge("generate_clarifying_question", END)
    workflow.add_edge("generate_answer", END)

    # Store references to node functions directly on the engine for use in chat_stream
    engine._node_rephrase_query = node_rephrase_query
    engine._node_retrieve = node_retrieve
    engine._node_rerank = node_rerank
    engine._node_grade_retrieval = node_grade_retrieval
    engine._node_rewrite_query = node_rewrite_query
    engine._node_check_ambiguity = node_check_ambiguity

    return workflow
