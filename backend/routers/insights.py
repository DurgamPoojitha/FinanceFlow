"""
Insights Router – Rule-Based Financial Insights Engine.

Endpoint:
  GET /api/insights               – Return all insights (most recent first)
  GET /api/insights?month=YYYY-MM – Return insights for a specific month

The engine generates insights on first request per month (lazy evaluation)
and caches them in the insights table to avoid redundant computation.

Changes from original:
  - Replaced raw sqlite3 with SQLAlchemy ORM
  - Removed hardcoded MOCK_BUDGET = 3000.0 → budget read from DB
  - Added explicit type annotations
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import InsightModel
from orm_models import AggregatedMetrics, Insight
from routers.budgets import get_budget_amount_for_month

logger = logging.getLogger(__name__)
router = APIRouter()


def generate_insights_for_month(month: str, db: Session) -> None:
    """
    Generate and persist financial insights for a given month.

    This is idempotent — if insights already exist for the month,
    the function returns immediately (cache hit).

    Rules applied:
      1. Savings rate drop > 5% vs. previous month → warning
      2. Expense spike > 20% vs. previous month → warning
      3. Savings rate ≥ 20% and maintained or improved → positive
      4. Expenses exceed configured monthly budget → warning
      5. Expenses under 80% of configured budget → positive
      6. Fallback: stable financial habits → neutral
    """
    # Cache check — skip if already computed
    existing = db.query(Insight).filter(Insight.month == month).first()
    if existing:
        return

    curr = db.query(AggregatedMetrics).filter(AggregatedMetrics.month == month).first()
    if not curr:
        return

    prev = (
        db.query(AggregatedMetrics)
        .filter(AggregatedMetrics.month < month)
        .order_by(AggregatedMetrics.month.desc())
        .first()
    )

    budget = get_budget_amount_for_month(month, db)
    insights: List[tuple] = []

    # Rule 1 – Savings rate drop
    if prev and curr.savings_rate < prev.savings_rate:
        drop = round(prev.savings_rate - curr.savings_rate, 1)
        if drop > 5.0:
            insights.append((
                f"Your savings rate dropped by {drop}% compared to last month.",
                "warning",
            ))

    # Rule 2 – Expense spike
    if prev and prev.total_expenses > 0:
        if curr.total_expenses > prev.total_expenses * 1.2:
            pct = round(((curr.total_expenses - prev.total_expenses) / prev.total_expenses) * 100, 1)
            insights.append((
                f"Your expenses increased by {pct}% compared to last month.",
                "warning",
            ))

    # Rule 3 – Healthy savings rate maintained
    if curr.savings_rate >= 20.0:
        if prev is None or curr.savings_rate >= prev.savings_rate:
            insights.append((
                "Great job! You maintained a healthy savings rate above 20%.",
                "positive",
            ))

    # Rule 4 – Budget overspend (uses configured budget from DB)
    if curr.total_expenses > budget:
        overage = round(curr.total_expenses - budget, 2)
        insights.append((
            f"You exceeded your ${budget:,.0f} monthly budget by ${overage:,.2f}.",
            "warning",
        ))
    elif curr.total_expenses < budget * 0.8:
        # Rule 5 – Well under budget
        remaining = round(budget - curr.total_expenses, 2)
        insights.append((
            f"You stayed ${remaining:,.2f} under your ${budget:,.0f} monthly budget. Excellent discipline.",
            "positive",
        ))

    # Rule 6 – Fallback
    if not insights:
        insights.append((
            "Your financial habits look stable this month. No major anomalies detected.",
            "neutral",
        ))

    for text, itype in insights:
        db.add(Insight(month=month, insight_text=text, type=itype))

    db.flush()
    logger.info("Generated %d insights for month %s", len(insights), month)


@router.get("/insights", response_model=List[InsightModel])
def get_insights(
    month: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Return financial insights.

    If `month` is provided, generates insights for that month on first call
    (lazy evaluation), then serves from the cache.
    Returns the 10 most recent insights if no month is specified.
    """
    if month:
        generate_insights_for_month(month, db)

    query = db.query(Insight)
    if month:
        query = query.filter(Insight.month == month)
    rows = query.order_by(Insight.id.desc()).limit(10).all()

    return [
        InsightModel(id=row.id, month=row.month, insight_text=row.insight_text, type=row.type)
        for row in rows
    ]
