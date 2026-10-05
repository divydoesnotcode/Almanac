"""
Category ORM model for Almanac.

A Category classifies financial transactions.

The model supports hierarchical categories, allowing structures such as:

    Food
    ├── Groceries
    ├── Dining
    └── Delivery

    Transportation
    ├── Fuel
    ├── Public Transport
    └── Ride Sharing

Categories are intentionally stored as database entities rather than Python
constants because they may eventually be:
    - User-defined
    - Imported from financial institutions
    - AI-generated
    - Renamed
    - Reorganized
    - Assigned to multiple transactions

The category model stores classification metadata only. It does not contain
financial calculations.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import BaseModel

if TYPE_CHECKING:
    from backend.app.models.budget import Budget
    from backend.app.models.transaction import Transaction
    from backend.app.models.user import User


class Category(BaseModel):
    """
    Financial transaction category.

    Categories can be either:

        Global/system category
            Available to all users.

        User category
            Created specifically by a user.

    A category may optionally have a parent category, allowing arbitrary
    category hierarchies.
    """

    __tablename__ = "categories"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "name",
            "parent_id",
            name="uq_categories_user_name_parent",
        ),
        Index(
            "ix_categories_user_active",
            "user_id",
            "is_active",
        ),
    )

    # =========================================================================
    # Ownership
    # =========================================================================

    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=True,
        index=True,
    )

    # =========================================================================
    # Category Information
    # =========================================================================

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # =========================================================================
    # Hierarchy
    # =========================================================================

    parent_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey(
            "categories.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # =========================================================================
    # Status
    # =========================================================================

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    # =========================================================================
    # System Category
    # =========================================================================

    is_system: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=text("false"),
    )

    # =========================================================================
    # Relationships
    # =========================================================================

    parent: Mapped["Category | None"] = relationship(
        "Category",
        back_populates="children",
        remote_side="Category.id",
    )

    children: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="parent",
        cascade="all, delete-orphan",
    )

    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="category",
    )

    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="category",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    user: Mapped["User | None"] = relationship(
    "User",
    back_populates="categories",
)

    # =========================================================================
    # Representation
    # =========================================================================

    def __repr__(self) -> str:
        """
        Safe developer representation.
        """

        return (
            f"<Category("
            f"id={self.id!s}, "
            f"name={self.name!r}, "
            f"user_id={self.user_id!s}"
            f")>"
        )
