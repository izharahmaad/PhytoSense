from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "PhytoSense" in response.json()["message"]


def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_history_empty_or_list():
    response = client.get("/api/v1/history")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
