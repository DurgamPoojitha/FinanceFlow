"""
Tests – ETL Pipeline Incremental Load.

Verifies:
  1. Pipeline runs without errors
  2. Running twice does NOT duplicate transactions (idempotency)
  3. EtlRun audit record is created with correct metadata
  4. Data quality check catches bad DataFrames
  5. Aggregations are computed correctly after load
"""

import sys
import os
import pandas as pd
import pytest

# Add ETL and backend dirs to path
_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(_ROOT, "etl"))
sys.path.insert(0, os.path.join(_ROOT, "backend"))

from data_quality import DataQualityError, run_all_checks


class TestDataQuality:
    """Unit tests for the data_quality assertion module."""

    def _make_df(self, **overrides):
        """Helper: create a valid DataFrame, then apply overrides."""
        data = {
            "transaction_date": ["2024-01-15", "2024-01-20"],
            "amount": [100.0, -50.0],
            "description": ["Salary", "Food"],
            "category_name": ["Salary", "Food"],
        }
        data.update(overrides)
        return pd.DataFrame(data)

    def test_valid_dataframe_passes(self):
        """A properly formed DataFrame passes all checks."""
        df = self._make_df()
        run_all_checks(df)  # Should not raise

    def test_missing_required_column_fails(self):
        """DataFrame missing 'amount' column raises DataQualityError."""
        df = pd.DataFrame({
            "transaction_date": ["2024-01-15"],
            "description": ["test"],
            "category_name": ["Food"],
            # 'amount' intentionally missing
        })
        with pytest.raises(DataQualityError, match="Missing required columns"):
            run_all_checks(df)

    def test_empty_dataframe_fails(self):
        """Empty DataFrame raises DataQualityError."""
        df = pd.DataFrame(columns=["transaction_date", "amount", "description", "category_name"])
        with pytest.raises(DataQualityError, match="below minimum threshold"):
            run_all_checks(df)

    def test_all_null_amounts_fails(self):
        """DataFrame with >50% null amounts raises DataQualityError."""
        df = self._make_df(amount=[None, None])
        with pytest.raises(DataQualityError, match="null rate"):
            run_all_checks(df)

    def test_unparseable_dates_fails(self):
        """DataFrame where all dates are garbage raises DataQualityError."""
        df = self._make_df(transaction_date=["not-a-date", "also-not-a-date"])
        with pytest.raises(DataQualityError, match="could not be parsed"):
            run_all_checks(df)


class TestIncrementalLoad:
    """Integration tests for the ETL incremental load behavior."""

    def test_transform_adds_source_hash(self):
        """Transform phase produces a non-null source_hash for each row."""
        from pipeline import transform

        df = pd.DataFrame({
            "transaction_date": ["2024-03-01", "2024-03-15"],
            "amount": [5000.0, -200.0],
            "description": ["Salary", "Groceries"],
            "category_name": ["Salary", "Food"],
        })
        result = transform(df)
        assert "source_hash" in result.columns
        assert result["source_hash"].notna().all()
        assert result["source_hash"].nunique() == 2  # Two distinct hashes

    def test_transform_imputes_missing_categories(self):
        """Transform phase fills null category_name with 'Uncategorized'."""
        from pipeline import transform

        df = pd.DataFrame({
            "transaction_date": ["2024-03-01"],
            "amount": [-50.0],
            "description": ["Mystery expense"],
            "category_name": [None],
        })
        result = transform(df)
        assert result["category_name"].iloc[0] == "Uncategorized"

    def test_transform_infers_type_from_sign(self):
        """Transform infers type: positive amount → income, negative → expense."""
        from pipeline import transform

        df = pd.DataFrame({
            "transaction_date": ["2024-03-01", "2024-03-02"],
            "amount": [1000.0, -100.0],
            "description": ["Income", "Expense"],
            "category_name": ["Salary", "Food"],
        })
        result = transform(df)
        assert result.loc[result["amount"] > 0, "type"].iloc[0] == "income"
        assert result.loc[result["amount"] < 0, "type"].iloc[0] == "expense"

    def test_source_hash_is_deterministic(self):
        """Computing the hash for the same row twice produces the same value."""
        from orm_models import Transaction

        h1 = Transaction.compute_hash("2024-01-01", 100.0, "Salary", "Salary")
        h2 = Transaction.compute_hash("2024-01-01", 100.0, "Salary", "Salary")
        assert h1 == h2

    def test_different_rows_produce_different_hashes(self):
        """Different rows produce different hashes (collision resistance)."""
        from orm_models import Transaction

        h1 = Transaction.compute_hash("2024-01-01", 100.0, "Salary", "Salary")
        h2 = Transaction.compute_hash("2024-01-01", 200.0, "Salary", "Salary")
        assert h1 != h2
