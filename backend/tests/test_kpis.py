"""
Tests – KPI Endpoints.

Updated to:
  - Use SQLAlchemy-based fixtures (not raw sqlite3)
  - Assert 'expense_efficiency' instead of deprecated 'roi'
  - Assert 'configured_budget' in response
  - Verify budget-aware KPI calculation
"""

import pytest


def test_get_kpis_returns_data(client):
    """GET /api/kpis returns a non-empty list with correct structure."""
    response = client.get("/api/kpis")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    kpi = data[0]
    assert kpi["month"] == "2023-10"
    assert kpi["total_income"] == 5000.0
    assert kpi["total_expenses"] == 2000.0
    assert kpi["savings"] == 3000.0
    assert kpi["savings_rate"] == 60.0


def test_kpi_expense_efficiency_formula(client):
    """
    expense_efficiency = (savings / total_expenses) × 100
    = (3000 / 2000) × 100 = 150.0
    """
    response = client.get("/api/kpis?month=2023-10")
    assert response.status_code == 200
    kpi = response.json()[0]

    expected_efficiency = round((3000.0 / 2000.0) * 100, 2)
    assert kpi["expense_efficiency"] == expected_efficiency

    # Ensure the old 'roi' key is gone
    assert "roi" not in kpi


def test_kpi_budget_utilization_uses_db_budget(client):
    """
    budget_used_percentage = (total_expenses / configured_budget) × 100
    Seeded budget for 2023-10 = $3000
    = (2000 / 3000) × 100 = 66.67%
    """
    response = client.get("/api/kpis?month=2023-10")
    assert response.status_code == 200
    kpi = response.json()[0]

    expected_budget_pct = round((2000.0 / 3000.0) * 100, 2)
    assert kpi["budget_used_percentage"] == expected_budget_pct
    assert kpi["configured_budget"] == 3000.0


def test_get_kpis_with_month_filter(client):
    """GET /api/kpis?month=YYYY-MM returns only that month."""
    response = client.get("/api/kpis?month=2023-10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["month"] == "2023-10"


def test_get_kpis_not_found(client):
    """GET /api/kpis?month=2099-01 returns 404 for a nonexistent month."""
    response = client.get("/api/kpis?month=2099-01")
    assert response.status_code == 404


def test_get_category_percentages(client):
    """GET /api/kpis/categories returns correct percentage breakdown."""
    response = client.get("/api/kpis/categories?month=2023-10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    food = next((c for c in data if c["category_name"] == "Food"), None)
    assert food is not None
    assert food["amount"] == 2000.0
    assert food["percentage"] == 100.0  # Only expense category seeded
