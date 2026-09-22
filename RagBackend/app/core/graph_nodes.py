"""
LangGraph node functions for the RAG pipeline.
Each function takes (state, engine) or uses a closure pattern.
"""

import os
import time
from typing import Dict, Any, List, TYPE_CHECKING

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
try:
    from flashrank import RerankRequest
except ImportError:
    RerankRequest = None

from app.config import GEMINI_INPUT_COST_PER_1M, GEMINI_OUTPUT_COST_PER_1M, get_logger
from app.services.search import reciprocal_rank_fusion

if TYPE_CHECKING:
    from app.core.rag_engine import RAGEngine

logger = get_logger("askdoc.core.graph_nodes")


def create_node_classify_intent(engine: "RAGEngine"):
    def node_classify_intent(state) -> Dict[str, Any]:
        q_raw = state["question"].strip()
        q_lower = q_raw.lower()
        
        chitchat_phrases = [
            "hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening",
            "thanks", "thank you", "bye", "goodbye", "who are you", "what can you do", "help",
            "how are you", "nice to meet you"
        ]
        
        words = q_lower.split()
        if len(words) <= 4 and any(kw == q_lower or kw in words for kw in chitchat_phrases):
            logger.info(f"Classified intent as 'chitchat' for query: '{q_raw}'")
            return {"intent": "chitchat"}

        question_indicators = ["what", "why", "how", "who", "where", "when", "which", "explain", "summarize", "describe", "list", "show", "tell", "find", "analyze", "compare", "is", "are", "can", "could", "would", "do", "does", "did"]
        if len(words) >= 3 or any(w in words for w in question_indicators):
            logger.info(f"Fast-path classified intent as 'needs_retrieval' for query: '{q_raw}'")
            return {"intent": "needs_retrieval"}

        try:
            classify_prompt = f"""Classify the user input into exactly one category: 'chitchat' (greetings, small talk, pleasantries) or 'needs_retrieval' (questions seeking factual info, document analysis, explanations).

Input: "{q_raw}"
Category (return ONLY 'chitchat' or 'needs_retrieval'):"""
            res = engine.get_active_llm().invoke(classify_prompt)
            classified = str(res.content).strip().lower()
            if "chitchat" in classified:
                logger.info(f"LLM Classified intent as 'chitchat' for query: '{q_raw}'")
                return {"intent": "chitchat"}
        except Exception as e:
            logger.warning(f"Error during intent classification, defaulting to 'needs_retrieval': {e}")

        logger.info(f"Classified intent as 'needs_retrieval' for query: '{q_raw}'")
        return {"intent": "needs_retrieval"}
    
    return node_classify_intent


def create_node_generate_direct_answer(engine: "RAGEngine"):
    def node_generate_direct_answer(state) -> Dict[str, Any]:
        question = state["question"]
        chat_history = state.get("chat_history", [])

        direct_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are AskDoc, a helpful, polite, and professional AI document assistant. Answer the user's greeting or small talk warmly and concisely."),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{question}")
        ])
        messages = direct_prompt.invoke({
            "question": question,
            "chat_history": chat_history
        })

        start_time = time.time()
        full_content = ""
        input_tokens = 0
        output_tokens = 0

        for chunk in engine._llm_stream(messages):
            content = chunk.content
            if content:
                if isinstance(content, list):
                    token = "".join([str(item) if isinstance(item, str) else item.get("text", "") if isinstance(item, dict) else str(item) for item in content])
                else:
                    token = str(content)
                full_content += token
            if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
                input_tokens = chunk.usage_metadata.get("input_tokens", input_tokens)
                output_tokens = chunk.usage_metadata.get("output_tokens", output_tokens)

        end_time = time.time()
        duration = end_time - start_time

        input_cost = (input_tokens / 1_000_000) * GEMINI_INPUT_COST_PER_1M
        output_cost = (output_tokens / 1_000_000) * GEMINI_OUTPUT_COST_PER_1M
        total_cost = input_cost + output_cost

        metrics = {
            "time": round(duration, 2),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost": round(total_cost, 6)
        }

        updated_history = list(chat_history)
        updated_history.append(HumanMessage(content=question))
        updated_history.append(AIMessage(content=full_content))

        return {
            "answer": full_content,
            "sources": [],
            "metrics": metrics,
            "chat_history": updated_history
        }
    
    return node_generate_direct_answer


def create_node_rephrase_query(engine: "RAGEngine"):
    def node_rephrase_query(state) -> Dict[str, Any]:
        question = state["question"]
        chat_history = state.get("chat_history", [])
        search_query = question
        if chat_history:
            try:
                history_str = "\n".join([f"{m.type}: {m.content}" for m in chat_history])
                search_query = engine._rephrase_query(history_str, question)
                logger.info(f"Rephrased query: {search_query}")
            except Exception as e:
                logger.warning(f"Error rephrasing query: {e}")
        return {"search_query": search_query}
    
    return node_rephrase_query


