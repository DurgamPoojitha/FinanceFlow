from fastapi import APIRouter, Depends
from typing import List
import sqlite3
from models import TrendModel
from database import get_db

router = APIRouter()

@router.get("/trends", response_model=List[TrendModel])
def get_trends(limit: int = 6, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    # Get last N months, ordered by month ASC so we can compute moving average
    cursor.execute('''
        SELECT month, total_expenses, total_income 
        FROM aggregated_metrics 
        ORDER BY month ASC 
    ''')
    
    rows = cursor.fetchall()
    
    trends = []
    window = []
    
    for row in rows:
        window.append(row['total_expenses'])
        if len(window) > 3:
            window.pop(0)
            
        moving_avg = round(sum(window) / len(window), 2)
        
        trends.append(TrendModel(
            month=row['month'],
            total_expenses=row['total_expenses'],
            total_income=row['total_income'],
            moving_average_expenses=moving_avg
        ))
        
    # Return the requested limit from the end (most recent)
    return trends[-limit:]
