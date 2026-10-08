"""
The Almanac — FastAPI Application Entry Point.

This module is intentionally kept thin.

Responsibilities:
    - Create and configure the FastAPI application.
    - Configure application lifespan.
    - Register middleware.
    - Register API routers.
    - Register global exception handlers.
    - Expose health/readiness endpoints.

Non-responsibilities:
    - Business logic.
    - Database queries.
    - ML inference.
    - LLM calls.
    - Authentication logic.
    - Financial calculations.

Those concerns belong in their respective modules.

Run locally:

    uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000

Production:

    uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
"""

# This is for Divy 


from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.api.account import router as account_router
from backend.app.api.auth import router as auth_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.ledger import router as ledger_router
from backend.app.api.onboarding import (
    getting_started_router,
    router as onboarding_router,
)
from backend.app.config import settings

# Database Connection
from backend.app.database import (
    check_database_connection,
    close_database,
)


# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Application Lifecycle
# -----------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncIterator[None]:
    """
    Manage application startup and shutdown.

    Keep heavyweight initialization here rather than executing it at module
    import time. This makes the application easier to test and prevents side
    effects when modules are imported.

    Startup responsibilities will eventually include:
        - Database connectivity checks.
        - ML model loading.
        - RAG/vector-store initialization.
        - External service initialization.

    Shutdown responsibilities will eventually include:
        - Closing database connections.
        - Closing HTTP clients.
        - Releasing ML resources.
        - Closing external service connections.
    """

    logger.info(
        "Starting %s | environment=%s",
        settings.APP_NAME,
        settings.ENVIRONMENT,
    )

    # -------------------------------------------------------------------------
    # Startup
    # -------------------------------------------------------------------------
    database_available = await check_database_connection()

    if not database_available:
        logger.critical(
            "Database connection failed. Application cannot start safely."
        )

        raise RuntimeError(
            "Database connection could not be established."
        )

    logger.info("Database connection established.")
    yield

    # -------------------------------------------------------------------------
    # Shutdown
    # -------------------------------------------------------------------------

    await close_database()
    logger.info("Shutting down %s", settings.APP_NAME)

    # Example future cleanup:
    #
    # await database.close()
    # await llm_client.close()


# -----------------------------------------------------------------------------
# Application Factory
# -----------------------------------------------------------------------------

def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.

    Using an application factory provides several advantages:

        1. Easier testing.
        2. Better separation of configuration.
        3. Avoids unnecessary global initialization.
        4. Makes multiple application instances possible.
        5. Cleaner production architecture.
    """

    application = FastAPI(
        title=settings.APP_NAME,
        description=(
            "AI-powered personal financial analysis platform that helps users "
            "understand, plan, and improve their financial health."
        ),
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,

        # Disable these in highly restricted production environments if
        # documentation should not be publicly exposed.
        docs_url="/docs" if settings.DEBUG else "/docs",
        redoc_url="/redoc" if settings.DEBUG else "/redoc",
        openapi_url="/openapi.json",
    )

    # -------------------------------------------------------------------------
    # Middleware
    # -------------------------------------------------------------------------

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # -------------------------------------------------------------------------
    # Exception Handling
    # -------------------------------------------------------------------------

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(
        request: Request,
        exc: Exception,
    ) -> JSONResponse:
        """
        Handle unexpected application errors.

        Important:
            Never expose internal exception details, stack traces, database
            errors, or secrets to API consumers.

        Full details should be logged internally while the client receives a
        generic response.
        """

        logger.exception(
            "Unhandled exception | method=%s | path=%s",
            request.method,
            request.url.path,
            exc_info=exc,
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred.",
                }
            },
        )

    # -------------------------------------------------------------------------
    # System Endpoints
    # -------------------------------------------------------------------------

    @application.get(
        "/",
        tags=["System"],
        summary="API information",
    )
    async def root() -> dict[str, str]:
        """
        Basic API information endpoint.

        This endpoint intentionally performs no database or external-service
        operations.
        """

        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "status": "running",
        }

    @application.get(
        "/health",
        tags=["System"],
        summary="Application health check",
    )
    async def health() -> dict[str, str]:
        """
        Liveness endpoint.

        A successful response means the API process is alive.

        This endpoint should remain lightweight because container orchestrators
        and load balancers may call it frequently.
        """

        return {
            "status": "healthy",
        }

    @application.get(
        "/ready",
        tags=["System"],
        summary="Application readiness check",
    )
    async def readiness() -> dict[str, str]:
        """
        Readiness endpoint.

        Unlike /health, this endpoint is intended to eventually verify that
        required dependencies are available.

        Future checks may include:
            - PostgreSQL
            - Redis
            - Model registry
            - Vector database
            - Required external services

        For now, the API itself is considered ready.
        """

        return {
            "status": "ready",
        }

    # -------------------------------------------------------------------------
    # API Routers
    # -------------------------------------------------------------------------

    application.include_router(auth_router)
    application.include_router(dashboard_router)
    application.include_router(ledger_router)
    application.include_router(account_router)
    application.include_router(onboarding_router)
    application.include_router(getting_started_router)

    return application


# -----------------------------------------------------------------------------
# Application Instance
# -----------------------------------------------------------------------------

app = create_application()
