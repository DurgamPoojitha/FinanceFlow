"""
KPI Router – Monthly Key Performance Indicators.

Endpoints:
  GET /api/kpis                      – List KPIs (up to 12 months)
  GET /api/kpis?month=YYYY-MM        – KPIs for a specific month
  GET /api/kpis/categories?month=... – Spending breakdown by category

Changes from original:
  - Replaced raw sqlite3 with SQLAlchemy ORM
  - Removed hardcoded MOCK_BUDGET = 3000.0 → budget read from DB
  - Renamed 'roi' → 'expense_efficiency' with correct formula documentation
  - KPIModel now includes configured_budget for frontend transparency
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import CategoryPercentage, KPIModel
from orm_models import AggregatedMetrics, Category, CategoryAggregation
from routers.budgets import get_budget_amount_for_month

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/kpis", response_model=List[KPIModel])
def get_kpis(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Return monthly KPIs.

    If `month` is provided (YYYY-MM), returns only that month's KPIs.
    Otherwise, returns the 12 most recent months.

    KPI Formulas:
      Savings Rate       = (savings / total_income) × 100
      Expense Efficiency = (savings / total_expenses) × 100
      Budget Utilization = (total_expenses / configured_budget) × 100
    """
    query = db.query(AggregatedMetrics)
    if month:
        query = query.filter(AggregatedMetrics.month == month)
    rows = query.order_by(AggregatedMetrics.month.desc()).limit(12).all()

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No KPI data found{' for month ' + month if month else ''}.",
        )

    result = []
    for row in rows:
        budget = get_budget_amount_for_month(row.month, db)

        # Expense Efficiency: how many dollars saved per dollar spent
        # Formula: (savings / total_expenses) × 100
        # e.g., savings=$1500, expenses=$3000 → 50% efficiency
        expense_efficiency = (
            round((row.savings / row.total_expenses) * 100, 2)
            if row.total_expenses > 0
            else 0.0
        )

        budget_used_pct = round((row.total_expenses / budget) * 100, 2) if budget > 0 else 0.0

        result.append(KPIModel(
            month=row.month,
            total_income=row.total_income,
            total_expenses=row.total_expenses,
            savings=row.savings,
            savings_rate=row.savings_rate,
            expense_efficiency=expense_efficiency,
            budget_used_percentage=budget_used_pct,
            configured_budget=budget,
        ))

    return result


@router.get("/kpis/categories", response_model=List[CategoryPercentage])
def get_category_percentages(
    month: str,
    db: Session = Depends(get_db),
):
    """
    Return the spending breakdown by category for a given month.
    Percentages are relative to total expenses for that month.
    """
    metrics = db.query(AggregatedMetrics).filter(AggregatedMetrics.month == month).first()
    if not metrics or metrics.total_expenses == 0:
        return []

    rows = (
        db.query(CategoryAggregation, Category)
        .join(Category, CategoryAggregation.category_id == Category.id)
        .filter(
            CategoryAggregation.month == month,
            Category.type == "expense",
        )
        .order_by(CategoryAggregation.total_amount.desc())
        .all()
    )

    return [
        CategoryPercentage(
            category_name=cat.name,
            percentage=round((agg.total_amount / metrics.total_expenses) * 100, 2),
            amount=agg.total_amount,
        )
        for agg, cat in rows
    ]
