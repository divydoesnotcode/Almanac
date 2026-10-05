"""Database-backed Onboarding Step APIs."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.api.deps import get_current_user
from backend.app.database import get_db_session
from backend.app.models.account import Account, AccountType
from backend.app.models.budget import Budget
from backend.app.models.category import Category
from backend.app.models.transaction import Transaction, TransactionStatus, TransactionType
from backend.app.models.user import User
from backend.app.models.user_preference import RISK_VALUES, UserPreference
from backend.app.services.account_service import get_or_create_preferences
from backend.app.services.ledger_service import apply_balance_change, balance_delta, visible_categories_query

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])
getting_started_router = APIRouter(prefix="/api/getting-started", tags=["Getting Started"])

logger = logging.getLogger(__name__)

# Session state tracker for onboarding progression
_USER_ONBOARDING_STATE: dict[UUID, dict[str, Any]] = {}


# ── Schemas ──────────────────────────────────────────────────────────────────

class AccountItem(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=150)
    account_type: str = "bank"
    balance: float = Field(default=0.0, ge=0)
    description: str | None = None


class Step1AccountsRequest(BaseModel):
    accounts: list[AccountItem] = Field(min_length=1)


class Step2IncomeRequest(BaseModel):
    income_source: str = Field(min_length=1, max_length=200)
    monthly_income: float = Field(gt=0)
    record_initial_income: bool = True
    account_id: str | UUID | None = None


class Step3PolicyRequest(BaseModel):
    savings_target: float = Field(default=20.0, ge=0, le=100)
    emergency_months: int = Field(default=6, ge=1, le=36)
    risk_tolerance: str = Field(default="moderate")


class BudgetItem(BaseModel):
    category_id: str | UUID
    category_name: str | None = None
    monthly_limit: float = Field(gt=0)


class Step4BudgetsRequest(BaseModel):
    budgets: list[BudgetItem] = Field(min_length=1)


class OnboardingStatusResponse(BaseModel):
    success: bool = True
    is_first_time: bool = True
    show_getting_started: bool = True
    step: int
    completed: bool
    accounts: list[dict[str, Any]]
    income: dict[str, Any]
    policy: dict[str, Any]
    budgets: list[dict[str, Any]]


# ── Core Status Helper ────────────────────────────────────────────────────────

async def get_getting_started_status_data(
    user: User,
    db: AsyncSession,
) -> dict[str, Any]:
    """
    Read full onboarding and initialization state directly from PostgreSQL.
    Determines if the user is creating an account for the first time.
    """
    # 1. Accounts
    acc_res = await db.execute(
        select(Account)
        .where(Account.user_id == user.id, Account.is_active == True)  # noqa: E712
        .order_by(Account.created_at.asc())
    )
    accounts = list(acc_res.scalars().all())

    # 2. Preferences
    pref = await get_or_create_preferences(db, user)

    # 3. Income transactions
    tx_res = await db.execute(
        select(Transaction)
        .where(
            Transaction.user_id == user.id,
            Transaction.transaction_type == TransactionType.INCOME,
        )
        .order_by(Transaction.created_at.desc())
        .limit(1)
    )
    income_tx = tx_res.scalar_one_or_none()

    # 4. Budgets
    b_res = await db.execute(
        select(Budget)
        .options(selectinload(Budget.category))
        .where(Budget.user_id == user.id)
    )
    budgets = list(b_res.scalars().all())

    has_accounts = len(accounts) > 0
    has_income = income_tx is not None
    has_budgets = len(budgets) > 0

    # Determine active step from PostgreSQL preferences
    is_completed = bool(getattr(pref, "onboarding_completed", False))

    if not has_accounts:
        step = 1
    elif is_completed:
        step = 5
    else:
        saved_step = getattr(pref, "onboarding_step", None)
        step = saved_step if saved_step else (2 if not has_income else (4 if not has_budgets else 5))

    savings_target = 20.0
    try:
        if getattr(pref, "monthly_savings_target_pct", None) is not None:
            savings_target = float(pref.monthly_savings_target_pct)
    except (ValueError, TypeError):
        pass

    emergency_months = 6
    try:
        if getattr(pref, "emergency_fund_months", None) is not None:
            emergency_months = int(pref.emergency_fund_months)
    except (ValueError, TypeError):
        pass

    risk_tolerance = getattr(pref, "risk_tolerance", "moderate") or "moderate"

    is_first_time = not is_completed
    show_getting_started = not is_completed

    return {
        "is_first_time": is_first_time,
        "show_getting_started": show_getting_started,
        "step": step,
        "completed": is_completed,
        "accounts": [
            {
                "id": str(a.id),
                "name": a.name,
                "account_type": a.account_type.value if hasattr(a.account_type, "value") else str(a.account_type),
                "balance": str(a.balance),
                "description": a.description or "",
            }
            for a in accounts
        ],
        "income": {
            "income_source": income_tx.description or income_tx.merchant_name or "Primary Employment / Salary" if income_tx else "Primary Employment / Salary",
            "monthly_income": str(income_tx.amount) if income_tx and income_tx.amount is not None else "100000",
            "record_initial_income": income_tx is not None,
        },
        "policy": {
            "savings_target": savings_target,
            "emergency_months": emergency_months,
            "risk_tolerance": risk_tolerance,
        },
        "budgets": [
            {
                "category_id": str(b.category_id),
                "category_name": b.category.name if b.category else "",
                "monthly_limit": str(b.monthly_limit) if b.monthly_limit is not None else "0",
            }
            for b in budgets
        ],
    }


# ── Routes: /api/onboarding & /api/getting-started ───────────────────────────

@router.get("/status")
@router.get("/getting-started")
async def get_onboarding_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Read full onboarding and initialization state directly from PostgreSQL.
    Returns show_getting_started=True only for first-time account creators.
    """
    try:
        data = await get_getting_started_status_data(user, db)
        return {
            "success": True,
            "data": data,
        }
    except Exception as exc:
        logger.exception("Error in get_onboarding_status: %s", exc)
        return {
            "success": True,
            "data": {
                "is_first_time": True,
                "show_getting_started": True,
                "step": 1,
                "completed": False,
                "accounts": [],
                "income": {
                    "income_source": "Primary Employment / Salary",
                    "monthly_income": "100000",
                    "record_initial_income": True,
                },
                "policy": {
                    "savings_target": 20.0,
                    "emergency_months": 6,
                    "risk_tolerance": "moderate",
                },
                "budgets": [],
            },
        }


