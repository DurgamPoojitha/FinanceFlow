import pytest

def test_get_trends(client):
    response = client.get("/api/trends")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    trend = data[0]
    assert trend["month"] == "2023-10"
    assert trend["total_expenses"] == 2000.0
    assert trend["total_income"] == 5000.0
    assert trend["moving_average_expenses"] == 2000.0
