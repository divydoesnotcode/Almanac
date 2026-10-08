"""
SQLAlchemy model registry for The Almanac.

This module imports every ORM model so that SQLAlchemy's metadata contains
the complete application schema.

Alembic imports this module before generating migrations.

Do not place business logic in this file.
"""

from backend.app.models.account import Account, AccountType
from backend.app.models.base import Base, BaseModel
from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.financial_goal import (
    FinancialGoal,
    GoalStatus,
    GoalType,
)
from backend.app.models.transaction import (
    Transaction,
    TransactionStatus,
    TransactionType,
)
from backend.app.models.user import User
from backend.app.models.user_preference import UserPreference
from backend.app.models.user_session import UserSession

__all__ = [
    "Base",
    "BaseModel",
    "User",
    "Account",
    "AccountType",
    "Transaction",
    "TransactionStatus",
    "TransactionType",
    "Category",
    "Budget",
    "FinancialGoal",
    "GoalStatus",
    "GoalType",
    "UserPreference",
    "UserSession",
]
