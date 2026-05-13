import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'finance.db')

def init_db():
    print(f"Initializing database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create Categories table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL -- 'expense' or 'income'
    )
    ''')

    # Create Transactions table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        category_id INTEGER,
        FOREIGN KEY(category_id) REFERENCES categories(id)
    )
    ''')

    # Create Aggregated Metrics table for KPIs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS aggregated_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL, -- Format: YYYY-MM
        total_income REAL DEFAULT 0,
        total_expenses REAL DEFAULT 0,
        savings REAL DEFAULT 0,
        savings_rate REAL DEFAULT 0,
        UNIQUE(month)
    )
    ''')

    # Create Category Aggregations for easy category percentage computation
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS category_aggregations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        category_id INTEGER,
        total_amount REAL DEFAULT 0,
        FOREIGN KEY(category_id) REFERENCES categories(id),
        UNIQUE(month, category_id)
    )
    ''')

    # Create Insights table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        month TEXT NOT NULL,
        insight_text TEXT NOT NULL,
        type TEXT NOT NULL, -- 'positive', 'warning', 'neutral'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    conn.commit()
    conn.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
