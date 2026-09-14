from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.main import app


client = TestClient(app)


def create_test_image() -> bytes:
    image = Image.new("RGB", (224, 224), color=(40, 150, 60))
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_prediction_endpoint_returns_valid_response():
    response = client.post(
        "/api/v1/predict",
        files={
            "image": (
                "test_leaf.jpg",
                create_test_image(),
                "image/jpeg",
            )
        },
        data={
            "temperature": "28",
            "humidity": "55",
            "light_intensity": "40000",
            "soil_moisture": "35",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert 0.0 <= body["health_score"] <= 1.0

    assert body["stress_level"] in {
        "healthy",
        "mild_stress",
        "moderate_stress",
        "severe_stress",
    }

    assert len(body["stress_probabilities"]) == 4
    assert len(body["cause_probabilities"]) == 6
    assert len(body["environmental_attribution"]) == 4

    assert isinstance(body["recommendation"], str)
    assert body["recommendation"]