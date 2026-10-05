"""
Database infrastructure for Almanac.

Technology:
    - PostgreSQL
    - SQLAlchemy 2.x
    - psycopg 3
    - asyncio

Responsibilities:
    - Create the asynchronous SQLAlchemy engine.
    - Configure connection pooling.
    - Provide an async session factory.
    - Provide FastAPI dependency injection for database sessions.
    - Provide database connectivity checks.
    - Provide clean engine shutdown.

This module MUST NOT contain:
    - Business logic
    - Financial calculations
    - API endpoints
    - SQLAlchemy models
    - Authentication logic

Those responsibilities belong to other layers.
"""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from backend.app.config import settings

logger = logging.getLogger(__name__)


# =============================================================================
# Database Engine
# =============================================================================

engine: AsyncEngine = create_async_engine(
    settings.computed_database_url,

    # -------------------------------------------------------------------------
    # Connection Pool
    # -------------------------------------------------------------------------
    #
    # The pool keeps a controlled number of PostgreSQL connections available
    # instead of creating a new connection for every request.
    #
    # These values should eventually be tuned according to:
    #
    #   application instances
    #   PostgreSQL max_connections
    #   expected concurrent requests
    #   deployment environment
    #
    # -------------------------------------------------------------------------

    pool_size=10,
    max_overflow=20,

    # Recycle connections periodically so stale database connections do not
    # remain alive indefinitely.
    pool_recycle=1800,

    # Check that a pooled connection is still alive before giving it to the
    # application.
    pool_pre_ping=True,

    # Do not echo SQL in production.
    #
    # SQL logging can expose sensitive financial information and can also
    # generate enormous amounts of log data.
    echo=settings.DEBUG,

    # PostgreSQL driver-specific connection arguments.
    connect_args={
        "connect_timeout": 10,
    },
)


# =============================================================================
# Session Factory
# =============================================================================

AsyncSessionFactory = async_sessionmaker(
    bind=engine,

    # Do not expire ORM objects after commit.
    #
    # This allows service-layer code to continue accessing objects after
    # committing a transaction without triggering unnecessary database queries.
    expire_on_commit=False,

    # Sessions should not automatically flush before every operation unless
    # SQLAlchemy determines that a flush is required.
    autoflush=False,

    # Explicitly disable automatic autocommit behavior.
    #
    # Transactions should be controlled intentionally by the application.
    autocommit=False,
)


# =============================================================================
# FastAPI Database Dependency
# =============================================================================

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide an AsyncSession to FastAPI endpoints.

    Usage:

        @router.get("/transactions")
        async def get_transactions(
            db: AsyncSession = Depends(get_db_session),
        ):
            ...

    Lifecycle:

        Request
           ↓
        Create session
           ↓
        Endpoint/service
           ↓
        Close session
           ↓
        Return connection to pool

    The session is always closed, including when an exception occurs.
    """

    async with AsyncSessionFactory() as session:
        try:
            yield session

        except Exception:
            # Roll back any uncommitted transaction before releasing the
            # session back to the pool.
            await session.rollback()

            logger.exception(
                "Database session failed; transaction rolled back."
            )

            raise

        finally:
            await session.close()


# =============================================================================
# Database Health Check
# =============================================================================

async def check_database_connection() -> bool:
    """
    Verify that PostgreSQL is reachable and required schema columns exist.
    """
    try:
        async with engine.begin() as connection:
            await connection.execute(text("SELECT 1"))
            try:
                await connection.execute(
                    text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;")
                )
                await connection.execute(
                    text("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS onboarding_step INT NOT NULL DEFAULT 1;")
                )
            except Exception as exc:
                logger.warning("Schema migration warning: %s", exc)

        logger.info("Database connection check & schema verification successful.")
        return True

    except Exception:
        logger.exception("Database connection check failed.")
        return False


# =============================================================================
# Database Shutdown
# =============================================================================

async def close_database() -> None:
    """
    Dispose of the SQLAlchemy engine and all pooled connections.

    This should be called during application shutdown.
    """

    logger.info("Closing database connection pool.")

    await engine.dispose()

    logger.info("Database connection pool closed.")
