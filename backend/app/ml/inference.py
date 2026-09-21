"""
High-level inference wrapper used by the FastAPI routes.

Loads the trained model once and exposes a single run_inference function.
"""

import io
from pathlib import Path

import numpy as np
import torch
from PIL import Image, UnidentifiedImageError

from app.config import settings
from app.ml.dataset import get_eval_transforms
from app.ml.env_encoder import normalize_env_features
from app.ml.explain import (
    build_recommendation,
    environmental_attribution,
)
from app.ml.fusion_model import PhytoSenseFusionModel


_model = None
_transforms = get_eval_transforms()

# Temporary safety threshold.
# A real plant/non-plant gate should replace this later.
MIN_STRESS_CONFIDENCE = 0.45


def load_model():
    """
    Create the model, load the trained checkpoint,
    and cache the model in memory.
    """

    global _model

    if _model is not None:
        return _model

    _model = PhytoSenseFusionModel(
        num_stress_classes=len(settings.CLASS_NAMES),
        num_cause_labels=len(settings.CAUSE_LABELS),
    )

    model_path = Path(settings.MODEL_PATH)

    if not model_path.is_file():
        _model = None
        raise RuntimeError(
            f"Trained model checkpoint was not found: {model_path}. "
            "Train the model before running predictions."
        )

    try:
        state_dict = torch.load(
            model_path,
            map_location="cpu",
        )

        _model.load_state_dict(state_dict)

    except Exception as exc:
        _model = None
        raise RuntimeError(
            f"Could not load model checkpoint '{model_path}': {exc}"
        ) from exc

    _model.eval()

    return _model


def _load_image(image_bytes: bytes) -> Image.Image:
    """
    Decode uploaded bytes as an RGB image.
    """

    if not image_bytes:
        raise ValueError("The uploaded image is empty.")

    try:
        image = Image.open(io.BytesIO(image_bytes))
        image.load()
        return image.convert("RGB")

    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError(
            "The uploaded file is not a readable image."
        ) from exc


def _build_cause_probabilities(
    cause_probs: torch.Tensor,
) -> dict:
    """
    Convert cause probabilities into a JSON-safe dictionary.
    """

    return {
        settings.CAUSE_LABELS[index]: round(
            float(cause_probs[0][index]),
            3,
        )
        for index in range(len(settings.CAUSE_LABELS))
    }


def _build_stress_probabilities(
    stress_probs: torch.Tensor,
) -> dict:
    """
    Convert stress probabilities into a JSON-safe dictionary.
    """

    return {
        settings.CLASS_NAMES[index]: round(
            float(stress_probs[0][index]),
            3,
        )
        for index in range(len(settings.CLASS_NAMES))
    }


def run_inference(
    image_bytes: bytes,
    temperature: float,
    humidity: float,
    light_intensity: float,
    soil_moisture: float,
) -> dict:
    """
    Run plant-health inference for one uploaded image.
    """

    model = load_model()
    pil_image = _load_image(image_bytes)

    image_np = np.array(pil_image)

    augmented = _transforms(image=image_np)
    image_tensor = augmented["image"].unsqueeze(0)

    env_values = normalize_env_features(
        temperature,
        humidity,
        light_intensity,
        soil_moisture,
    )

    env_tensor = torch.tensor(
        [env_values],
        dtype=torch.float32,
    )

    with torch.inference_mode():
        health_score, stress_probs, cause_probs = model.predict(
            image_tensor,
            env_tensor,
        )

    stress_confidence = float(
        stress_probs.max(dim=1).values.item()
    )

    stress_probabilities = _build_stress_probabilities(
        stress_probs
    )

    diagnostics = {
        "health_score": round(
            float(health_score.item()),
            3,
        ),
        "stress_confidence": round(
            stress_confidence,
            3,
        ),
        "stress_probabilities": stress_probabilities,
        "threshold": MIN_STRESS_CONFIDENCE,
    }

    print("Prediction diagnostics:", diagnostics)

    if stress_confidence < MIN_STRESS_CONFIDENCE:
        raise ValueError(
            f"This image was rejected because model confidence was "
            f"too low ({stress_confidence:.3f}). "
            "Please capture a clear, close-up plant leaf."
        )

    stress_index = int(
        stress_probs.argmax(dim=1).item()
    )

    stress_level = settings.CLASS_NAMES[stress_index]

    cause_probabilities = _build_cause_probabilities(
        cause_probs
    )

    # This function uses gradients, so it must remain outside
    # torch.inference_mode().
    environmental_attribution_result = environmental_attribution(
        model,
        image_tensor,
        env_tensor,
    )

    recommendation = build_recommendation(
        stress_level,
        cause_probabilities,
        environmental_attribution_result,
    )

    return {
        "health_score": round(
            float(health_score.item()),
            3,
        ),
        "stress_level": stress_level,
        "stress_probabilities": stress_probabilities,
        "cause_probabilities": cause_probabilities,
        "environmental_attribution": (
            environmental_attribution_result
        ),
        "recommendation": recommendation,
    }