@getting_started_router.get("")
@getting_started_router.get("/")
@getting_started_router.get("/status")
async def get_getting_started_info(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Dedicated Getting-Started API for first-time onboarding telemetry.
    """
    return await get_onboarding_status(user, db)


@router.post("/step-1")
@getting_started_router.post("/step-1")
async def save_step_1_accounts(
    payload: Step1AccountsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Step 1 API: Persists initial liquidity accounts directly into PostgreSQL.
    """
    try:
        pref = await get_or_create_preferences(db, user)
        saved_accounts = []

        for item in payload.accounts:
            try:
                acc_type = AccountType(item.account_type.lower())
            except (ValueError, AttributeError):
                acc_type = AccountType.BANK

            bal = Decimal(str(item.balance))

            existing_res = await db.execute(
                select(Account).where(
                    Account.user_id == user.id,
                    Account.name == item.name.strip(),
                    Account.is_active == True,  # noqa: E712
                )
            )
            acc = existing_res.scalar_one_or_none()

            if acc is not None:
                acc.balance = bal
                acc.account_type = acc_type
                acc.description = item.description.strip() if item.description else None
            else:
                acc = Account(
                    user_id=user.id,
                    name=item.name.strip(),
                    account_type=acc_type,
                    balance=bal,
                    description=item.description.strip() if item.description else None,
                    is_active=True,
                )
                db.add(acc)

            saved_accounts.append(acc)

        curr_step = int(pref.onboarding_step) if getattr(pref, "onboarding_step", None) is not None else 1
        pref.onboarding_step = max(curr_step, 2)

        await db.commit()

        for acc in saved_accounts:
            await db.refresh(acc)

        _USER_ONBOARDING_STATE[user.id] = {"step": 2, "completed": False}

        return {
            "success": True,
            "message": f"Successfully created {len(saved_accounts)} accounts in database",
            "step": 2,
            "accounts": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "account_type": a.account_type.value if hasattr(a.account_type, "value") else str(a.account_type),
                    "balance": str(a.balance),
                    "description": a.description or "",
                }
                for a in saved_accounts
            ],
        }
    except Exception as exc:
        logger.exception("Error in save_step_1_accounts: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to save accounts: {exc}",
        ) from exc


