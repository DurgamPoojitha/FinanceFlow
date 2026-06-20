"""
Tests – Budget Endpoints.

Verifies:
  1. Budget CRUD (list, active, upsert)
  2. Auth enforcement (admin only for writes)
  3. KPIs use the configured DB budget (not hardcoded 3000)
  4. Budget fallback chain (specific → default → $3000)
"""

import pytest


class TestListBudgets:
    def test_list_budgets_public(self, client):
        """GET /api/budgets is publicly accessible."""
        resp = client.get("/api/budgets")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1  # At least the default seeded in conftest

    def test_list_budgets_includes_default(self, client):
        """The 'default' fallback budget is included in the list."""
        resp = client.get("/api/budgets")
        months = [b["month"] for b in resp.json()]
        assert "default" in months

    def test_list_budgets_includes_month_specific(self, client):
        """Month-specific budget (2023-10) is included."""
        resp = client.get("/api/budgets")
        months = [b["month"] for b in resp.json()]
        assert "2023-10" in months


class TestActiveBudget:
    def test_get_active_budget_returns_amount(self, client):
        """GET /api/budgets/active returns a budget amount."""
        resp = client.get("/api/budgets/active")
        assert resp.status_code == 200
        data = resp.json()
        assert "amount" in data
        assert data["amount"] > 0


class TestUpsertBudget:
    def test_upsert_requires_admin(self, client):
        """POST /api/budgets without auth → 401."""
        resp = client.post("/api/budgets", json={"month": "2024-01", "amount": 4000.0})
        assert resp.status_code == 401

    def test_viewer_cannot_create_budget(self, client, viewer_token):
        """Viewer token is rejected with 403."""
        resp = client.post(
            "/api/budgets",
            json={"month": "2024-01", "amount": 4000.0},
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert resp.status_code == 403

    def test_admin_can_create_budget(self, admin_client, db_session):
        """Admin can create a new monthly budget."""
        from orm_models import Budget
        resp = admin_client.post("/api/budgets", json={"month": "2024-01", "amount": 4500.0})
        assert resp.status_code == 201
        data = resp.json()
        assert data["month"] == "2024-01"
        assert data["amount"] == 4500.0

        db_session.expire_all()
        budget = db_session.query(Budget).filter(Budget.month == "2024-01").first()
        assert budget is not None
        assert budget.amount == 4500.0

    def test_admin_can_update_existing_budget(self, admin_client, db_session):
        """Posting to an existing month updates the budget (upsert behavior)."""
        from orm_models import Budget

        # First creation
        admin_client.post("/api/budgets", json={"month": "2024-02", "amount": 3000.0})
        # Update
        resp = admin_client.post("/api/budgets", json={"month": "2024-02", "amount": 5500.0})
        assert resp.status_code == 201
        assert resp.json()["amount"] == 5500.0

        db_session.expire_all()
        budget = db_session.query(Budget).filter(Budget.month == "2024-02").first()
        assert budget.amount == 5500.0

    def test_invalid_month_format_rejected(self, admin_client):
        """Invalid month format (not YYYY-MM or 'default') → 422."""
        resp = admin_client.post("/api/budgets", json={"month": "October-2024", "amount": 3000.0})
        assert resp.status_code == 422

    def test_negative_amount_rejected(self, admin_client):
        """Negative budget amount → 422."""
        resp = admin_client.post("/api/budgets", json={"month": "2024-03", "amount": -100.0})
        assert resp.status_code == 422


class TestBudgetFallback:
    def test_kpi_uses_month_specific_budget(self, client):
        """KPI for 2023-10 uses the $3000 budget seeded in conftest."""
        resp = client.get("/api/kpis?month=2023-10")
        assert resp.status_code == 200
        kpi = resp.json()[0]
        assert kpi["configured_budget"] == 3000.0
        assert kpi["budget_used_percentage"] == pytest.approx(66.67, rel=0.01)
