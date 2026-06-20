"""
ETL Pipeline – Incremental Load with Data Lineage.

Architecture:
  1. Extract  – Read raw CSV; auto-generate if missing
  2. Validate – Run data quality assertions (DataQualityError on failure)
  3. Transform – Type coercion, imputation, classification, hash computation
  4. Load     – Incremental upsert (hash-based dedup), aggregate refresh
  5. Audit    – Record EtlRun metadata for lineage tracking

Key change from original:
  - Full refresh (DELETE + INSERT) replaced with hash-based incremental load.
  - source_hash computed per row; rows already in DB are skipped.
  - EtlRun record created at start, updated at end with metrics and status.
  - All DB operations use SQLAlchemy ORM (not raw sqlite3).
  - Structured logging with per-phase timing.
"""

import logging
import os
import sys
from datetime import datetime
from typing import Dict, Set, Tuple

import pandas as pd

# Resolve paths so this module runs from any working directory
_ETL_DIR = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_ETL_DIR)
_BACKEND_DIR = os.path.join(_ROOT, "backend")

for _path in (_ROOT, _BACKEND_DIR, _ETL_DIR):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from data_quality import DataQualityError, run_all_checks
from raw_data_generator import RAW_FILE, generate_data

from database import SessionLocal
from orm_models import (
    AggregatedMetrics,
    Category,
    CategoryAggregation,
    EtlRun,
    Transaction,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Phase 1: Extract
# ---------------------------------------------------------------------------

def extract() -> pd.DataFrame:
    """
    Read raw CSV transactions. Auto-generates the file if missing.
    Returns a raw, unvalidated DataFrame.
    """
    if not os.path.exists(RAW_FILE):
        logger.info("Raw file not found – generating synthetic data.")
        generate_data()

    df = pd.read_csv(RAW_FILE)
    logger.info("Extracted %d records from %s", len(df), RAW_FILE)
    return df


# ---------------------------------------------------------------------------
# Phase 2: Transform
# ---------------------------------------------------------------------------

def transform(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and enrich the raw DataFrame.

    Steps:
      1. Impute missing categories
      2. Coerce types (date, amount)
      3. Infer transaction type from amount sign
      4. Compute source_hash for deduplication
      5. Add month column for aggregation
    """
    # Impute nulls before type operations
    df["category_name"] = df["category_name"].fillna("Uncategorized")
    df["description"] = df["description"].fillna("")

    # Type coercion
    df["transaction_date"] = pd.to_datetime(df["transaction_date"], errors="coerce")
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")

    # Drop rows with unparseable dates or amounts
    pre_len = len(df)
    df = df.dropna(subset=["transaction_date", "amount"])
    rejected = pre_len - len(df)
    if rejected > 0:
        logger.warning("Rejected %d rows with unparseable dates or amounts.", rejected)

    # Infer type from sign of amount
    df["type"] = df["amount"].apply(lambda x: "income" if x > 0 else "expense")

    # Compute deduplication hash
    df["source_hash"] = df.apply(
        lambda row: Transaction.compute_hash(
            date=row["transaction_date"].strftime("%Y-%m-%d"),
            amount=row["amount"],
            description=str(row["description"]),
            category_name=str(row["category_name"]),
        ),
        axis=1,
    )

    # Add month column for aggregation
    df["month"] = df["transaction_date"].dt.to_period("M").astype(str)

    logger.info("Transformation complete. %d valid records ready for load.", len(df))
    return df


# ---------------------------------------------------------------------------
# Phase 3: Load
# ---------------------------------------------------------------------------

def load(df: pd.DataFrame) -> Tuple[int, int, int]:
    """
    Incremental load into the data warehouse.

    Returns:
        (records_inserted, records_updated, records_rejected)

    Load strategy:
      - Categories: INSERT if new (idempotent dimension load)
      - Transactions: Skip if source_hash already exists (incremental)
                      INSERT new records only
      - Aggregated metrics: Full refresh per affected month (aggregate table)
      - Category aggregations: Full refresh per affected month
    """
    db = SessionLocal()
    inserted = 0
    skipped = 0
    rejected = 0

    try:
        # -- 1. Upsert categories (dimension load) -------------------------
        unique_cats = df[["category_name", "type"]].drop_duplicates()
        cat_map: Dict[str, int] = {}

        for _, row in unique_cats.iterrows():
            cat = db.query(Category).filter(Category.name == row["category_name"]).first()
            if not cat:
                cat = Category(name=row["category_name"], type=row["type"])
                db.add(cat)
                db.flush()
            cat_map[row["category_name"]] = cat.id

        logger.info("Category dimension updated. %d categories.", len(cat_map))

        # -- 2. Fetch existing hashes for deduplication --------------------
        existing_hashes: Set[str] = {
            row[0]
            for row in db.query(Transaction.source_hash)
            .filter(Transaction.source_hash.isnot(None))
            .all()
        }
        logger.info("Found %d existing transaction hashes in warehouse.", len(existing_hashes))

        # -- 3. Incremental transaction insert -----------------------------
        new_rows = []
        for _, row in df.iterrows():
            h = row["source_hash"]
            if h in existing_hashes:
                skipped += 1
                continue

            cat_id = cat_map.get(row["category_name"])
            if cat_id is None:
                logger.warning("No category mapping for '%s' – rejecting row.", row["category_name"])
                rejected += 1
                continue

            new_rows.append(Transaction(
                date=row["transaction_date"].strftime("%Y-%m-%d"),
                amount=float(row["amount"]),
                description=str(row["description"]),
                category_id=cat_id,
                source_hash=h,
            ))

        if new_rows:
            db.bulk_save_objects(new_rows)
            db.flush()
            inserted = len(new_rows)

        logger.info(
            "Transactions – inserted: %d | skipped (existing): %d | rejected: %d",
            inserted, skipped, rejected,
        )

        # -- 4. Refresh aggregations for affected months -------------------
        affected_months = df["month"].unique().tolist()
        _refresh_aggregations(db, affected_months)

        db.commit()
        logger.info("Load phase committed successfully.")

    except Exception as exc:
        db.rollback()
        logger.error("Load phase failed, rolled back: %s", exc)
        raise
    finally:
        db.close()

    return inserted, 0, rejected  # (inserted, updated, rejected)


def _refresh_aggregations(db, months):
    """
    Recompute aggregated_metrics and category_aggregations for the given months.
    This is a targeted refresh (not a full table wipe) — only affected months.
    """
    for month in months:
        # Fetch all transactions for this month via SQL
        txns = (
            db.query(Transaction)
            .filter(Transaction.date.like(f"{month}%"))
            .all()
        )

        if not txns:
            continue

        total_income = sum(t.amount for t in txns if t.amount > 0)
        total_expenses = abs(sum(t.amount for t in txns if t.amount < 0))
        savings = total_income - total_expenses
        savings_rate = round((savings / total_income * 100) if total_income > 0 else 0, 2)

        # Upsert aggregated_metrics for this month
        metrics = db.query(AggregatedMetrics).filter(AggregatedMetrics.month == month).first()
        if metrics:
            metrics.total_income = total_income
            metrics.total_expenses = total_expenses
            metrics.savings = savings
            metrics.savings_rate = savings_rate
        else:
            db.add(AggregatedMetrics(
                month=month,
                total_income=total_income,
                total_expenses=total_expenses,
                savings=savings,
                savings_rate=savings_rate,
            ))

        # Upsert category_aggregations for this month
        cat_totals: Dict[int, float] = {}
        for t in txns:
            if t.category_id and t.amount < 0:
                cat_totals[t.category_id] = cat_totals.get(t.category_id, 0) + abs(t.amount)

        for cat_id, total in cat_totals.items():
            ca = (
                db.query(CategoryAggregation)
                .filter(CategoryAggregation.month == month, CategoryAggregation.category_id == cat_id)
                .first()
            )
            if ca:
                ca.total_amount = total
            else:
                db.add(CategoryAggregation(month=month, category_id=cat_id, total_amount=total))

    db.flush()
    logger.info("Aggregations refreshed for months: %s", months)


# ---------------------------------------------------------------------------
# Pipeline Orchestrator
# ---------------------------------------------------------------------------

def run_pipeline() -> None:
    """
    Execute the complete ETL pipeline with audit logging.

    Creates an EtlRun record at start, updates it on completion or failure.
    Raises on fatal errors (DataQualityError, unexpected exceptions).
    """
    started_at = datetime.utcnow()
    db = SessionLocal()

    # Create the audit record
    etl_run = EtlRun(started_at=started_at, source_file=RAW_FILE, status="running")
    db.add(etl_run)
    db.commit()
    run_id = etl_run.id
    db.close()

    logger.info("ETL pipeline started. Run ID: %d", run_id)

    try:
        # Extract
        raw_df = extract()

        # Validate
        run_all_checks(raw_df)

        # Transform
        clean_df = transform(raw_df)

        # Load
        inserted, updated, rejected = load(clean_df)

        # Update audit record on success
        db = SessionLocal()
        run = db.query(EtlRun).filter(EtlRun.id == run_id).first()
        if run:
            run.completed_at = datetime.utcnow()
            run.records_extracted = len(raw_df)
            run.records_inserted = inserted
            run.records_updated = updated
            run.records_rejected = rejected
            run.status = "completed"
            db.commit()
        db.close()

        logger.info(
            "ETL pipeline completed. Run ID: %d | Extracted: %d | Inserted: %d | Rejected: %d",
            run_id, len(raw_df), inserted, rejected,
        )

    except DataQualityError as dqe:
        _mark_etl_failed(run_id, f"Data quality failure: {dqe}")
        raise

    except Exception as exc:
        _mark_etl_failed(run_id, str(exc))
        raise


def _mark_etl_failed(run_id: int, error_message: str) -> None:
    """Update the EtlRun record to reflect a pipeline failure."""
    db = SessionLocal()
    try:
        run = db.query(EtlRun).filter(EtlRun.id == run_id).first()
        if run:
            run.completed_at = datetime.utcnow()
            run.status = "failed"
            run.error_message = error_message[:2000]  # Truncate to fit column
            db.commit()
    except Exception as exc:
        logger.error("Failed to update EtlRun failure record: %s", exc)
    finally:
        db.close()
    logger.error("ETL pipeline failed. Run ID: %d | Error: %s", run_id, error_message)


if __name__ == "__main__":
    run_pipeline()
