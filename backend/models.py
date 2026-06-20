"""
Pydantic Request/Response Models.

These define the API contract between the frontend and backend.
All API responses are validated against these schemas.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------

class TransactionModel(BaseModel):
    """Response model for a single transaction."""
    id: int
    date: str
    amount: float
    description: Optional[str] = None
    category_name: str
    type: str  # 'income' | 'expense'


class TransactionCreate(BaseModel):
    """
    Request body for creating a transaction via POST /api/transactions.
    Amount is always provided as a positive number; type determines sign.
    """
    date: str = Field(..., description="Date in YYYY-MM-DD format", pattern=r"^\d{4}-\d{2}-\d{2}$")
    amount: float = Field(..., gt=0, description="Positive transaction amount")
    type: str = Field(..., description="'Income' or 'Expense'")
    category: str = Field(..., description="Category name (created if it doesn't exist)")
    description: Optional[str] = Field(None, description="Optional transaction description")


class TransactionUpdate(BaseModel):
    """Request body for updating a transaction via PUT /api/transactions/{id}."""
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


# ---------------------------------------------------------------------------
# KPIs
# ---------------------------------------------------------------------------

class KPIModel(BaseModel):
    """
    Monthly Key Performance Indicators.

    Savings Rate formula:
        savings_rate = (savings / total_income) × 100

    Expense Efficiency formula (formerly mislabeled 'roi'):
        expense_efficiency = (savings / total_expenses) × 100
        Measures how many cents are saved for every dollar spent.
        A value of 50 means: for every $1 spent, $0.50 is saved.

    Budget Utilization:
        budget_used_percentage = (total_expenses / monthly_budget) × 100
    """
    month: str
    total_income: float
    total_expenses: float
    savings: float
    savings_rate: float
    expense_efficiency: float = Field(
        0.0,
        description="Savings-to-expense ratio × 100. Renamed from the mislabeled 'roi'."
    )
    budget_used_percentage: float = 0.0
    configured_budget: float = Field(0.0, description="The budget amount used for this calculation.")


class CategoryPercentage(BaseModel):
    """Spending breakdown by category for a given month."""
    category_name: str
    percentage: float
    amount: float


# ---------------------------------------------------------------------------
# Budget
# ---------------------------------------------------------------------------

class BudgetModel(BaseModel):
    """Response model for a configured budget."""
    id: int
    month: str
    amount: float


class BudgetCreate(BaseModel):
    """Request body for creating or updating a monthly budget."""
    month: str = Field(
        ...,
        description="YYYY-MM format or 'default' for the global fallback budget",
        pattern=r"^(\d{4}-\d{2}|default)$"
    )
    amount: float = Field(..., gt=0, description="Budget amount in USD")


# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------

class InsightModel(BaseModel):
    """A single generated financial insight."""
    id: int
    month: str
    insight_text: str
    type: str  # 'positive' | 'warning' | 'neutral'


# ---------------------------------------------------------------------------
# Trends
# ---------------------------------------------------------------------------

class TrendModel(BaseModel):
    """Monthly income/expense trend with rolling moving average."""
    month: str
    total_expenses: float
    total_income: float
    moving_average_expenses: Optional[float] = None


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class UserRegister(BaseModel):
    """Request body for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    role: str = Field("viewer", description="'viewer' or 'admin'")


class UserLogin(BaseModel):
    """Request body for user login."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response after successful login."""
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str


class UserProfile(BaseModel):
    """Current user profile (from GET /api/auth/me)."""
    id: int
    email: str
    role: str


# ---------------------------------------------------------------------------
# ETL Lineage
# ---------------------------------------------------------------------------

class EtlRunModel(BaseModel):
    """ETL pipeline execution record for the monitoring endpoint."""
    id: int
    started_at: str
    completed_at: Optional[str] = None
    source_file: Optional[str] = None
    records_extracted: int
    records_inserted: int
    records_updated: int
    records_rejected: int
    status: str
    error_message: Optional[str] = None
