"""
Pinecone Inference embeddings adapter for LangChain.
"""

from typing import List
from functools import lru_cache
from pinecone import Pinecone
from langchain_core.embeddings import Embeddings

from app.config import get_logger
from app.resilience import api_retry

logger = get_logger("askdoc.services.embeddings")


class PineconeInferenceEmbeddings(Embeddings):
    def __init__(self, api_key: str, model: str = "llama-text-embed-v2"):
        self.pc = Pinecone(api_key=api_key)
        self.model = model

    @api_retry
    def _embed_batch(self, batch: List[str]):
        response = self.pc.inference.embed(
            model=self.model,
            inputs=batch,
            parameters={"input_type": "passage", "truncate": "END"}
        )
        return [r['values'] for r in response]

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        try:
            batch_size = 90
            all_embeddings = []
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                embeddings = self._embed_batch(batch)
                all_embeddings.extend(embeddings)
            return all_embeddings
        except Exception as e:
            logger.error(f"Error embedding documents: {e}", exc_info=True)
            raise e

    @api_retry
    def _embed_query_with_retry(self, text: str):
        response = self.pc.inference.embed(
            model=self.model,
            inputs=[text],
            parameters={"input_type": "query", "truncate": "END"}
        )
        return response[0]['values']

    @lru_cache(maxsize=1000)
    def embed_query(self, text: str) -> List[float]:
        try:
            return self._embed_query_with_retry(text)
        except Exception as e:
            logger.error(f"Error embedding query: {e}", exc_info=True)
            raise e