def create_node_retrieve(engine: "RAGEngine"):
    def node_retrieve(state) -> Dict[str, Any]:
        search_query = state.get("search_query", state["question"])
        session_id = state.get("session_id")
        user_id = state.get("user_id")
        
        filter_dict = {}
        if session_id:
            filter_dict["session_id"] = session_id
        if user_id:
            filter_dict["user_id"] = user_id
            
        vector_docs = []
        try:
            vector_docs = engine._similarity_search(search_query, filter_dict)
        except Exception as e:
            logger.warning(f"Vector search failed, degrading to keyword search: {e}")
            
        keyword_docs = []
        try:
            from app.services.search import keyword_search
            keyword_docs = keyword_search(search_query, session_id=session_id, user_id=user_id)
        except Exception as e:
            logger.warning(f"Keyword search failed, degrading to vector search: {e}")

        fused_docs = reciprocal_rank_fusion(vector_docs, keyword_docs, k=60)
        return {"retrieved_docs": fused_docs}
    
    return node_retrieve


def create_node_rerank(engine: "RAGEngine"):
    def node_rerank(state) -> Dict[str, Any]:
        search_query = state.get("search_query", state["question"])
        fused_docs = state.get("retrieved_docs", [])
        
        passages = [
            {"id": str(i), "text": doc.page_content, "meta": doc.metadata} 
            for i, doc in enumerate(fused_docs)
        ]
        
        reranked_docs = []
        if passages and RerankRequest is not None and getattr(engine, "ranker", None) is not None:
            try:
                rerank_request = RerankRequest(query=search_query, passages=passages)
                results = engine.ranker.rerank(rerank_request)
                top_results = results[:8]
                for res in top_results:
                    doc = Document(page_content=res['text'], metadata=res['meta'])
                    reranked_docs.append(doc)
            except Exception as e:
                logger.warning(f"FlashRank rerank failed ({e}), falling back to fused_docs")
                reranked_docs = fused_docs[:8]
        else:
            reranked_docs = fused_docs[:8]

        context_text = ""
        sources = []
        for i, doc in enumerate(reranked_docs):
            index = i + 1
            context_text += f"Source [{index}]:\n{doc.page_content}\n\n"
            raw_title = doc.metadata.get("title") or doc.metadata.get("source", "Document")
            # Strip any local directory paths or temp prefixes
            if "/" in raw_title or "\\" in raw_title:
                clean_title = os.path.basename(raw_title)
            else:
                clean_title = raw_title
            
            sources.append({
                "id": index,
                "title": clean_title,
                "content": doc.page_content,
                "metadata": doc.metadata
            })

        return {
            "reranked_docs": reranked_docs,
            "context_text": context_text,
            "sources": sources
        }
    
    return node_rerank


def create_node_grade_retrieval(engine: "RAGEngine"):
    def node_grade_retrieval(state) -> Dict[str, Any]:
        search_query = state.get("search_query", state["question"])
        context_text = state.get("context_text", "")
        
        if not context_text.strip():
            logger.info(f"No context retrieved to grade for query '{search_query}'. Verdict: not_relevant")
            return {
                "relevance_verdict": "not_relevant",
                "rewritten_query": f"{search_query} key details facts summary"
            }

        # Fast-pass: If context text is present, treat as relevant without extra LLM latency
        logger.info(f"Retrieved context present ({len(context_text)} chars). Fast-passing retrieval grade as relevant.")
        return {
            "relevance_verdict": "relevant",
            "rewritten_query": search_query
        }
    
    return node_grade_retrieval


def create_node_rewrite_query(engine: "RAGEngine"):
    def node_rewrite_query(state) -> Dict[str, Any]:
        current_retry = state.get("retry_count", 0) + 1
        orig_query = state.get("search_query", state["question"])
        new_query = state.get("rewritten_query") or orig_query
        
        logger.info(f"RAG Quality Loop Retry #{current_retry}: Rewriting query from '{orig_query}' to '{new_query}'")
        
        return {
            "retry_count": current_retry,
            "search_query": new_query
        }
    
    return node_rewrite_query


