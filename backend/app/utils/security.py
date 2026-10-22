"""Password hashing and JWT helpers.

Passwords are hashed with Argon2. JWTs are signed with the application
SECRET_KEY. This module must never log passwords, hashes, or tokens.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from jwt import ExpiredSignatureError, InvalidTokenError

from backend.app.config import settings

_hasher = PasswordHasher()

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_COOKIE = "cfo_access_token"
REFRESH_TOKEN_COOKIE = "cfo_refresh_token"


class InvalidAccessTokenError(Exception):
    """Raised when a JWT is missing, expired, or malformed."""


def hash_password(password: str) -> str:
    """Return an Argon2 hash for the given password."""

    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Return True when `password` matches `password_hash`."""

    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def create_access_token(
    *,
    user_id: UUID,
    email: str,
    token_version: int = 1,
    jti: UUID | None = None,
) -> str:
    """Create a signed JWT for an authenticated user."""

    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email,
        "ver": int(token_version),
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }
    if jti is not None:
        payload["jti"] = str(jti)

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate an access token."""

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except ExpiredSignatureError as exc:
        raise InvalidAccessTokenError("Access token has expired.") from exc
    except InvalidTokenError as exc:
        raise InvalidAccessTokenError("Access token is invalid.") from exc

    subject = payload.get("sub")
    if not subject:
        raise InvalidAccessTokenError("Access token is invalid.")

    return payload


def create_refresh_token() -> str:
    """Return a cryptographically secure opaque refresh token string."""

    return secrets.token_urlsafe(48)


def access_token_cookie_max_age() -> int:
    """Access token cookie max-age in seconds."""

    return settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def refresh_token_cookie_max_age() -> int:
    """Refresh token cookie max-age in seconds."""

    return settings.REFRESH_TOKEN_EXPIRE_DAYS * 86_400


def create_password_reset_token(
    *,
    user_id: UUID,
    email: str,
    token_version: int = 1,
) -> str:
    """Create a signed, time-limited JWT for password reset."""
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.RESET_PASSWORD_TOKEN_EXPIRE_MINUTES)

    payload: dict[str, Any] = {
        "sub": str(user_id),
        "email": email.strip().lower(),
        "ver": int(token_version),
        "purpose": "password_reset",
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_password_reset_token(token: str) -> dict[str, Any]:
    """Decode and validate a password reset token."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except ExpiredSignatureError as exc:
        raise InvalidAccessTokenError("Password reset link has expired.") from exc
    except InvalidTokenError as exc:
        raise InvalidAccessTokenError("Password reset link is invalid or corrupted.") from exc

    if payload.get("purpose") != "password_reset":
        raise InvalidAccessTokenError("Invalid token purpose.")

    subject = payload.get("sub")
    if not subject:
        raise InvalidAccessTokenError("Invalid token subject.")

    return payload
