"""
Multimodal fusion model for PhytoSense.
Combines the visual embedding (from VisionFeatureExtractor) with the
environmental embedding (from EnvironmentEncoder) and predicts three outputs:
  1. health_score   - regression, 0.0 (dead) to 1.0 (perfectly healthy)
  2. stress_level    - classification over settings.CLASS_NAMES
  3. cause_logits     - multi-label classification over settings.CAUSE_LABELS
"""
import torch
import torch.nn as nn

from app.ml.vision_model import VisionFeatureExtractor
from app.ml.env_encoder import EnvironmentEncoder


class FusionHead(nn.Module):
    def __init__(self, fused_dim: int, num_stress_classes: int, num_cause_labels: int):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(fused_dim, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
        )
        self.health_head = nn.Sequential(nn.Linear(128, 1), nn.Sigmoid())
        self.stress_head = nn.Linear(128, num_stress_classes)
        self.cause_head = nn.Linear(128, num_cause_labels)  # multi-label, use BCEWithLogits

    def forward(self, fused: torch.Tensor):
        shared = self.shared(fused)
        health_score = self.health_head(shared).squeeze(-1)
        stress_logits = self.stress_head(shared)
        cause_logits = self.cause_head(shared)
        return health_score, stress_logits, cause_logits


class PhytoSenseFusionModel(nn.Module):
    def __init__(self, vision_dim: int = 256, env_dim: int = 64,
                 num_stress_classes: int = 4, num_cause_labels: int = 6):
        super().__init__()
        self.vision_encoder = VisionFeatureExtractor(embedding_dim=vision_dim)
        self.env_encoder = EnvironmentEncoder(embedding_dim=env_dim)
        self.head = FusionHead(vision_dim + env_dim, num_stress_classes, num_cause_labels)

    def forward(self, image: torch.Tensor, env_features: torch.Tensor):
        visual_embedding = self.vision_encoder(image)
        env_embedding = self.env_encoder(env_features)
        fused = torch.cat([visual_embedding, env_embedding], dim=1)
        return self.head(fused)

    @torch.no_grad()
    def predict(self, image: torch.Tensor, env_features: torch.Tensor):
        self.eval()
        health_score, stress_logits, cause_logits = self.forward(image, env_features)
        stress_probs = torch.softmax(stress_logits, dim=1)
        cause_probs = torch.sigmoid(cause_logits)
        return health_score, stress_probs, cause_probs
