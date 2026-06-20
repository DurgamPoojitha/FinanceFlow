"""
Database Initialization Script.

Creates all tables using SQLAlchemy ORM (replaces raw SQL in the original version).
Seeds a default admin user and default budget on first run.

Run directly:
    python database/init_db.py

Or import and call init_db() from within the application.
"""

import logging
import os
import sys

# Allow running directly from the database/ directory
_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_BACKEND = os.path.join(_ROOT, "backend")
for _path in (_ROOT, _BACKEND):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from database import engine, SessionLocal
from orm_models import Base, Budget, User
from auth import hash_password
from config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def init_db() -> None:
    """Create all tables and seed essential reference data."""
    logger.info("Initializing database at: %s", settings.database_url)

    # Create all tables (safe – skips existing ones)
    Base.metadata.create_all(bind=engine)
    logger.info("All tables created (or already exist).")

    db = SessionLocal()
    try:
        _seed_default_admin(db)
        _seed_default_budget(db)
        db.commit()
        logger.info("Database initialization complete.")
    except Exception as exc:
        db.rollback()
        logger.error("Initialization failed: %s", exc)
        raise
    finally:
        db.close()


def _seed_default_admin(db) -> None:
    """Create the default admin user if one does not already exist."""
    from orm_models import User  # local import to avoid circular deps in tests
    existing = db.query(User).filter(User.role == "admin").first()
    if existing:
        logger.info("Admin user already exists (%s). Skipping seed.", existing.email)
        return

    admin = User(
        email=settings.admin_email,
        hashed_password=hash_password(settings.admin_password),
        role="admin",
    )
    db.add(admin)
    logger.info("Created default admin user: %s", settings.admin_email)


def _seed_default_budget(db) -> None:
    """Create a default fallback budget if one does not exist."""
    from orm_models import Budget
    existing = db.query(Budget).filter(Budget.month == "default").first()
    if existing:
        logger.info("Default budget already exists ($%.2f). Skipping seed.", existing.amount)
        return

    default_budget = Budget(month="default", amount=settings.default_budget)
    db.add(default_budget)
    logger.info("Created default budget: $%.2f", settings.default_budget)


if __name__ == "__main__":
    init_db()
