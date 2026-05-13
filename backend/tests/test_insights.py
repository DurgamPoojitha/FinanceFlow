import pytest

def test_get_insights(client):
    response = client.get("/api/insights")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    
    insight = data[0]
    assert insight["month"] == "2023-10"
    assert insight["insight_text"] == "Great savings!"
    assert insight["type"] == "positive"
