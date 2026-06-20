"""
Budget Router – User-Configurable Monthly Budgets.

Endpoints:
  GET  /api/budgets         – List all configured budgets
  GET  /api/budgets/active  – Get the active budget for the current month
  POST /api/budgets         – Create or update a monthly budget (admin only)

Replaces the hardcoded MOCK_BUDGET = 3000.0 constant.
"""

import logging
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import require_role
from database import get_db
from models import BudgetCreate, BudgetModel
from orm_models import Budget

logger = logging.getLogger(__name__)
router = APIRouter()


def get_budget_amount_for_month(month: str, db: Session) -> float:
    """
    Retrieve the configured budget for a specific month.

    Lookup order:
      1. Exact YYYY-MM match in the budgets table
      2. 'default' fallback budget
      3. Hard fallback: $3,000 (if no budgets configured at all)
    """
    specific = db.query(Budget).filter(Budget.month == month).first()
    if specific:
        return specific.amount

    default = db.query(Budget).filter(Budget.month == "default").first()
    if default:
        return default.amount

    return 3000.0  # Hard fallback – matches original behavior


@router.get("/budgets", response_model=List[BudgetModel])
def list_budgets(db: Session = Depends(get_db)):
    """Return all configured budgets (specific months + default)."""
    budgets = db.query(Budget).order_by(Budget.month).all()
    return [BudgetModel(id=b.id, month=b.month, amount=b.amount) for b in budgets]


@router.get("/budgets/active", response_model=BudgetModel)
def get_active_budget(db: Session = Depends(get_db)):
    """
    Return the budget applicable to the current calendar month.
    Falls back to the 'default' budget, then to $3,000.
    """
    current_month = datetime.utcnow().strftime("%Y-%m")
    amount = get_budget_amount_for_month(current_month, db)

    # Find the actual DB record for a proper id/month response
    record = (
        db.query(Budget).filter(Budget.month == current_month).first()
        or db.query(Budget).filter(Budget.month == "default").first()
    )

    if record:
        return BudgetModel(id=record.id, month=current_month, amount=amount)

    # No budget configured at all — return the hard fallback
    return BudgetModel(id=0, month=current_month, amount=3000.0)


@router.post("/budgets", response_model=BudgetModel, status_code=status.HTTP_201_CREATED)
def upsert_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin")),
):
    """
    Create or update the budget for a given month. Admin only.

    - Use month='default' to set the global fallback budget.
    - Use month='YYYY-MM' to set a specific monthly override.
    - If a budget for the month already exists, it is updated (upsert).
    """
    existing = db.query(Budget).filter(Budget.month == payload.month).first()

    if existing:
        existing.amount = payload.amount
        existing.updated_at = datetime.utcnow()
        db.flush()
        logger.info("Updated budget for %s: $%.2f", payload.month, payload.amount)
        return BudgetModel(id=existing.id, month=existing.month, amount=existing.amount)

    new_budget = Budget(month=payload.month, amount=payload.amount)
    db.add(new_budget)
    db.flush()
    logger.info("Created budget for %s: $%.2f", payload.month, payload.amount)
    return BudgetModel(id=new_budget.id, month=new_budget.month, amount=new_budget.amount)
