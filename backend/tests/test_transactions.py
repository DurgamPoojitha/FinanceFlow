"""
Tests – Transactions GET endpoint.

Verifies the read-only transaction listing endpoint works correctly
with the SQLAlchemy-based conftest fixtures.
"""

import pytest


def test_get_transactions(client):
    """GET /api/transactions returns 200 with a list of transactions."""
    response = client.get("/api/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2  # 2 seeded in conftest

    descriptions = [item["description"] for item in data]
    assert "Tech Corp Salary" in descriptions
    assert "Groceries" in descriptions

    # Verify type casing
    salary_txn = next(t for t in data if t["description"] == "Tech Corp Salary")
    assert salary_txn["amount"] == 5000.0
    assert salary_txn["category_name"] == "Salary"
    assert salary_txn["type"] == "income"
