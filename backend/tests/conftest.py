import pytest
from fastapi.testclient import TestClient
import sqlite3
import sys
import os

# Add the parent directory to sys.path so we can import from backend modules
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

from main import app
from database import get_db

@pytest.fixture(name="db_connection")
def fixture_db_connection():
    conn = sqlite3.connect(":memory:", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    
    # Create necessary tables
    cursor = conn.cursor()
    cursor.executescript('''
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY,
            name TEXT,
            type TEXT
        );
        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY,
            date TEXT,
            amount REAL,
            description TEXT,
            category_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        );
        CREATE TABLE aggregated_metrics (
            month TEXT PRIMARY KEY,
            total_income REAL,
            total_expenses REAL,
            savings REAL,
            savings_rate REAL
        );
        CREATE TABLE category_aggregations (
            id INTEGER PRIMARY KEY,
            month TEXT,
            category_id INTEGER,
            total_amount REAL,
            FOREIGN KEY (category_id) REFERENCES categories (id)
        );
        CREATE TABLE insights (
            id INTEGER PRIMARY KEY,
            month TEXT,
            insight_text TEXT,
            type TEXT
        );
        CREATE TABLE trends (
            month TEXT PRIMARY KEY,
            total_expenses REAL,
            total_income REAL,
            moving_average_expenses REAL
        );
    ''')
    
    # Insert mock data
    cursor.executescript('''
        INSERT INTO categories (id, name, type) VALUES (1, 'Salary', 'income');
        INSERT INTO categories (id, name, type) VALUES (2, 'Food', 'expense');
        
        INSERT INTO transactions (id, date, amount, description, category_id) 
        VALUES (1, '2023-10-01', 5000, 'Salary', 1);
        INSERT INTO transactions (id, date, amount, description, category_id) 
        VALUES (2, '2023-10-02', 50, 'Groceries', 2);
        
        INSERT INTO aggregated_metrics (month, total_income, total_expenses, savings, savings_rate)
        VALUES ('2023-10', 5000, 2000, 3000, 60.0);
        
        INSERT INTO category_aggregations (id, month, category_id, total_amount)
        VALUES (1, '2023-10', 2, 2000);
        
        INSERT INTO insights (id, month, insight_text, type)
        VALUES (1, '2023-10', 'Great savings!', 'positive');
        
        INSERT INTO trends (month, total_expenses, total_income, moving_average_expenses)
        VALUES ('2023-10', 2000, 5000, 1500);
    ''')
    conn.commit()
    
    yield conn
    conn.close()

@pytest.fixture(name="client")
def fixture_client(db_connection):
    def override_get_db():
        try:
            yield db_connection
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
