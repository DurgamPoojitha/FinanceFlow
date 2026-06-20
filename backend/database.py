"""
Database Session Management using SQLAlchemy.

Replaces the raw sqlite3.connect() pattern with a proper SQLAlchemy engine
and session factory. Supports both SQLite (development) and PostgreSQL (production)
via the DATABASE_URL environment variable.

Migration path:
  SQLite  → set DATABASE_URL=sqlite:///./database/finance.db
  Postgres → set DATABASE_URL=postgresql://user:pass@host:5432/dbname
"""

import os
import sys
import logging

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

# Allow importing config and orm_models whether this is run from backend/ or root
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# ---------------------------------------------------------------------------
# Engine creation
# ---------------------------------------------------------------------------

_connect_args = {}
if settings.database_url.startswith("sqlite"):
    # SQLite requires check_same_thread=False for FastAPI's thread model
    _connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.database_url,
    connect_args=_connect_args,
    echo=False,  # Set True to log all SQL — useful for debugging
    pool_pre_ping=True,   # Verify connection health before use
)

# Enable SQLite foreign key enforcement (off by default in SQLite)
if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db() -> Session:
    """
    FastAPI dependency that provides a database session per request.
    Automatically commits on success and rolls back on exception.

    Usage:
        @router.get("/endpoint")
        def my_endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