def create_node_check_ambiguity(engine: "RAGEngine"):
    def node_check_ambiguity(state) -> Dict[str, Any]:
        question = state["question"].strip()
        chat_history = state.get("chat_history", [])
        
        ambiguous_phrases = ["that one", "this one", "the other one", "what about that", "which one", "explain that part"]
        if len(question.split()) <= 5 and any(p in question.lower() for p in ambiguous_phrases) and not chat_history:
            logger.info(f"Ambiguity detected for question: '{question}'")
            return {"is_ambiguous": True, "needs_clarification": True}

        # Fast-pass non-ambiguous queries
        return {"is_ambiguous": False, "needs_clarification": False}
    
    return node_check_ambiguity


def create_node_generate_clarifying_question(engine: "RAGEngine"):
    def node_generate_clarifying_question(state) -> Dict[str, Any]:
        question = state["question"]
        chat_history = state.get("chat_history", [])

        clarify_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are AskDoc, a helpful AI document assistant. The user's request is ambiguous or missing specific details. Ask a polite, specific clarifying question to help narrow down what information they need from their documents."),
            MessagesPlaceholder(variable_name="chat_history"),
            ("user", "{question}")
        ])
        messages = clarify_prompt.invoke({
            "question": question,
            "chat_history": chat_history
        })

        start_time = time.time()
        response = engine._llm_generate(messages)
        end_time = time.time()
        duration = end_time - start_time
        
        input_tokens = 0
        output_tokens = 0
        if hasattr(response, "usage_metadata") and response.usage_metadata:
            input_tokens = response.usage_metadata.get("input_tokens", 0)
            output_tokens = response.usage_metadata.get("output_tokens", 0)

        input_cost = (input_tokens / 1_000_000) * GEMINI_INPUT_COST_PER_1M
        output_cost = (output_tokens / 1_000_000) * GEMINI_OUTPUT_COST_PER_1M
        total_cost = input_cost + output_cost
        
        metrics = {
            "time": round(duration, 2),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost": round(total_cost, 6)
        }

        updated_history = list(chat_history)
        updated_history.append(HumanMessage(content=question))
        updated_history.append(AIMessage(content=response.content))

        return {
            "answer": response.content,
            "sources": [],
            "metrics": metrics,
            "needs_clarification": True,
            "chat_history": updated_history
        }
    
    return node_generate_clarifying_question


def create_node_generate_answer(engine: "RAGEngine"):
    def node_generate_answer(state) -> Dict[str, Any]:
        question = state["question"]
        context_text = state.get("context_text", "")
        chat_history = state.get("chat_history", [])

        messages = engine.prompt.invoke({
            "question": question,
            "context": context_text,
            "chat_history": chat_history
        })

        start_time = time.time()
        full_content = ""
        input_tokens = 0
        output_tokens = 0

        for chunk in engine._llm_stream(messages):
            content = chunk.content
            if content:
                if isinstance(content, list):
                    token = "".join([str(item) if isinstance(item, str) else item.get("text", "") if isinstance(item, dict) else str(item) for item in content])
                else:
                    token = str(content)
                full_content += token
            if hasattr(chunk, "usage_metadata") and chunk.usage_metadata:
                input_tokens = chunk.usage_metadata.get("input_tokens", input_tokens)
                output_tokens = chunk.usage_metadata.get("output_tokens", output_tokens)

        end_time = time.time()
        duration = end_time - start_time

        input_cost = (input_tokens / 1_000_000) * GEMINI_INPUT_COST_PER_1M
        output_cost = (output_tokens / 1_000_000) * GEMINI_OUTPUT_COST_PER_1M
        total_cost = input_cost + output_cost

        low_conf = state.get("low_confidence", False) or (state.get("relevance_verdict") == "not_relevant" and state.get("retry_count", 0) >= 2)
        metrics = {
            "time": round(duration, 2),
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": input_tokens + output_tokens,
            "cost": round(total_cost, 6),
            "low_confidence": low_conf,
            "retries": state.get("retry_count", 0)
        }

        updated_history = list(chat_history)
        updated_history.append(HumanMessage(content=question))
        updated_history.append(AIMessage(content=full_content))

        return {
            "answer": full_content,
            "sources": state.get("sources", []),
            "context_text": context_text,
            "metrics": metrics,
            "chat_history": updated_history
        }
    
    return node_generate_answer


# ─── Route functions ──────────────────────────────────────────────────────────

def route_intent(state) -> str:
    intent = state.get("intent", "needs_retrieval")
    if intent == "chitchat":
        return "generate_direct_answer"
    return "rephrase_query"


def route_retrieval_quality(state) -> str:
    verdict = state.get("relevance_verdict", "relevant")
    retry_count = state.get("retry_count", 0)
    if verdict == "not_relevant" and retry_count < 2:
        return "rewrite_query"
    return "check_ambiguity"


def route_ambiguity(state) -> str:
    if state.get("is_ambiguous", False):
        return "generate_clarifying_question"
    return "generate_answer"
