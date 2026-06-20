"""
SQLAlchemy ORM Models for FinanceFlow BI Platform.

This module is the single source of truth for the database schema.
All tables, columns, relationships, and constraints are defined here.
Both the FastAPI backend and the ETL pipeline import from this module.
"""

import hashlib
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# Identity & Access
# ---------------------------------------------------------------------------

class User(Base):
    """
    Application user. Supports role-based access control.
    Roles: 'viewer' (read-only) | 'admin' (full CRUD).
    """
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    email          = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role           = Column(String(20), nullable=False, default="viewer")
    created_at     = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Core Financial Data
# ---------------------------------------------------------------------------

class Category(Base):
    """
    Dimension table for transaction categories.
    E.g. Food (expense), Salary (income).
    """
    __tablename__ = "categories"

    id   = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    type = Column(String(20), nullable=False)  # 'income' | 'expense'

    transactions          = relationship("Transaction", back_populates="category")
    category_aggregations = relationship("CategoryAggregation", back_populates="category")


class Transaction(Base):
    """
    Fact table – raw financial transactions.

    source_hash: MD5 of (date|amount|description|category_name).
                 Used by the ETL pipeline for incremental deduplication.
                 NULL for manually created transactions via the API.
    """
    __tablename__ = "transactions"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    date        = Column(String(10), nullable=False, index=True)  # YYYY-MM-DD
    amount      = Column(Float, nullable=False)                    # positive=income, negative=expense
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    source_hash = Column(String(64), unique=True, nullable=True, index=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="transactions")

    @staticmethod
    def compute_hash(date: str, amount: float, description: str, category_name: str) -> str:
        """Deterministic hash for ETL deduplication."""
        raw = f"{date}|{amount:.2f}|{description or ''}|{category_name or ''}"
        return hashlib.md5(raw.encode()).hexdigest()


# ---------------------------------------------------------------------------
# Pre-Aggregated OLAP Layer
# ---------------------------------------------------------------------------

class AggregatedMetrics(Base):
    """
    Monthly rollup fact table (OLAP layer).
    Pre-computed by the ETL pipeline to make KPI API queries O(1).
    """
    __tablename__ = "aggregated_metrics"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    month          = Column(String(7), unique=True, nullable=False, index=True)  # YYYY-MM
    total_income   = Column(Float, default=0.0)
    total_expenses = Column(Float, default=0.0)   # always stored as positive magnitude
    savings        = Column(Float, default=0.0)
    savings_rate   = Column(Float, default=0.0)   # %


class CategoryAggregation(Base):
    """Per-category monthly spending rollup."""
    __tablename__ = "category_aggregations"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    month        = Column(String(7), nullable=False, index=True)
    category_id  = Column(Integer, ForeignKey("categories.id"), nullable=True)
    total_amount = Column(Float, default=0.0)

    __table_args__ = (UniqueConstraint("month", "category_id", name="uq_cat_agg_month_cat"),)

    category = relationship("Category", back_populates="category_aggregations")


# ---------------------------------------------------------------------------
# Insights & Recommendations
# ---------------------------------------------------------------------------

class Insight(Base):
    """
    Generated financial insights.
    Computed lazily on first API request per month, then cached here.
    type: 'positive' | 'warning' | 'neutral'
    """
    __tablename__ = "insights"

    id           = Column(Integer, primary_key=True, autoincrement=True)
    month        = Column(String(7), nullable=False, index=True)
    insight_text = Column(Text, nullable=False)
    type         = Column(String(20), nullable=False)
    created_at   = Column(DateTime, default=datetime.utcnow)


# ---------------------------------------------------------------------------
# Budget Configuration
# ---------------------------------------------------------------------------

class Budget(Base):
    """
    User-configurable monthly budget.
    Use month='default' for the global fallback budget.
    Specific YYYY-MM entries override the default for that month.
    """
    __tablename__ = "budgets"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    month      = Column(String(7), unique=True, nullable=False, index=True)
    amount     = Column(Float, nullable=False, default=3000.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ---------------------------------------------------------------------------
# ETL Data Lineage
# ---------------------------------------------------------------------------

class EtlRun(Base):
    """
    Audit log for every ETL pipeline execution.
    Enables data lineage tracing and pipeline monitoring.
    status: 'running' | 'completed' | 'failed'
    """
    __tablename__ = "etl_runs"

    id                = Column(Integer, primary_key=True, autoincrement=True)
    started_at        = Column(DateTime, nullable=False, default=datetime.utcnow)
    completed_at      = Column(DateTime, nullable=True)
    source_file       = Column(String(500), nullable=True)
    records_extracted = Column(Integer, default=0)
    records_inserted  = Column(Integer, default=0)
    records_updated   = Column(Integer, default=0)
    records_rejected  = Column(Integer, default=0)
    status            = Column(String(20), nullable=False, default="running")
    error_message     = Column(Text, nullable=True)
