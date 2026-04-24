from fastapi import APIRouter, Depends
from typing import List, Optional
import sqlite3
from models import InsightModel
from database import get_db

router = APIRouter()

def generate_insights_for_month(month: str, db: sqlite3.Connection):
    cursor = db.cursor()
    cursor.execute("SELECT * FROM insights WHERE month = ?", (month,))
    existing = cursor.fetchall()
    if existing:
        return # Already generated
        
    insights = []
    
    # Get current month metrics
    cursor.execute("SELECT * FROM aggregated_metrics WHERE month = ?", (month,))
    curr_month = cursor.fetchone()
    if not curr_month:
        return
        
    # Get arbitrary previous month by finding month in table
    cursor.execute("SELECT * FROM aggregated_metrics WHERE month < ? ORDER BY month DESC LIMIT 1", (month,))
    prev_month = cursor.fetchone()
    
    if prev_month:
        # Condition 1: Savings rate dropped
        if curr_month['savings_rate'] < prev_month['savings_rate']:
            drop = round(prev_month['savings_rate'] - curr_month['savings_rate'], 1)
            if drop > 5.0:
                insights.append(("Your savings rate dropped by {}% compared to last month.".format(drop), "warning"))
                
        # Condition 2: Big expense increase
        if curr_month['total_expenses'] > prev_month['total_expenses'] * 1.2:
            insights.append(("Your expenses increased significantly (over 20%) compared to last month.", "warning"))
            
        # Condition 3: Good savings
        if curr_month['savings_rate'] >= 20.0 and curr_month['savings_rate'] >= prev_month['savings_rate']:
            insights.append(("Great job! You maintained a healthy savings rate above 20%.", "positive"))
            
    # Condition 4: Budget Overspend
    MOCK_BUDGET = 3000.0
    if curr_month['total_expenses'] > MOCK_BUDGET:
        insights.append(("You are overspending! Expenses ({} ) exceeded the baseline budget of {}.".format(curr_month['total_expenses'], MOCK_BUDGET), "warning"))
    elif curr_month['total_expenses'] < MOCK_BUDGET * 0.8:
        insights.append(("You stayed well under budget this month. Excellent discipline.", "positive"))
        
    if not insights:
        insights.append(("Your financial habits look stable this month. No major anomalies detected.", "neutral"))
        
    for text, itype in insights:
        cursor.execute("INSERT INTO insights (month, insight_text, type) VALUES (?, ?, ?)", (month, text, itype))
        
    db.commit()


@router.get("/insights", response_model=List[InsightModel])
def get_insights(month: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    if month:
        generate_insights_for_month(month, db)
    
    cursor = db.cursor()
    query = "SELECT * FROM insights"
    params = ()
    if month:
        query += " WHERE month = ?"
        params = (month,)
    query += " ORDER BY id DESC LIMIT 5"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        result.append(InsightModel(
            id=row['id'],
            month=row['month'],
            insight_text=row['insight_text'],
            type=row['type']
        ))
        
    return result
