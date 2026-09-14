from pathlib import Path

import pytest
from PIL import Image
from io import BytesIO

from app.ml.inference import run_inference


CHECKPOINT_PATH = Path("models/phytosense_fusion.pt")


@pytest.mark.skipif(
    not CHECKPOINT_PATH.exists(),
    reason="Development checkpoint has not been trained",
)
def test_checkpoint_inference_returns_valid_prediction():
    image = Image.new("RGB", (224, 224), color=(40, 150, 60))
    buffer = BytesIO()
    image.save(buffer, format="JPEG")

    result = run_inference(
        image_bytes=buffer.getvalue(),
        temperature=25.0,
        humidity=55.0,
        light_intensity=40000.0,
        soil_moisture=35.0,
    )

    assert 0.0 <= result["health_score"] <= 1.0
    assert result["stress_level"] in {
        "healthy",
        "mild_stress",
        "moderate_stress",
        "severe_stress",
    }
    assert len(result["stress_probabilities"]) == 4
    assert len(result["cause_probabilities"]) == 6
    assert len(result["environmental_attribution"]) == 4
    assert isinstance(result["recommendation"], str)
    assert result["recommendation"]