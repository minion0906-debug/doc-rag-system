"""
Lightweight TTL-based query response cache.
Avoids duplicate LLM + retrieval costs for repeated queries.
"""

import time
from typing import Optional, Dict, Any


class QueryCache:
    """
    Keyed by (session_id, user_id, normalized_query).
    """
    def __init__(self, ttl_seconds: int = 300, max_size: int = 500):
        self.ttl = ttl_seconds
        self.max_size = max_size
        self._cache: Dict[str, Any] = {}

    def _make_key(self, session_id: Optional[str], user_id: Optional[str], query: str) -> str:
        norm_q = query.strip().lower()
        return f"{session_id or ''}:{user_id or ''}:{norm_q}"

    def get(self, session_id: Optional[str], user_id: Optional[str], query: str) -> Optional[Dict[str, Any]]:
        key = self._make_key(session_id, user_id, query)
        entry = self._cache.get(key)
        if entry:
            ts, data = entry
            if time.time() - ts < self.ttl:
                return data
            else:
                self._cache.pop(key, None)
        return None

    def set(self, session_id: Optional[str], user_id: Optional[str], query: str, data: Dict[str, Any]):
        if len(self._cache) >= self.max_size:
            # Purge oldest 20% entries
            sorted_entries = sorted(self._cache.items(), key=lambda item: item[1][0])
            for k, _ in sorted_entries[:int(self.max_size * 0.2)]:
                self._cache.pop(k, None)
        key = self._make_key(session_id, user_id, query)
        self._cache[key] = (time.time(), data)

    def invalidate_session(self, session_id: Optional[str]):
        if not session_id:
            return
        keys_to_del = [k for k in self._cache if k.startswith(f"{session_id}:")]
        for k in keys_to_del:
            self._cache.pop(k, None)
