"""
ETL Data Quality Module.

Validates raw DataFrames extracted from source files before transformation.
All assertions must pass before the pipeline continues.
Raises DataQualityError on any failure to prevent bad data from reaching the warehouse.
"""

import logging
from typing import List

import pandas as pd

logger = logging.getLogger(__name__)


class DataQualityError(Exception):
    """Raised when a data quality assertion fails."""
    pass


REQUIRED_COLUMNS: List[str] = ["transaction_date", "amount", "description", "category_name"]
MIN_ROW_COUNT: int = 1
MAX_NULL_RATE: float = 0.50   # Max 50% nulls in any critical column
AMOUNT_MIN: float = -100_000.0
AMOUNT_MAX: float = 100_000.0


def assert_required_columns(df: pd.DataFrame) -> None:
    """Fail if any expected column is absent from the DataFrame."""
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise DataQualityError(
            f"Missing required columns: {missing}. "
            f"Found columns: {list(df.columns)}"
        )
    logger.info("✓ Required columns present: %s", REQUIRED_COLUMNS)


def assert_minimum_rows(df: pd.DataFrame) -> None:
    """Fail if the DataFrame is empty."""
    if len(df) < MIN_ROW_COUNT:
        raise DataQualityError(
            f"Extracted {len(df)} rows — below minimum threshold of {MIN_ROW_COUNT}."
        )
    logger.info("✓ Row count: %d (minimum: %d)", len(df), MIN_ROW_COUNT)


def assert_amount_not_all_null(df: pd.DataFrame) -> None:
    """Fail if the amount column has a null rate above the threshold."""
    null_rate = df["amount"].isnull().mean()
    if null_rate > MAX_NULL_RATE:
        raise DataQualityError(
            f"'amount' column null rate is {null_rate:.1%}, exceeds {MAX_NULL_RATE:.1%} threshold."
        )
    logger.info("✓ Amount null rate: %.1f%%", null_rate * 100)


def assert_amount_range(df: pd.DataFrame) -> None:
    """Warn if any amount exceeds plausible bounds (does not raise — just logs)."""
    numeric_amounts = pd.to_numeric(df["amount"], errors="coerce").dropna()
    outliers = numeric_amounts[(numeric_amounts < AMOUNT_MIN) | (numeric_amounts > AMOUNT_MAX)]
    if len(outliers) > 0:
        logger.warning(
            "⚠ %d amount(s) outside plausible range [%s, %s]. Values: %s",
            len(outliers), AMOUNT_MIN, AMOUNT_MAX, outliers.tolist()[:10],
        )
    else:
        logger.info("✓ All amounts within plausible range [%s, %s]", AMOUNT_MIN, AMOUNT_MAX)


def assert_dates_parseable(df: pd.DataFrame) -> None:
    """Fail if transaction_date column cannot be parsed as dates."""
    try:
        parsed = pd.to_datetime(df["transaction_date"], errors="coerce")
        unparseable_count = parsed.isnull().sum()
        if unparseable_count > len(df) * MAX_NULL_RATE:
            raise DataQualityError(
                f"{unparseable_count} of {len(df)} transaction_date values could not be parsed as dates."
            )
        logger.info("✓ Dates parseable. Unparseable: %d / %d", unparseable_count, len(df))
    except Exception as exc:
        if isinstance(exc, DataQualityError):
            raise
        raise DataQualityError(f"Date parsing failed: {exc}") from exc


def run_all_checks(df: pd.DataFrame) -> None:
    """
    Run all data quality assertions on the extracted DataFrame.
    Call this between Extract and Transform phases.
    Raises DataQualityError on the first failure.
    """
    logger.info("Running data quality checks on %d records...", len(df))
    assert_required_columns(df)
    assert_minimum_rows(df)
    assert_amount_not_all_null(df)
    assert_amount_range(df)
    assert_dates_parseable(df)
    logger.info("✓ All data quality checks passed.")
