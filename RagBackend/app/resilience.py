"""
Resilience utilities: retryable exception detection and retry decorator.
Used across embeddings, search, and LLM calls.
"""

from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception


def is_retryable_exception(exc: Exception) -> bool:
    """
    Distinguishes retryable errors (transient timeouts, 429 rate limits, 5xx server errors)
    from non-retryable errors (invalid API keys, 401/403 auth errors, 400 bad requests).
    Fails fast on non-retryable errors.
    """
    msg = str(exc).lower()
    
    # Non-retryable errors: fail fast immediately
    non_retryable_terms = [
        "api_key_invalid", "invalid_api_key", "invalid api key", "unauthorized",
        "permission_denied", "forbidden", "401", "403", "invalid argument", "bad request"
    ]
    if any(term in msg for term in non_retryable_terms):
        return False
        
    # Retryable errors: transient timeouts, 429 rate limit, 5xx server errors
    retryable_terms = [
        "429", "rate limit", "resourceexhausted", "quota", "timeout", "timed out",
        "connection", "500", "502", "503", "504", "service unavailable", "overloaded", "server error"
    ]
    if any(term in msg for term in retryable_terms):
        return True
        
    if isinstance(exc, (TimeoutError, ConnectionError, OSError)):
        return True
        
    return False


# Resilience decorator: max 3 attempts with exponential backoff
api_retry = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception(is_retryable_exception),
    reraise=True
)
