"""Authentication HTTP routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

import logging

from backend.app.config import settings
from backend.app.database import get_db_session
from backend.app.schemas.auth import (
    FirebaseAuthRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    PublicUser,
    RefreshRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
    SigninData,
    SigninRequest,
    SigninResponse,
    SignupRequest,
    SignupResponse,
)
from backend.app.services.auth_service import (
    EmailAlreadyRegisteredError,
    InvalidCredentialsError,
    authenticate_or_register_firebase_user,
    authenticate_user,
    register_user,
    request_password_reset,
    reset_password_with_token,
    rotate_refresh_token,
    user_from_access_token,
)
from backend.app.services.email_service import send_password_reset_email
from backend.app.api.deps import extract_access_token, token_jti
from backend.app.services.account_service import revoke_current_session
from backend.app.utils.security import (
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    InvalidAccessTokenError,
    access_token_cookie_max_age,
    refresh_token_cookie_max_age,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

_IS_PROD = settings.ENVIRONMENT.lower() == "production"
_COOKIE_SAMESITE = "none" if _IS_PROD else "lax"


def _error(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": message,
        },
    )


def _set_access_cookie(response: Response, token: str) -> None:
    """Store the short-lived access token in an HttpOnly cookie (fallback for /auth/me)."""
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=_IS_PROD,
        samesite=_COOKIE_SAMESITE,
        max_age=access_token_cookie_max_age(),
        path="/",
    )


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Store the long-lived refresh token in an HttpOnly cookie."""
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=token,
        httponly=True,
        secure=_IS_PROD,
        samesite=_COOKIE_SAMESITE,
        max_age=refresh_token_cookie_max_age(),
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    """Delete auth cookies across all configurations."""
    for s_site in ("lax", "none"):
        for path in ("/", "/api/auth"):
            response.delete_cookie(
                key=ACCESS_TOKEN_COOKIE,
                path=path,
                httponly=True,
                samesite=s_site,
                secure=_IS_PROD,
            )
            response.delete_cookie(
                key=REFRESH_TOKEN_COOKIE,
                path=path,
                httponly=True,
                samesite=s_site,
                secure=_IS_PROD,
            )


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "Email already registered"},
        422: {"description": "Validation error"},
    },
)
async def signup(
    payload: SignupRequest,
    db: AsyncSession = Depends(get_db_session),
) -> SignupResponse | JSONResponse:
    try:
        user = await register_user(
            db,
            name=payload.name,
            email=payload.email,
            password=payload.password,
        )
    except EmailAlreadyRegisteredError:
        return _error(
            status.HTTP_409_CONFLICT,
            "An account with this email already exists",
        )

    return SignupResponse(
        success=True,
        message="Account created successfully",
        data=PublicUser.model_validate(user),
    )


@router.post(
    "/signin",
    response_model=SigninResponse,
    responses={
        401: {"description": "Invalid credentials"},
        422: {"description": "Validation error"},
    },
)
async def signin(
    payload: SigninRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
) -> SigninResponse | JSONResponse:
    try:
        user, access_token, refresh_token = await authenticate_user(
            db,
            email=payload.email,
            password=payload.password,
            user_agent=request.headers.get("user-agent"),
        )
    except InvalidCredentialsError:
        return _error(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password",
        )

    _set_access_cookie(response, access_token)
    _set_refresh_cookie(response, refresh_token)

    return SigninResponse(
        success=True,
        message="Signed in successfully",
        data=SigninData(
            user=PublicUser.model_validate(user),
            token=access_token,
            refresh_token=refresh_token,
        ),
    )


@router.post(
    "/firebase",
    response_model=SigninResponse,
    responses={
        401: {"description": "Invalid credentials or token"},
        422: {"description": "Validation error"},
    },
)
async def signin_with_firebase(
    payload: FirebaseAuthRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
) -> SigninResponse | JSONResponse:
    try:
        user, access_token, refresh_token = await authenticate_or_register_firebase_user(
            db,
            id_token=payload.id_token,
            user_agent=request.headers.get("user-agent"),
        )
    except InvalidCredentialsError as exc:
        return _error(
            status.HTTP_401_UNAUTHORIZED,
            str(exc) or "Could not authenticate with identity provider",
        )

    _set_access_cookie(response, access_token)
    _set_refresh_cookie(response, refresh_token)

    return SigninResponse(
        success=True,
        message="Signed in successfully",
        data=SigninData(
            user=PublicUser.model_validate(user),
            token=access_token,
            refresh_token=refresh_token,
        ),
    )


