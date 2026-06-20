import os
import sys
import tempfile
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from orm_models import Base
import main as _main_module  # Import before patching

from main import app
from database import get_db
from orm_models import (
    AggregatedMetrics, Budget, Category,
    CategoryAggregation, Insight, Transaction, User,
)
from auth import hash_password


def _make_test_engine(db_path: str):
    """Create a fresh file-backed SQLite engine for tests."""
    eng = create_engine(
        f"sqlite:///{db_path}",
        connect_args={"check_same_thread": False},
    )
    return eng


@pytest.fixture(name="db_session")
def fixture_db_session(monkeypatch):
    """
    Creates an isolated database per test using a temporary file.
    """
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)

    test_engine = _make_test_engine(db_path)
    TestingLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

    # 1. Create all tables in the test engine
    Base.metadata.create_all(bind=test_engine)

    # 2. Suppress lifespan side effects (scheduler, seeding, create_all on prod engine)
    monkeypatch.setattr(_main_module, "_seed_on_startup", lambda: None)
    monkeypatch.setattr(_main_module, "_start_scheduler", lambda: None)
    monkeypatch.setattr(_main_module, "_stop_scheduler", lambda: None)
    # Patch create_all on the metadata singleton to be a no-op
    monkeypatch.setattr(Base.metadata, "create_all", lambda **kwargs: None)

    session = TestingLocal()

    # Seed dimensions
    cat_income = Category(name="Salary", type="income")
    cat_expense = Category(name="Food", type="expense")
    session.add_all([cat_income, cat_expense])
    session.flush()

    # Seed transactions
    session.add(Transaction(
        date="2023-10-01", amount=5000.0, description="Tech Corp Salary",
        category_id=cat_income.id, source_hash="hash_income_1",
    ))
    session.add(Transaction(
        date="2023-10-15", amount=-50.0, description="Groceries",
        category_id=cat_expense.id, source_hash="hash_expense_1",
    ))
    session.flush()

    # Seed aggregates
    session.add(AggregatedMetrics(
        month="2023-10",
        total_income=5000.0,
        total_expenses=2000.0,
        savings=3000.0,
        savings_rate=60.0,
    ))
    session.add(CategoryAggregation(
        month="2023-10", category_id=cat_expense.id, total_amount=2000.0,
    ))
    session.add(Insight(
        month="2023-10", insight_text="Great savings!", type="positive",
    ))

    # Seed budgets
    session.add(Budget(month="2023-10", amount=3000.0))
    session.add(Budget(month="default", amount=3000.0))

    # Seed users
    session.add(User(
        email="admin@test.com",
        hashed_password=hash_password("password123"),
        role="admin",
    ))
    session.add(User(
        email="viewer@test.com",
        hashed_password=hash_password("password123"),
        role="viewer",
    ))

    session.commit()
    yield session

    session.close()
    test_engine.dispose()
    if os.path.exists(db_path):
        os.remove(db_path)


@pytest.fixture(name="client")
def fixture_client(db_session):
    """TestClient with get_db overridden to use the per-test session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(name="admin_token")
def fixture_admin_token(client):
    """Valid JWT token for the seeded admin user."""
    resp = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(name="viewer_token")
def fixture_viewer_token(client):
    """Valid JWT token for the seeded viewer user."""
    resp = client.post("/api/auth/login", json={
        "email": "viewer@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200, f"Viewer login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(name="admin_client")
def fixture_admin_client(client, admin_token):
    """TestClient with admin Authorization header pre-set."""
    client.headers.update({"Authorization": f"Bearer {admin_token}"})
    return client
