import pytest

def test_get_kpis(client):
    response = client.get("/api/kpis")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    kpi = data[0]
    assert kpi["month"] == "2023-10"
    assert kpi["total_income"] == 5000.0
    assert kpi["total_expenses"] == 2000.0
    assert kpi["savings"] == 3000.0
    
    # Check calculated fields (like ROI)
    # 3000 / 2000 * 100 = 150.0
    assert kpi["roi"] == 150.0

def test_get_kpis_with_month(client):
    response = client.get("/api/kpis?month=2023-10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["month"] == "2023-10"

def test_get_kpis_not_found(client):
    response = client.get("/api/kpis?month=2099-01")
    assert response.status_code == 404

def test_get_category_percentages(client):
    response = client.get("/api/kpis/categories?month=2023-10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    cat = data[0]
    assert cat["category_name"] == "Food"
    assert cat["amount"] == 2000.0
    assert cat["percentage"] == 100.0 # 2000 / 2000 * 100
