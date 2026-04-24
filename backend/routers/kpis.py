from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import sqlite3
from models import KPIModel, CategoryPercentage
from database import get_db

router = APIRouter()

@router.get("/kpis", response_model=List[KPIModel])
def get_kpis(month: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    query = "SELECT * FROM aggregated_metrics"
    params = ()
    if month:
        query += " WHERE month = ?"
        params = (month,)
        
    query += " ORDER BY month DESC LIMIT 12"
        
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    if not rows:
        raise HTTPException(status_code=404, detail="No KPIs found")
        
    kpis = []
    # Budget mock: assuming standard fixed budget of 3000 for calculation
    MOCK_BUDGET = 3000.0
    
    for row in rows:
        # compute dummy ROI: savings / expenses just as a hypothetical BI metric
        roi = round((row['savings'] / row['total_expenses'] * 100) if row['total_expenses'] > 0 else 0, 2)
        budget_used = round((row['total_expenses'] / MOCK_BUDGET * 100), 2)
        
        kpis.append(KPIModel(
            month=row['month'],
            total_income=row['total_income'],
            total_expenses=row['total_expenses'],
            savings=row['savings'],
            savings_rate=row['savings_rate'],
            roi=roi,
            budget_used_percentage=budget_used
        ))
        
    return kpis

@router.get("/kpis/categories", response_model=List[CategoryPercentage])
def get_category_percentages(month: str, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    
    # Get total expenses for the month
    cursor.execute("SELECT total_expenses FROM aggregated_metrics WHERE month = ?", (month,))
    metric_row = cursor.fetchone()
    
    if not metric_row or metric_row['total_expenses'] == 0:
        return []
        
    total_expenses = metric_row['total_expenses']
    
    cursor.execute('''
        SELECT c.name as category_name, ca.total_amount 
        FROM category_aggregations ca
        JOIN categories c ON ca.category_id = c.id
        WHERE ca.month = ? AND c.type = 'expense'
        ORDER BY ca.total_amount DESC
    ''', (month,))
    
    rows = cursor.fetchall()
    result = []
    
    for row in rows:
        percentage = round((row['total_amount'] / total_expenses) * 100, 2)
        result.append(CategoryPercentage(
            category_name=row['category_name'],
            percentage=percentage,
            amount=row['total_amount']
        ))
        
    return result