@router.delete("/accounts/{account_id}")
@router.delete("/step-1/{account_id}")
@getting_started_router.delete("/accounts/{account_id}")
@getting_started_router.delete("/step-1/{account_id}")
async def delete_onboarding_account(
    account_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Delete a specific onboarding account.
    If no active accounts remain, resets onboarding step to Step 1.
    """
    try:
        acc_res = await db.execute(
            select(Account).where(
                Account.id == account_id,
                Account.user_id == user.id,
            )
        )
        account = acc_res.scalar_one_or_none()
        if account is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found",
            )

        await db.delete(account)
        await db.flush()

        # Check remaining active accounts
        remaining_res = await db.execute(
            select(Account)
            .where(Account.user_id == user.id, Account.is_active == True)  # noqa: E712
            .order_by(Account.created_at.asc())
        )
        remaining = list(remaining_res.scalars().all())

        pref = await get_or_create_preferences(db, user)
        if not remaining and not pref.onboarding_completed:
            pref.onboarding_step = 1

        await db.commit()

        return {
            "success": True,
            "message": "Account successfully deleted",
            "step": pref.onboarding_step if not pref.onboarding_completed else 5,
            "accounts": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "account_type": a.account_type.value if hasattr(a.account_type, "value") else str(a.account_type),
                    "balance": str(a.balance),
                    "description": a.description or "",
                }
                for a in remaining
            ],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error in delete_onboarding_account: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to delete account: {exc}",
        ) from exc


@router.delete("/accounts")
@router.delete("/step-1")
@getting_started_router.delete("/accounts")
@getting_started_router.delete("/step-1")
async def delete_all_onboarding_accounts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Delete/clear all onboarding accounts for the user and reset to Step 1.
    """
    try:
        acc_res = await db.execute(
            select(Account).where(Account.user_id == user.id)
        )
        accounts = list(acc_res.scalars().all())
        for acc in accounts:
            await db.delete(acc)

        pref = await get_or_create_preferences(db, user)
        if not pref.onboarding_completed:
            pref.onboarding_step = 1

        await db.commit()

        return {
            "success": True,
            "message": f"Successfully deleted {len(accounts)} accounts",
            "step": 1,
            "accounts": [],
        }
    except Exception as exc:
        logger.exception("Error in delete_all_onboarding_accounts: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to delete accounts: {exc}",
        ) from exc


@router.post("/step-2")
@getting_started_router.post("/step-2")
async def save_step_2_income(
    payload: Step2IncomeRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Step 2 API: Persists recurring income and creates initial income transaction.
    """
    try:
        if not payload.income_source or not payload.income_source.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Primary income source is mandatory.",
            )

        if payload.monthly_income <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Expected monthly inflow must be greater than 0.",
            )

        acc_res = await db.execute(
            select(Account)
            .where(Account.user_id == user.id, Account.is_active == True)  # noqa: E712
            .order_by(Account.created_at.asc())
        )
        primary_acc = acc_res.scalars().first()

        if primary_acc is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No account found. Please complete Step 1 first.",
            )

        target_acc = primary_acc
        if payload.account_id:
            acc_id = None
            try:
                acc_id = UUID(str(payload.account_id))
            except (ValueError, TypeError):
                acc_id = None

            if acc_id:
                acc_specific = await db.execute(
                    select(Account).where(
                        Account.id == acc_id,
                        Account.user_id == user.id,
                        Account.is_active == True,  # noqa: E712
                    )
                )
                custom_acc = acc_specific.scalar_one_or_none()
                if custom_acc:
                    target_acc = custom_acc

        income_amount = Decimal(str(payload.monthly_income))

        if payload.record_initial_income and income_amount > 0:
            cat_res = await db.execute(visible_categories_query(user.id))
            all_cats = list(cat_res.scalars().all())
            income_cat = next(
                (c for c in all_cats if "income" in c.name.lower() or "salary" in c.name.lower()),
                None,
            )

            tx = Transaction(
                user_id=user.id,
                account_id=target_acc.id,
                category_id=income_cat.id if income_cat else None,
                transaction_type=TransactionType.INCOME,
                amount=income_amount,
                currency="INR",
                description=payload.income_source.strip() or "Opening Monthly Inflow",
                merchant_name=payload.income_source.strip() or "Salary",
                status=TransactionStatus.POSTED,
                transaction_date=datetime.now(timezone.utc),
            )
            db.add(tx)
            apply_balance_change(
                target_acc,
                balance_delta(target_acc.account_type, TransactionType.INCOME, income_amount),
            )

        pref = await get_or_create_preferences(db, user)
        curr_step = int(pref.onboarding_step) if getattr(pref, "onboarding_step", None) is not None else 1
        pref.onboarding_step = max(curr_step, 3)

        await db.commit()

        _USER_ONBOARDING_STATE[user.id] = {"step": 3, "completed": False}

        return {
            "success": True,
            "message": "Income details saved to ledger",
            "step": 3,
            "income": {
                "income_source": payload.income_source,
                "monthly_income": str(income_amount),
                "record_initial_income": payload.record_initial_income,
            },
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error in save_step_2_income: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to save income: {exc}",
        ) from exc


@router.post("/step-3")
@getting_started_router.post("/step-3")
async def save_step_3_policy(
    payload: Step3PolicyRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Step 3 API: Persists user financial preferences and risk parameters to PostgreSQL.
    """
    try:
        pref = await get_or_create_preferences(db, user)

        pref.monthly_savings_target_pct = Decimal(str(payload.savings_target))
        pref.emergency_fund_months = int(payload.emergency_months)

        risk = payload.risk_tolerance.lower().strip()
        if risk in RISK_VALUES:
            pref.risk_tolerance = risk

        curr_step = int(pref.onboarding_step) if getattr(pref, "onboarding_step", None) is not None else 1
        pref.onboarding_step = max(curr_step, 4)

        await db.commit()
        await db.refresh(pref)

        _USER_ONBOARDING_STATE[user.id] = {"step": 4, "completed": False}

        return {
            "success": True,
            "message": "Financial policy preferences saved",
            "step": 4,
            "policy": {
                "savings_target": float(pref.monthly_savings_target_pct),
                "emergency_months": int(pref.emergency_fund_months),
                "risk_tolerance": pref.risk_tolerance,
            },
        }
    except Exception as exc:
        logger.exception("Error in save_step_3_policy: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to save policy: {exc}",
        ) from exc


@router.post("/step-4")
@getting_started_router.post("/step-4")
async def save_step_4_budgets(
    payload: Step4BudgetsRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Step 4 API: Persists monthly category budget limits to PostgreSQL.
    """
    try:
        saved_budgets = []

        for b in payload.budgets:
            limit_val = Decimal(str(b.monthly_limit))
            if limit_val <= 0:
                continue

            try:
                cat_id = UUID(str(b.category_id))
            except (ValueError, TypeError):
                continue

            existing_res = await db.execute(
                select(Budget).where(
                    Budget.user_id == user.id,
                    Budget.category_id == cat_id,
                )
            )
            budget = existing_res.scalar_one_or_none()

            if budget is not None:
                budget.monthly_limit = limit_val
            else:
                budget = Budget(
                    user_id=user.id,
                    category_id=cat_id,
                    monthly_limit=limit_val,
                )
                db.add(budget)

            saved_budgets.append(budget)

        if len(saved_budgets) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one valid category budget with a monthly limit (> 0) is mandatory.",
            )

        pref = await get_or_create_preferences(db, user)
        curr_step = int(pref.onboarding_step) if getattr(pref, "onboarding_step", None) is not None else 1
        pref.onboarding_step = max(curr_step, 5)

        await db.commit()

        _USER_ONBOARDING_STATE[user.id] = {"step": 5, "completed": False}

        return {
            "success": True,
            "message": f"Saved {len(saved_budgets)} category budget limits to database",
            "step": 5,
        }
    except Exception as exc:
        logger.exception("Error in save_step_4_budgets: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to save budgets: {exc}",
        ) from exc


@router.delete("/budgets/{category_id}")
@router.delete("/step-4/{category_id}")
@getting_started_router.delete("/budgets/{category_id}")
@getting_started_router.delete("/step-4/{category_id}")
async def delete_onboarding_budget(
    category_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Delete a specific onboarding category budget.
    """
    try:
        b_res = await db.execute(
            select(Budget).where(
                Budget.user_id == user.id,
                Budget.category_id == category_id,
            )
        )
        budget = b_res.scalar_one_or_none()
        if budget is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Budget not found",
            )

        await db.delete(budget)
        await db.flush()

        remaining_res = await db.execute(
            select(Budget)
            .options(selectinload(Budget.category))
            .where(Budget.user_id == user.id)
        )
        remaining = list(remaining_res.scalars().all())

        pref = await get_or_create_preferences(db, user)
        if not remaining and not pref.onboarding_completed:
            curr_step = int(pref.onboarding_step) if getattr(pref, "onboarding_step", None) is not None else 1
            if curr_step > 4:
                pref.onboarding_step = 4

        await db.commit()

        return {
            "success": True,
            "message": "Budget cap successfully deleted",
            "step": pref.onboarding_step if not pref.onboarding_completed else 5,
            "budgets": [
                {
                    "category_id": str(b.category_id),
                    "category_name": b.category.name if b.category else "",
                    "monthly_limit": str(b.monthly_limit) if b.monthly_limit is not None else "0",
                }
                for b in remaining
            ],
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Error in delete_onboarding_budget: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to delete budget: {exc}",
        ) from exc


@router.delete("/budgets")
@router.delete("/step-4")
@getting_started_router.delete("/budgets")
@getting_started_router.delete("/step-4")
async def delete_all_onboarding_budgets(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Delete/clear all category budgets for the user.
    """
    try:
        b_res = await db.execute(
            select(Budget).where(Budget.user_id == user.id)
        )
        budgets = list(b_res.scalars().all())
        for b in budgets:
            await db.delete(b)

        pref = await get_or_create_preferences(db, user)
        if not pref.onboarding_completed:
            curr_step = int(pref.onboarding_step) if getattr(pref, "onboarding_step", None) is not None else 1
            if curr_step > 4:
                pref.onboarding_step = 4

        await db.commit()

        return {
            "success": True,
            "message": f"Successfully deleted {len(budgets)} budget limits",
            "step": 4,
            "budgets": [],
        }
    except Exception as exc:
        logger.exception("Error in delete_all_onboarding_budgets: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to delete budgets: {exc}",
        ) from exc


@router.post("/complete")
@getting_started_router.post("/complete")
async def complete_onboarding(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """
    Step 5 API: Finalizes onboarding and activates live workspace.
    """
    try:
        pref = await get_or_create_preferences(db, user)
        pref.onboarding_completed = True
        pref.onboarding_step = 5
        await db.commit()

        _USER_ONBOARDING_STATE[user.id] = {"step": 5, "completed": True}

        return {
            "success": True,
            "completed": True,
            "message": "CFO Workspace setup complete",
        }
    except Exception as exc:
        logger.exception("Error in complete_onboarding: %s", exc)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to complete onboarding: {exc}",
        ) from exc
