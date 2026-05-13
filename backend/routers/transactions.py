from fastapi import APIRouter, Depends
from typing import List, Optional
import sqlite3
from models import TransactionModel
from database import get_db

router = APIRouter()

@router.get("/transactions", response_model=List[TransactionModel])
def get_transactions(limit: int = 50, skip: int = 0, db: sqlite3.Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute('''
        SELECT t.id, t.date, t.amount, t.description, c.name as category_name, c.type 
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT ? OFFSET ?
    ''', (limit, skip))
    
    rows = cursor.fetchall()
    transactions = []
    for row in rows:
        transactions.append(TransactionModel(
            id=row['id'],
            date=row['date'],
            amount=row['amount'],
            description=row['description'],
            category_name=row['category_name'],
            type=row['type']
        ))
        
    return transactions
