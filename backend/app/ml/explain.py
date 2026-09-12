"""
Explainability utilities for PhytoSense.

- Grad-CAM highlights which regions of the leaf image influenced the
  stress-level prediction the most.
- Environmental attribution reports which sensor readings pushed the
  prediction toward each stress class (simple gradient x input attribution,
  can be upgraded to SHAP for production).
"""
import torch
import numpy as np
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image

from app.ml.vision_model import get_target_layer
from app.config import settings


def generate_gradcam(model, image_tensor: torch.Tensor, target_class: int, original_image_rgb: np.ndarray):
    """
    model: PhytoSenseFusionModel
    image_tensor: (1, 3, H, W) normalized tensor
    original_image_rgb: (H, W, 3) float array in [0,1] for overlay
    Returns an RGB heatmap-overlaid image as a numpy array (H, W, 3), uint8.
    """
    target_layer = get_target_layer(model.vision_encoder)
    cam = GradCAM(model=model.vision_encoder, target_layers=[target_layer])
    grayscale_cam = cam(input_tensor=image_tensor)[0]
    visualization = show_cam_on_image(original_image_rgb, grayscale_cam, use_rgb=True)
    return visualization


def environmental_attribution(model, image_tensor: torch.Tensor, env_tensor: torch.Tensor):
    """
    Gradient-based attribution: how much each environmental feature
    contributed to the predicted health score. Returns a dict feature->score.
    """
    model.eval()
    env_tensor = env_tensor.clone().requires_grad_(True)
    health_score, _, _ = model(image_tensor, env_tensor)
    health_score.sum().backward()
    grads = env_tensor.grad.abs().mean(dim=0).detach().cpu().numpy()

    feature_names = ["temperature", "humidity", "light_intensity", "soil_moisture"]
    attribution = {name: float(score) for name, score in zip(feature_names, grads)}
    total = sum(attribution.values()) or 1.0
    return {k: round(v / total, 3) for k, v in attribution.items()}


def build_recommendation(stress_level: str, cause_probs: dict, env_attribution: dict) -> str:
    """Produces a short, human-readable explanation and recommendation."""
    top_cause = max(cause_probs, key=cause_probs.get) if cause_probs else "unknown"
    top_env_factor = max(env_attribution, key=env_attribution.get) if env_attribution else "unknown"

    templates = {
        "water_deficit": "Consider increasing irrigation frequency; soil moisture readings are low.",
        "nutrient_deficiency": "Consider a soil nutrient test and targeted fertilization.",
        "pest_pressure": "Inspect leaves closely for pests; consider integrated pest management.",
        "heat_stress": "Provide shading or adjust exposure during peak temperature hours.",
        "fungal_infection": "Inspect for fungal spotting; consider a fungicide treatment and improve airflow.",
        "light_stress": "Adjust light exposure; the plant may be receiving too much or too little light.",
    }
    action = templates.get(top_cause, "Monitor the plant closely and recheck in 48 hours.")
    return (f"Detected {stress_level.replace('_', ' ')}. Most likely cause: "
            f"{top_cause.replace('_', ' ')} (environmental factor most implicated: "
            f"{top_env_factor.replace('_', ' ')}). Recommendation: {action}")
