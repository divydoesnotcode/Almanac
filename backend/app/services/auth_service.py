"""Authentication service.

Business logic for registration and sign-in. Routers should stay thin.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import httpx
import jwt
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.config import settings
from backend.app.models.user import User
from backend.app.models.user_session import UserSession
from backend.app.utils.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_access_token,
    decode_password_reset_token,
    hash_password,
    verify_password,
    InvalidAccessTokenError,
)

logger = logging.getLogger(__name__)


class EmailAlreadyRegisteredError(Exception):
    """Raised when signup is attempted with an existing email."""


class InvalidCredentialsError(Exception):
    """Raised when sign-in credentials are rejected."""


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(
        select(User).where(User.email == email)
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> User | None:
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def register_user(
    db: AsyncSession,
    *,
    name: str,
    email: str,
    password: str,
) -> User:
    existing = await get_user_by_email(db, email)
    if existing is not None:
        raise EmailAlreadyRegisteredError()

    password_hash = await asyncio.to_thread(hash_password, password)

    user = User(
        name=name,
        email=email,
        password_hash=password_hash,
    )

    db.add(user)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        logger.info("Signup rejected because of a uniqueness conflict.")
        raise EmailAlreadyRegisteredError() from None

    await db.refresh(user)
    logger.info("User registered.")
    return user


async def issue_session(
    db: AsyncSession,
    user: User,
    *,
    user_agent: str | None = None,
) -> tuple[str, str]:
    """Create a new session and return ``(access_token, refresh_token)``.

    The access token is a short-lived signed JWT.
    The refresh token is an opaque random string stored in the DB row.
    """
    now = datetime.now(timezone.utc)
    refresh_token = create_refresh_token()
    session = UserSession(
        user_id=user.id,
        expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        user_agent=(user_agent or "Unknown")[:255],
        refresh_token=refresh_token,
    )
    db.add(session)
    await db.flush()
    access_token = create_access_token(
        user_id=user.id,
        email=user.email,
        token_version=user.token_version,
        jti=session.id,
    )
    await db.commit()
    await db.refresh(user)
    return access_token, refresh_token


async def authenticate_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    user_agent: str | None = None,
) -> tuple[User, str, str]:
    """Verify credentials and return ``(user, access_token, refresh_token)``."""
    user = await get_user_by_email(db, email)

    if user is None or not user.is_active:
        # Run a dummy verify so missing users take a similar amount of work.
        await asyncio.to_thread(
            verify_password,
            password,
            "$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        )
        raise InvalidCredentialsError()

    matched = await asyncio.to_thread(
        verify_password,
        password,
        user.password_hash,
    )

    if not matched:
        raise InvalidCredentialsError()

    access_token, refresh_token = await issue_session(db, user, user_agent=user_agent)
    return user, access_token, refresh_token


async def rotate_refresh_token(
    db: AsyncSession,
    *,
    raw_refresh_token: str,
    user_agent: str | None = None,
) -> tuple[User, str, str]:
    """Validate an existing refresh token, revoke it, and issue a fresh pair.

    Returns ``(user, new_access_token, new_refresh_token)``.

    Raises ``InvalidCredentialsError`` when the token is not found,
    already revoked, or expired.
    """
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(UserSession).where(UserSession.refresh_token == raw_refresh_token)
    )
    session = result.scalar_one_or_none()
    if session is None or session.expires_at <= now:
        raise InvalidCredentialsError()

    user = await get_user_by_id(db, session.user_id)
    if user is None or not user.is_active:
        raise InvalidCredentialsError()

    # Grace period (30s): If the session was already revoked very recently (e.g. concurrent refresh calls on reload),
    # return the latest valid session or a fresh one instead of instantly rejecting.
    if session.revoked_at is not None:
        if (now - session.revoked_at).total_seconds() > 30:
            raise InvalidCredentialsError()
        latest_res = await db.execute(
            select(UserSession)
            .where(
                UserSession.user_id == user.id,
                UserSession.revoked_at.is_(None),
                UserSession.expires_at > now,
            )
            .order_by(UserSession.created_at.desc())
        )
        latest_session = latest_res.scalars().first()
        if latest_session:
            access_token = create_access_token(
                user_id=user.id,
                email=user.email,
                token_version=user.token_version,
                jti=latest_session.id,
            )
            return user, access_token, latest_session.refresh_token

        access_token, new_refresh_token = await issue_session(
            db, user, user_agent=user_agent
        )
        return user, access_token, new_refresh_token

    # Revoke the consumed session (rotation — one-time use).
    session.revoked_at = now
    await db.flush()

    # Issue a brand-new session pair.
    access_token, new_refresh_token = await issue_session(
        db, user, user_agent=user_agent
    )
    return user, access_token, new_refresh_token


async def user_from_access_token(
    db: AsyncSession,
    token: str,
) -> User:
    try:
        payload = decode_access_token(token)
    except InvalidAccessTokenError as exc:
        raise InvalidCredentialsError() from exc

    try:
        user_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError, TypeError) as exc:
        raise InvalidCredentialsError() from exc

    user = await get_user_by_id(db, user_id)

    if user is None or not user.is_active:
        raise InvalidCredentialsError()

    claimed_version = payload.get("ver", 1)
    try:
        version = int(claimed_version)
    except (TypeError, ValueError):
        raise InvalidCredentialsError() from None
    if version != int(user.token_version):
        raise InvalidCredentialsError()

    jti_raw = payload.get("jti")
    if jti_raw:
        try:
            jti = UUID(str(jti_raw))
        except (ValueError, TypeError) as exc:
            raise InvalidCredentialsError() from exc
        result = await db.execute(
            select(UserSession).where(UserSession.id == jti)
        )
        session = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if (
            session is None
            or session.user_id != user.id
            or session.revoked_at is not None
            or session.expires_at <= now
        ):
            raise InvalidCredentialsError()

    return user


FIREBASE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: float = 0.0
_JWKS_CACHE_TTL = 3600.0  # 1 hour


async def _fetch_firebase_jwks() -> dict[str, Any]:
    global _jwks_cache, _jwks_cache_time
    import time

    now = time.time()
    if _jwks_cache and (now - _jwks_cache_time) < _JWKS_CACHE_TTL:
        return _jwks_cache

    headers = {"User-Agent": "FastAPI/TheAlmanacAuth"}
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as http_client:
        resp = await http_client.get(FIREBASE_JWKS_URL, headers=headers)
        if resp.status_code == 200:
            _jwks_cache = resp.json()
            _jwks_cache_time = now
            return _jwks_cache
        raise RuntimeError(f"Failed to fetch Firebase JWKS: HTTP {resp.status_code}")


async def verify_firebase_id_token(id_token: str) -> dict[str, Any]:
    id_token = id_token.strip()
    project_id = (settings.FIREBASE_PROJECT_ID or "your_new_project_id").strip()
    api_key = (getattr(settings, "FIREBASE_API_KEY", None) or "your_new_api_key").strip()

    # Strategy 1: Local cryptographic verification using Google's public JWKS keys
    try:
        header = jwt.get_unverified_header(id_token)
        kid = header.get("kid")
        alg = header.get("alg", "RS256")

        jwks_data = await _fetch_firebase_jwks()
        jwk_set = jwt.PyJWKSet.from_dict(jwks_data)

        matching_key = None
        for key in jwk_set.keys:
            if key.key_id == kid:
                matching_key = key
                break

        if not matching_key:
            # Invalidate cache once and retry if kid was not found (key rotation)
            global _jwks_cache_time
            _jwks_cache_time = 0.0
            jwks_data = await _fetch_firebase_jwks()
            jwk_set = jwt.PyJWKSet.from_dict(jwks_data)
            for key in jwk_set.keys:
                if key.key_id == kid:
                    matching_key = key
                    break

        if matching_key:
            payload = jwt.decode(
                id_token,
                matching_key.key,
                algorithms=[alg, "RS256"],
                audience=project_id,
                issuer=f"https://securetoken.google.com/{project_id}",
                leeway=120,  # 2-minute leeway to tolerate local/server clock drift
                options={
                    "verify_signature": True,
                    "verify_aud": True,
                    "verify_iss": True,
                    "verify_exp": True,
                },
            )
            return payload
        else:
            logger.warning("No matching key ID '%s' in Firebase JWKS", kid)
    except Exception as err:
        logger.warning(
            "Local JWKS verification failed (%s: %s), attempting Google Identity Toolkit lookup",
            type(err).__name__,
            err,
        )

    # Strategy 2: Google Identity Toolkit REST API (verifies Firebase ID Token directly with Google servers)
    if api_key:
        try:
            lookup_url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}"
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.post(
                    lookup_url,
                    json={"idToken": id_token},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    users = data.get("users", [])
                    if users:
                        user_info = users[0]
                        email = user_info.get("email")
                        name = user_info.get("displayName")
                        if not name and user_info.get("providerUserInfo"):
                            for p_info in user_info.get("providerUserInfo", []):
                                if p_info.get("displayName"):
                                    name = p_info.get("displayName")
                                    break

                        return {
                            "sub": user_info.get("localId"),
                            "user_id": user_info.get("localId"),
                            "email": email,
                            "email_verified": user_info.get("emailVerified", False),
                            "name": name,
                            "picture": user_info.get("photoUrl"),
                            "aud": project_id,
                            "iss": f"https://securetoken.google.com/{project_id}",
                        }
                else:
                    logger.warning(
                        "Google Identity Toolkit lookup returned HTTP %s: %s",
                        resp.status_code,
                        resp.text,
                    )
        except Exception as err:
            logger.warning(
                "Google Identity Toolkit lookup failed (%s: %s)",
                type(err).__name__,
                err,
            )

    # Strategy 3: Google OAuth2 tokeninfo fallback (in case frontend passed raw Google OAuth ID token)
    try:
        async with httpx.AsyncClient(timeout=10.0) as http_client:
            resp = await http_client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token},
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("email"):
                    return data
    except Exception:
        pass

    raise InvalidCredentialsError("Invalid Firebase authentication token")


async def authenticate_or_register_firebase_user(
    db: AsyncSession,
    *,
    id_token: str,
    user_agent: str | None = None,
) -> tuple[User, str, str]:
    """Verify Firebase ID token and return ``(user, access_token, refresh_token)``.
    
    If the user does not exist in the database, automatically provision a new user.
    """
    payload = await verify_firebase_id_token(id_token)
    email = payload.get("email")
    if not email:
        raise InvalidCredentialsError("Email address not provided by identity provider")

    email = email.strip().lower()
    name = (payload.get("name") or email.split("@")[0]).strip()
    if len(name) < 2:
        name = email.split("@")[0]
    if len(name) > 150:
        name = name[:150]

    user = await get_user_by_email(db, email)
    if user is None:
        # Create user with an unusable placeholder password hash so standard sign-in cannot be bypassed
        dummy_hash = "$argon2id$v=19$m=65536,t=3,p=4$OAUTH_FIREBASE_UNUSABLE$OAUTH_FIREBASE_UNUSABLE_ACCOUNT_NO_PASSWORD"
        user = User(
            name=name,
            email=email,
            password_hash=dummy_hash,
            is_active=True,
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except IntegrityError:
            await db.rollback()
            user = await get_user_by_email(db, email)
            if user is None:
                raise InvalidCredentialsError("Could not create account for OAuth user")

    if not user.is_active:
        raise InvalidCredentialsError("Account is inactive")

    access_token, refresh_token = await issue_session(db, user, user_agent=user_agent)
    return user, access_token, refresh_token


async def request_password_reset(
    db: AsyncSession,
    *,
    email: str,
) -> tuple[bool, str | None, str | None]:
    """Generate a password reset token for the given email if registered and active.
    
    Returns (should_send, user_name, reset_token).
    """
    user = await get_user_by_email(db, email.strip().lower())
    if user is None or not user.is_active:
        return False, None, None

    token = create_password_reset_token(
        user_id=user.id,
        email=user.email,
        token_version=user.token_version,
    )
    return True, user.name, token


async def reset_password_with_token(
    db: AsyncSession,
    *,
    token: str,
    new_password: str,
) -> User:
    """Validate a reset token, update user password, and invalidate all existing sessions."""
    from sqlalchemy import update

    payload = decode_password_reset_token(token)
    try:
        user_id = UUID(str(payload["sub"]))
    except (KeyError, ValueError, TypeError) as exc:
        raise InvalidAccessTokenError("Invalid reset token payload") from exc

    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise InvalidCredentialsError("User account not found or inactive")

    # Verify email matches
    token_email = payload.get("email", "").strip().lower()
    if user.email.lower() != token_email:
        raise InvalidCredentialsError("Reset token email mismatch")

    # Verify token version matches (prevents reuse of the reset link)
    claimed_version = payload.get("ver", 1)
    if int(claimed_version) != int(user.token_version):
        raise InvalidCredentialsError("Password reset link has already been used or invalidated")

    # Hash new password
    password_hash = await asyncio.to_thread(hash_password, new_password)

    # Invalidate old sessions and reset tokens by incrementing token_version
    user.password_hash = password_hash
    user.token_version = user.token_version + 1
    user.password_changed_at = datetime.now(timezone.utc)

    # Also mark all current UserSessions as revoked
    now = datetime.now(timezone.utc)
    await db.execute(
        update(UserSession)
        .where(UserSession.user_id == user.id, UserSession.revoked_at.is_(None))
        .values(revoked_at=now)
    )

    await db.commit()
    await db.refresh(user)
    logger.info("Password successfully reset for user %s", user.id)
    return user
