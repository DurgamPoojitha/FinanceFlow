import pytest

def test_get_transactions(client):
    response = client.get("/api/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    
    # Verify exact contents
    descriptions = [item["description"] for item in data]
    assert "Salary" in descriptions
    assert "Groceries" in descriptions
    
    # Check proper mapping
    salary_txn = next(item for item in data if item["description"] == "Salary")
    assert salary_txn["amount"] == 5000.0
    assert salary_txn["category_name"] == "Salary"
    assert salary_txn["type"] == "income"
