"""
Tests – Transaction CRUD Endpoints.

Verifies that POST, PUT, DELETE operations:
  1. Require admin authentication (backend RBAC, not just frontend)
  2. Persist data to the database (not just in-memory state)
  3. Return correct HTTP status codes and response shapes
"""

import pytest


class TestGetTransactions:
    def test_get_transactions_public(self, client):
        """GET /api/transactions is publicly accessible (no auth required)."""
        resp = client.get("/api/transactions")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_get_transactions_returns_seeded_data(self, client):
        """Returns the transactions seeded in conftest."""
        resp = client.get("/api/transactions")
        assert resp.status_code == 200
        assert len(resp.json()) >= 2  # 2 seeded in conftest


class TestCreateTransaction:
    def test_create_requires_admin_token(self, client):
        """POST /api/transactions without auth returns 401."""
        resp = client.post("/api/transactions", json={
            "date": "2023-11-01",
            "amount": 100.0,
            "type": "Expense",
            "category": "Food",
            "description": "Test",
        })
        assert resp.status_code == 401

    def test_create_viewer_cannot_write(self, client, viewer_token):
        """Viewer token is rejected with 403 Forbidden."""
        resp = client.post(
            "/api/transactions",
            json={"date": "2023-11-01", "amount": 100.0, "type": "Expense",
                  "category": "Food", "description": "Test"},
            headers={"Authorization": f"Bearer {viewer_token}"},
        )
        assert resp.status_code == 403

    def test_create_transaction_persists(self, admin_client, db_session):
        """Admin can create a transaction; it's visible in GET afterwards."""
        from orm_models import Transaction

        payload = {
            "date": "2023-11-15",
            "amount": 250.50,
            "type": "Expense",
            "category": "Entertainment",
            "description": "Concert tickets",
        }
        resp = admin_client.post("/api/transactions", json=payload)
        assert resp.status_code == 201

        data = resp.json()
        assert data["date"] == "2023-11-15"
        assert data["category_name"] == "Entertainment"
        assert data["amount"] == pytest.approx(-250.50)  # Stored as negative
        assert data["type"] == "expense"

        # Verify it's in the DB
        tx = db_session.query(Transaction).filter(Transaction.date == "2023-11-15").first()
        assert tx is not None
        assert tx.description == "Concert tickets"

    def test_create_income_stored_as_positive(self, admin_client):
        """Income amounts are stored as positive values."""
        resp = admin_client.post("/api/transactions", json={
            "date": "2023-11-20",
            "amount": 1500.0,
            "type": "Income",
            "category": "Salary",
            "description": "Bonus",
        })
        assert resp.status_code == 201
        assert resp.json()["amount"] == pytest.approx(1500.0)

    def test_create_auto_creates_new_category(self, admin_client, db_session):
        """Creating a transaction with a new category creates that category."""
        from orm_models import Category
        resp = admin_client.post("/api/transactions", json={
            "date": "2023-11-25",
            "amount": 50.0,
            "type": "Expense",
            "category": "BrandNewCategory",
            "description": "Test",
        })
        assert resp.status_code == 201
        cat = db_session.query(Category).filter(Category.name == "BrandNewCategory").first()
        assert cat is not None


class TestUpdateTransaction:
    def test_update_requires_admin(self, client):
        """PUT without auth → 401."""
        resp = client.put("/api/transactions/1", json={"description": "Updated"})
        assert resp.status_code == 401

    def test_update_transaction(self, admin_client, db_session):
        """Admin can update a transaction's description."""
        from orm_models import Transaction

        # Look up the salary transaction dynamically
        salary_tx = db_session.query(Transaction).filter(
            Transaction.description == "Tech Corp Salary"
        ).first()
        assert salary_tx is not None
        tx_id = salary_tx.id

        resp = admin_client.put(f"/api/transactions/{tx_id}", json={"description": "Updated Description"})
        assert resp.status_code == 200

        db_session.expire_all()
        tx = db_session.query(Transaction).filter(Transaction.id == tx_id).first()
        assert tx.description == "Updated Description"

    def test_update_nonexistent_returns_404(self, admin_client):
        """Updating a nonexistent transaction returns 404."""
        resp = admin_client.put("/api/transactions/9999", json={"description": "Ghost"})
        assert resp.status_code == 404


class TestDeleteTransaction:
    def test_delete_requires_admin(self, client):
        """DELETE without auth → 401."""
        resp = client.delete("/api/transactions/2")
        assert resp.status_code == 401

    def test_delete_transaction_removes_from_db(self, admin_client, db_session):
        """Admin can delete a transaction; it disappears from DB."""
        from orm_models import Transaction

        # Find the Groceries transaction id dynamically
        tx_to_delete = db_session.query(Transaction).filter(
            Transaction.description == "Groceries"
        ).first()
        assert tx_to_delete is not None
        tx_id = tx_to_delete.id

        resp = admin_client.delete(f"/api/transactions/{tx_id}")
        assert resp.status_code == 204  # No Content

        db_session.expire_all()
        tx = db_session.query(Transaction).filter(Transaction.id == tx_id).first()
        assert tx is None

    def test_delete_nonexistent_returns_404(self, admin_client):
        """Deleting a nonexistent transaction returns 404."""
        resp = admin_client.delete("/api/transactions/9999")
        assert resp.status_code == 404
