"""
SQLAlchemy ORM foundation for The Almanac.

This module defines the shared database model infrastructure used by every
SQLAlchemy model in the application.

Responsibilities
----------------
- Define the application's declarative ORM base.
- Provide a UUID primary-key mixin.
- Provide timezone-aware creation/update timestamps.
- Provide common model metadata and naming conventions.
- Provide a reusable base model for all domain entities.

This module does NOT contain:
- Business logic.
- Database sessions.
- API logic.
- Financial calculations.
- User-specific behavior.

Those concerns belong to their respective layers.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# =============================================================================
# Database Naming Convention
# =============================================================================
#
# Explicit naming conventions are important for:
#
#   - Alembic migrations
#   - PostgreSQL constraints
#   - Database administration
#   - Debugging
#   - Consistent production schemas
#
# Without a convention, generated constraint names can vary between databases
# and migrations can become unnecessarily difficult to manage.
# =============================================================================

NAMING_CONVENTION: dict[str, str] = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


# =============================================================================
# Shared Type Aliases
# =============================================================================

UUIDPrimaryKey = Annotated[
    uuid.UUID,
    mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    ),
]


CreatedAt = Annotated[
    datetime,
    mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    ),
]


UpdatedAt = Annotated[
    datetime,
    mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    ),
]


# =============================================================================
# Declarative Base
# =============================================================================

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy ORM models.

    Every database model in the Personal CFO application should inherit from
    this class either directly or through a domain-specific base class.

    Example:

        class User(Base):
            __tablename__ = "users"

            id: Mapped[uuid.UUID] = ...
    """

    metadata = MetaData(
        naming_convention=NAMING_CONVENTION,
    )


# =============================================================================
# Common Model
# =============================================================================

class BaseModel(Base):
    """
    Shared foundation for persistent domain entities.

    Provides:

        id
            Globally unique UUID primary key.

        created_at
            Timestamp indicating when the record was created.

        updated_at
            Timestamp indicating when the record was last updated.

    UUIDs are used instead of sequential integer IDs because they:

        - Avoid predictable identifiers.
        - Work well across distributed systems.
        - Allow IDs to be generated independently of the database.
        - Make future data synchronization easier.
        - Avoid exposing record counts through sequential IDs.

    All timestamps are timezone-aware and should be treated as UTC internally.
    """

    __abstract__ = True

    id: Mapped[UUIDPrimaryKey]

    created_at: Mapped[CreatedAt]

    updated_at: Mapped[UpdatedAt]