@router.post(
    "/refresh",
    response_model=SigninResponse,
    responses={
        401: {"description": "Missing, revoked, or expired refresh token"},
    },
)
async def refresh(
    request: Request,
    response: Response,
    payload: RefreshRequest | None = None,
    db: AsyncSession = Depends(get_db_session),
) -> SigninResponse | JSONResponse:
    """Issue a new access token + rotated refresh token.

    Accepts refresh token from request JSON body or from HttpOnly cookie.
    The old session is revoked and a new one is created (rotation).
    """
    raw_refresh: str | None = None
    if payload and payload.refresh_token:
        raw_refresh = payload.refresh_token.strip()

    if not raw_refresh:
        raw_refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)

    if not raw_refresh:
        return _error(status.HTTP_401_UNAUTHORIZED, "Authentication required")

    try:
        user, access_token, new_refresh_token = await rotate_refresh_token(
            db,
            raw_refresh_token=raw_refresh,
            user_agent=request.headers.get("user-agent"),
        )
    except InvalidCredentialsError:
        _clear_auth_cookies(response)
        return _error(status.HTTP_401_UNAUTHORIZED, "Session expired — please sign in again")

    _set_access_cookie(response, access_token)
    _set_refresh_cookie(response, new_refresh_token)

    return SigninResponse(
        success=True,
        message="Token refreshed",
        data=SigninData(
            user=PublicUser.model_validate(user),
            token=access_token,
            refresh_token=new_refresh_token,
        ),
    )


@router.get(
    "/me",
    response_model=SignupResponse,
    responses={
        401: {"description": "Missing or invalid token"},
    },
)
async def me(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
) -> SignupResponse | JSONResponse:
    """Return the authenticated user.

    Token priority: ``Authorization: Bearer <token>`` header first,
    then the ``cfo_access_token`` HttpOnly cookie as fallback (for the
    initial page-load /auth/me call where the in-memory token hasn't
    been restored yet).
    """
    token = extract_access_token(request)
    if not token:
        return _error(
            status.HTTP_401_UNAUTHORIZED,
            "Authentication required",
        )

    try:
        user = await user_from_access_token(db, token)
    except InvalidCredentialsError:
        return _error(
            status.HTTP_401_UNAUTHORIZED,
            "Authentication required",
        )

    return SignupResponse(
        success=True,
        message="Authenticated",
        data=PublicUser.model_validate(user),
    )


@router.post(
    "/signout",
    response_model=None,
    responses={
        401: {"description": "Missing or invalid token"},
    },
)
async def signout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, object] | JSONResponse:
    """Revoke the current session and clear both auth cookies."""
    token = extract_access_token(request)

    # Best-effort: revoke DB session if the access token is still valid.
    if token:
        try:
            await user_from_access_token(db, token)
            await revoke_current_session(db, jti=token_jti(token))
        except InvalidCredentialsError:
            pass  # Token already expired — still clear cookies

    # Also revoke the refresh-token session if we can look it up.
    raw_refresh = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if raw_refresh:
        from sqlalchemy import select
        from backend.app.models.user_session import UserSession
        from datetime import timezone
        from datetime import datetime

        result = await db.execute(
            select(UserSession).where(UserSession.refresh_token == raw_refresh)
        )
        session = result.scalar_one_or_none()
        if session and session.revoked_at is None:
            session.revoked_at = datetime.now(timezone.utc)
            await db.commit()

    _clear_auth_cookies(response)
    return {
        "success": True,
        "message": "Signed out",
        "data": {"signedOut": True},
    }


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_200_OK,
    responses={
        422: {"description": "Validation error"},
    },
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db_session),
) -> ForgotPasswordResponse:
    """Request a password reset link sent to the user's email via Google SMTP."""
    should_send, user_name, reset_token = await request_password_reset(
        db,
        email=payload.email,
    )

    if should_send and reset_token:
        frontend_url = settings.FRONTEND_URL.rstrip("/")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        try:
            await send_password_reset_email(
                to_email=payload.email,
                user_name=user_name or "User",
                reset_url=reset_url,
            )
        except Exception as exc:
            logger.error("Failed to deliver password reset email to %s: %s", payload.email, exc, exc_info=True)
            # Do not leak internal delivery failure to avoid exposing email status

    return ForgotPasswordResponse(
        success=True,
        message="If an account is associated with this email, recovery instructions have been dispatched.",
    )


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse,
    status_code=status.HTTP_200_OK,
    responses={
        400: {"description": "Invalid or expired token"},
        422: {"description": "Validation error"},
    },
)
async def reset_password(
    payload: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db_session),
) -> ResetPasswordResponse | JSONResponse:
    """Verify reset token and update account password."""
    try:
        await reset_password_with_token(
            db,
            token=payload.token,
            new_password=payload.password,
        )
    except InvalidAccessTokenError as exc:
        return _error(status.HTTP_400_BAD_REQUEST, str(exc))
    except InvalidCredentialsError as exc:
        return _error(status.HTTP_400_BAD_REQUEST, str(exc) or "Invalid or expired recovery link")

    return ResetPasswordResponse(
        success=True,
        message="Password has been reset successfully. You may now sign in with your new password.",
    )
