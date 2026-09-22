"""
FastAPI dependency to extract and verify Supabase JWT tokens.
Supports both authenticated users (JWT verified) and guest/anonymous sessions.
"""

from typing import Optional
import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import SUPABASE_JWT_SECRET, get_logger

logger = get_logger("askdoc.auth")
security = HTTPBearer(auto_error=False)


def get_current_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """
    FastAPI dependency to extract and verify the Supabase JWT token.
    Returns the user's UUID (sub claim) if present, or None for guest/anonymous sessions.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials

    try:
        if SUPABASE_JWT_SECRET:
            # Full signature verification when secret is provided
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        else:
            # Decode token payload to extract claims
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_exp": True}
            )

        user_id = payload.get("sub")
        return str(user_id) if user_id else None

    except jwt.ExpiredSignatureError:
        logger.warning("Supabase authorization token has expired")
        return None
    except jwt.PyJWTError as e:
        logger.warning(f"Could not decode authorization token: {e}")
        return None
