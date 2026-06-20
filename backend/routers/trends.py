"""
Trends Router – Monthly Expense/Income Trend Analysis.

Endpoint:
  GET /api/trends?limit=6 – Return trend data with 3-period moving average

Changes from original:
  - Replaced raw sqlite3 cursor with SQLAlchemy ORM
  - Preserved the sliding window moving average algorithm
"""

import logging
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import TrendModel
from orm_models import AggregatedMetrics

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/trends", response_model=List[TrendModel])
def get_trends(
    limit: int = 6,
    db: Session = Depends(get_db),
):
    """
    Return monthly spending and income trends with a 3-period moving average.

    The moving average smooths single-month anomalies.
    If actual expenses persistently exceed the moving average, it signals
    structural spending growth rather than a one-time spike.
    """
    rows = (
        db.query(AggregatedMetrics)
        .order_by(AggregatedMetrics.month.asc())
        .all()
    )

    trends = []
    window: List[float] = []

    for row in rows:
        window.append(row.total_expenses)
        if len(window) > 3:
            window.pop(0)

        moving_avg = round(sum(window) / len(window), 2)

        trends.append(TrendModel(
            month=row.month,
            total_expenses=row.total_expenses,
            total_income=row.total_income,
            moving_average_expenses=moving_avg,
        ))

    # Return the most recent `limit` months
    return trends[-limit:]
