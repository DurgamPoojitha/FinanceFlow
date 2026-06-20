"""
Monitoring Router – Health, ETL Status, and System Metrics.

Endpoints:
  GET /api/health        – Application liveness check
  GET /api/health/db     – Database connectivity check
  GET /api/etl/status    – Latest ETL run metadata
  GET /api/months        – Available months in aggregated_metrics
  GET /api/metrics       – Basic system usage statistics
"""

import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from database import engine, get_db
from models import EtlRunModel
from orm_models import AggregatedMetrics, EtlRun, Transaction

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
def health_check():
    """
    Application liveness endpoint.
    Used by load balancers, Docker health checks, and uptime monitors.
    Always returns 200 if the application process is running.
    """
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "FinanceFlow BI API",
    }


@router.get("/health/db")
def database_health(db: Session = Depends(get_db)):
    """
    Database connectivity check.
    Executes a minimal query to verify the database is reachable and responsive.
    """
    try:
        db.execute(text("SELECT 1"))
        tx_count = db.query(func.count(Transaction.id)).scalar()
        return {
            "status": "ok",
            "database": "connected",
            "transaction_count": tx_count,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity failed: {str(exc)}",
        )


@router.get("/etl/status", response_model=Optional[EtlRunModel])
def get_etl_status(db: Session = Depends(get_db)):
    """
    Return metadata for the most recent ETL pipeline execution.
    Enables monitoring of data freshness and pipeline health.
    """
    run = db.query(EtlRun).order_by(EtlRun.id.desc()).first()
    if not run:
        return None

    return EtlRunModel(
        id=run.id,
        started_at=run.started_at.isoformat() if run.started_at else None,
        completed_at=run.completed_at.isoformat() if run.completed_at else None,
        source_file=run.source_file,
        records_extracted=run.records_extracted or 0,
        records_inserted=run.records_inserted or 0,
        records_updated=run.records_updated or 0,
        records_rejected=run.records_rejected or 0,
        status=run.status,
        error_message=run.error_message,
    )


@router.get("/months", response_model=List[str])
def get_available_months(db: Session = Depends(get_db)):
    """
    Return the list of months that have aggregated KPI data available.
    Used by the frontend MonthSelector to populate the dropdown.
    Returns months in descending order (most recent first).
    """
    rows = (
        db.query(AggregatedMetrics.month)
        .order_by(AggregatedMetrics.month.desc())
        .all()
    )
    return [row.month for row in rows]


@router.get("/metrics")
def get_system_metrics(db: Session = Depends(get_db)):
    """
    Basic system usage statistics.
    Returns aggregate counts useful for admin dashboards.
    """
    tx_count = db.query(func.count(Transaction.id)).scalar()
    month_count = db.query(func.count(AggregatedMetrics.id)).scalar()
    latest_etl = db.query(EtlRun).order_by(EtlRun.id.desc()).first()

    return {
        "total_transactions": tx_count,
        "months_with_data": month_count,
        "last_etl_run": latest_etl.started_at.isoformat() if latest_etl else None,
        "last_etl_status": latest_etl.status if latest_etl else "never_run",
        "timestamp": datetime.utcnow().isoformat(),
    }
