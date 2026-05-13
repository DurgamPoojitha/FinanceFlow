import pandas as pd
import sqlite3
import os
from raw_data_generator import generate_data, RAW_FILE

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'finance.db')

def extract():
    """Extract raw data from CSV."""
    if not os.path.exists(RAW_FILE):
        generate_data()
    df = pd.read_csv(RAW_FILE)
    print(f"Extracted {len(df)} records.")
    return df

def transform(df):
    """Clean and transform data."""
    # Handle missing categories
    df['category_name'] = df['category_name'].fillna('Uncategorized')
    
    # Ensure correct data types
    df['transaction_date'] = pd.to_datetime(df['transaction_date'])
    df['amount'] = pd.to_numeric(df['amount'])
    
    # Determine type
    df['type'] = df['amount'].apply(lambda x: 'income' if x > 0 else 'expense')
    
    print("Transformation complete.")
    return df

def load(df):
    """Load data into SQLite db."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Load Categories
    unique_categories = df[['category_name', 'type']].drop_duplicates()
    for _, row in unique_categories.iterrows():
        cursor.execute("INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)", (row['category_name'], row['type']))
    conn.commit()
    
    # Fetch category mappings
    cursor.execute("SELECT id, name FROM categories")
    cat_map = {name: id for id, name in cursor.fetchall()}
    
    # 2. Load Transactions
    # Clear existing transactions to simulate fresh ETL run
    cursor.execute("DELETE FROM transactions")
    
    for _, row in df.iterrows():
        cat_id = cat_map.get(row['category_name'])
        cursor.execute('''
            INSERT INTO transactions (date, amount, description, category_id)
            VALUES (?, ?, ?, ?)
        ''', (row['transaction_date'].strftime('%Y-%m-%d'), row['amount'], row['description'], cat_id))
    
    # 3. Compute Aggregated Metrics
    df['month'] = df['transaction_date'].dt.to_period('M').astype(str)
    
    monthly_stats = df.groupby('month').agg(
        total_income=('amount', lambda x: x[x > 0].sum()),
        total_expenses=('amount', lambda x: x[x < 0].sum()) # will be negative
    ).reset_index()
    
    monthly_stats['savings'] = monthly_stats['total_income'] + monthly_stats['total_expenses']
    monthly_stats['total_expenses'] = monthly_stats['total_expenses'].abs()
    monthly_stats['savings_rate'] = monthly_stats.apply(
        lambda row: round((row['savings'] / row['total_income'] * 100) if row['total_income'] > 0 else 0, 2), axis=1
    )
    
    # Clear and Insert Aggregations
    cursor.execute("DELETE FROM aggregated_metrics")
    for _, row in monthly_stats.iterrows():
        cursor.execute('''
            INSERT INTO aggregated_metrics (month, total_income, total_expenses, savings, savings_rate)
            VALUES (?, ?, ?, ?, ?)
        ''', (row['month'], row['total_income'], row['total_expenses'], row['savings'], row['savings_rate']))
        
    # 4. Compute Category Aggregations
    monthly_cat = df.groupby(['month', 'category_name']).agg(total_amount=('amount', 'sum')).reset_index()
    monthly_cat['total_amount'] = monthly_cat['total_amount'].abs() # Store as positive magnitudes for simplicity
    
    cursor.execute("DELETE FROM category_aggregations")
    for _, row in monthly_cat.iterrows():
        cat_id = cat_map.get(row['category_name'])
        cursor.execute('''
            INSERT INTO category_aggregations (month, category_id, total_amount)
            VALUES (?, ?, ?)
        ''', (row['month'], cat_id, row['total_amount']))
        
    conn.commit()
    conn.close()
    print("Loading complete.")

def run_pipeline():
    print("Starting ETL pipeline...")
    raw_data = extract()
    clean_data = transform(raw_data)
    load(clean_data)
    print("ETL pipeline completed successfully.")

if __name__ == "__main__":
    run_pipeline()
