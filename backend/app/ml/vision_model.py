"""
Vision backbone for PhytoSense.
Uses a pretrained ResNet18 (transfer learning) as a feature extractor for
plant leaf images. The final classification layer is replaced with an
identity so the model outputs a dense embedding for fusion.
"""
import torch
import torch.nn as nn
from torchvision import models


class VisionFeatureExtractor(nn.Module):
    """CNN backbone (ResNet18) producing a fixed-size embedding per image."""

    def __init__(self, embedding_dim: int = 256, pretrained: bool = True, freeze_backbone: bool = False):
        super().__init__()
        backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT if pretrained else None)
        in_features = backbone.fc.in_features
        backbone.fc = nn.Identity()
        self.backbone = backbone

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False

        self.projection = nn.Sequential(
            nn.Linear(in_features, embedding_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)          # (B, 512)
        embedding = self.projection(features)  # (B, embedding_dim)
        return embedding


def get_target_layer(model: VisionFeatureExtractor):
    """Returns the last conv layer, used by Grad-CAM for visual explanations."""
    return model.backbone.layer4[-1]
