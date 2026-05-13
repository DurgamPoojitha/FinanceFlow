import csv
import random
import os
from datetime import datetime, timedelta

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
RAW_FILE = os.path.join(DATA_DIR, 'raw_transactions.csv')

def generate_data(num_records=500):
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
        
    categories = ['Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Salary', 'Freelance']
    descriptions = {
        'Food': ['Groceries', 'Restaurant', 'Coffee Shop'],
        'Rent': ['Monthly Rent'],
        'Utilities': ['Electric Bill', 'Water Bill', 'Internet'],
        'Entertainment': ['Movie Tickets', 'Concert', 'Game Subscription'],
        'Transport': ['Gas Station', 'Uber', 'Train Ticket'],
        'Salary': ['Tech Corp Salary'],
        'Freelance': ['Client Invoice', 'Consulting']
    }
    
    start_date = datetime.now() - timedelta(days=180) # Last 6 months
    
    with open(RAW_FILE, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['transaction_date', 'amount', 'description', 'category_name'])
        
        for _ in range(num_records):
            cat = random.choice(categories)
            desc = random.choice(descriptions[cat])
            
            # Make income positive, expenses negative
            if cat in ['Salary', 'Freelance']:
                amount = round(random.uniform(500, 5000), 2)
            else:
                amount = round(random.uniform(-500, -10), 2)
                
            # Random date in the last 6 months
            random_days = random.randint(0, 180)
            txn_date = (start_date + timedelta(days=random_days)).strftime('%Y-%m-%d')
            
            # Occasionally introduce missing category (dirty data)
            if random.random() < 0.05:
                cat = ''
                
            writer.writerow([txn_date, amount, desc, cat])
            
    print(f"Generated {num_records} raw transactions at {RAW_FILE}")

if __name__ == "__main__":
    generate_data()
