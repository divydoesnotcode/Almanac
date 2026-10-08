"""User ORM model for The Almanac."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Integer, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.models.base import BaseModel

if TYPE_CHECKING:
    from backend.app.models.account import Account
    from backend.app.models.budget import Budget
    from backend.app.models.category import Category
    from backend.app.models.financial_goal import FinancialGoal
    from backend.app.models.user_preference import UserPreference
    from backend.app.models.user_session import UserSession


class User(BaseModel):
    """
    Application identity.

    Authentication fields live here. Financial state belongs to related
    tables (accounts, transactions, goals).

    `password_hash` is the only credential material persisted. Plain-text
    passwords must never be stored or logged.
    """

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    token_version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        server_default=text("1"),
    )

    password_changed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    accounts: Mapped[list["Account"]] = relationship(
        "Account",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    categories: Mapped[list["Category"]] = relationship(
        "Category",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    financial_goals: Mapped[list["FinancialGoal"]] = relationship(
        "FinancialGoal",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    budgets: Mapped[list["Budget"]] = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    preferences: Mapped["UserPreference | None"] = relationship(
        "UserPreference",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
        uselist=False,
    )

    sessions: Mapped[list["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def __repr__(self) -> str:
        return (
            f"<User("
            f"id={self.id!s}, "
            f"email={self.email!r}, "
            f"is_active={self.is_active!r}"
            f")>"
        )
