"""
Middleware utilities: rate limiting and user-facing error formatting.
"""

import time
from collections import defaultdict

from app.config import RATE_LIMIT_RPM


class RateLimiter:
    """
    In-memory sliding window rate limiter per client/user.
    """
    def __init__(self, requests_per_minute: int = 30):
        self.rpm = requests_per_minute
        self.history = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        window_start = now - 60
        # Filter timestamps older than 60s
        self.history[client_id] = [ts for ts in self.history[client_id] if ts > window_start]
        if len(self.history[client_id]) >= self.rpm:
            return False
        self.history[client_id].append(now)
        return True


# Global singleton rate limiter
rate_limiter = RateLimiter(requests_per_minute=RATE_LIMIT_RPM)


def format_user_facing_error(e: Exception, default_prefix: str = "Request failed") -> str:
    """
    Formulate clear, user-facing error messages for API endpoints instead of raw tracebacks.
    """
    msg = str(e).lower()
    
    if any(term in msg for term in ["api_key_invalid", "invalid_api_key", "invalid api key", "unauthorized", "401", "403"]):
        return "Authentication error: Please check that your GOOGLE_API_KEY and PINECONE_API_KEY environment variables are valid."
    if any(term in msg for term in ["429", "rate limit", "resourceexhausted", "quota", "resource_exhausted"]):
        return "Gemini API rate limit / daily free-tier quota exceeded (429). Please wait for quota refresh or change GEMINI_MODEL in your .env file."
    if any(term in msg for term in ["timeout", "timed out", "connection", "500", "502", "503", "504"]):
        return "The AI service is temporarily unavailable or timed out. Please try again."
        
    first_line = str(e).splitlines()[0] if str(e) else "An unexpected error occurred."
    return f"{default_prefix}: {first_line}"
