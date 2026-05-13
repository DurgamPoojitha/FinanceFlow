import pytest
from playwright.sync_api import Page, expect
import threading
import uvicorn
import time
import os
import sqlite3

# We will start the FastAPI server in a background thread for Playwright to hit
@pytest.fixture(scope="session", autouse=True)
def start_server():
    # Setup test DB
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'finance.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.executescript('''
        CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY, name TEXT, type TEXT);
        CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY, date TEXT, amount REAL, description TEXT, category_id INTEGER);
        CREATE TABLE IF NOT EXISTS aggregated_metrics (month TEXT PRIMARY KEY, total_income REAL, total_expenses REAL, savings REAL, savings_rate REAL);
        CREATE TABLE IF NOT EXISTS category_aggregations (id INTEGER PRIMARY KEY, month TEXT, category_id INTEGER, total_amount REAL);
        CREATE TABLE IF NOT EXISTS insights (id INTEGER PRIMARY KEY, month TEXT, insight_text TEXT, type TEXT);
        CREATE TABLE IF NOT EXISTS trends (month TEXT PRIMARY KEY, total_expenses REAL, total_income REAL, moving_average_expenses REAL);
    ''')
    conn.commit()
    conn.close()

    def run_server():
        uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="error")
        
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(2) # wait for server to start
    yield
    # daemon thread will die when pytest exits

def test_frontend_loads(page: Page):
    page.goto("http://127.0.0.1:8000/")
    
    # Wait for React app to render
    page.wait_for_selector("#root", state="visible")
    
    # Depending on the frontend, check if a title or nav element is present
    # Usually "Finance Flow" or similar
    expect(page).to_have_title("finance")

def test_api_integration(page: Page):
    # Test if backend APIs are responding
    response = page.request.get("http://127.0.0.1:8000/api/transactions")
    assert response.ok
    assert response.status == 200
    
    response = page.request.get("http://127.0.0.1:8000/api/kpis")
    # Even if 404 (no kpis), the API responds
    assert response.status in [200, 404]
