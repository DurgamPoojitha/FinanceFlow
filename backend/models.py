from pydantic import BaseModel
from typing import Optional, List

class TransactionModel(BaseModel):
    id: int
    date: str
    amount: float
    description: Optional[str] = None
    category_name: str
    type: str

class KPIModel(BaseModel):
    month: str
    total_income: float
    total_expenses: float
    savings: float
    savings_rate: float
    roi: Optional[float] = 0.0 # Just a placeholder metric
    budget_used_percentage: Optional[float] = 0.0

class CategoryPercentage(BaseModel):
    category_name: str
    percentage: float
    amount: float

class InsightModel(BaseModel):
    id: int
    month: str
    insight_text: str
    type: str # positive, warning, neutral

class TrendModel(BaseModel):
    month: str
    total_expenses: float
    total_income: float
    moving_average_expenses: Optional[float] = None
