"""
High-level inference wrapper used by the FastAPI routes.
Loads the trained model once and exposes a single `run_inference` function.
"""
import io
import numpy as np
import cv2
import torch
from PIL import Image

from app.ml.fusion_model import PhytoSenseFusionModel
from app.ml.dataset import get_eval_transforms
from app.ml.env_encoder import normalize_env_features
from app.ml.explain import environmental_attribution, build_recommendation
from app.config import settings

_model = None
_transforms = get_eval_transforms()


def load_model():
    global _model
    if _model is None:
        _model = PhytoSenseFusionModel(
            num_stress_classes=len(settings.CLASS_NAMES),
            num_cause_labels=len(settings.CAUSE_LABELS),
        )
        try:
            state_dict = torch.load(settings.MODEL_PATH, map_location="cpu")
            _model.load_state_dict(state_dict)
        except FileNotFoundError:
            # No trained checkpoint yet -- model runs with random init.
            # Replace this once training in app/ml/train.py has produced a checkpoint.
            pass
        _model.eval()
    return _model


def run_inference(image_bytes: bytes, temperature: float, humidity: float,
                   light_intensity: float, soil_moisture: float) -> dict:
    model = load_model()

    pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_np = np.array(pil_image)
    augmented = _transforms(image=image_np)
    image_tensor = augmented["image"].unsqueeze(0)

    env_values = normalize_env_features(temperature, humidity, light_intensity, soil_moisture)
    env_tensor = torch.tensor([env_values], dtype=torch.float32)

    health_score, stress_probs, cause_probs = model.predict(image_tensor, env_tensor)

    stress_idx = int(stress_probs.argmax(dim=1).item())
    stress_level = settings.CLASS_NAMES[stress_idx]

    cause_dict = {
        settings.CAUSE_LABELS[i]: round(float(cause_probs[0][i]), 3)
        for i in range(len(settings.CAUSE_LABELS))
    }
    env_attr = environmental_attribution(model, image_tensor, env_tensor)
    recommendation = build_recommendation(stress_level, cause_dict, env_attr)

    return {
        "health_score": round(float(health_score.item()), 3),
        "stress_level": stress_level,
        "stress_probabilities": {
            settings.CLASS_NAMES[i]: round(float(stress_probs[0][i]), 3)
            for i in range(len(settings.CLASS_NAMES))
        },
        "cause_probabilities": cause_dict,
        "environmental_attribution": env_attr,
        "recommendation": recommendation,
    }
