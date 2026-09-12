import torch
from app.ml.fusion_model import PhytoSenseFusionModel
from app.ml.env_encoder import normalize_env_features


def test_fusion_model_forward_shapes():
    model = PhytoSenseFusionModel(num_stress_classes=4, num_cause_labels=6)
    model.eval()
    dummy_image = torch.randn(2, 3, 224, 224)
    dummy_env = torch.randn(2, 4)
    health, stress_logits, cause_logits = model(dummy_image, dummy_env)
    assert health.shape == (2,)
    assert stress_logits.shape == (2, 4)
    assert cause_logits.shape == (2, 6)


def test_normalize_env_features_ranges():
    values = normalize_env_features(25, 60, 50000, 40)
    assert all(0.0 <= v <= 1.0 for v in values)
