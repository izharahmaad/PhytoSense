"""
Environmental feature encoder.
Encodes tabular sensor readings (temperature, humidity, light, soil moisture)
into a dense embedding of the same dimensionality space as the vision branch.
"""
import torch
import torch.nn as nn


class EnvironmentEncoder(nn.Module):
    NUM_FEATURES = 4  # temperature, humidity, light_intensity, soil_moisture

    def __init__(self, embedding_dim: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(self.NUM_FEATURES, 32),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(32),
            nn.Linear(32, embedding_dim),
            nn.ReLU(inplace=True),
        )

    def forward(self, env_features: torch.Tensor) -> torch.Tensor:
        return self.net(env_features)


def normalize_env_features(temperature, humidity, light_intensity, soil_moisture):
    """
    Min-max style normalization based on typical agronomic ranges.
    temperature: 0-50 C, humidity: 0-100%, light: 0-100k lux, soil_moisture: 0-100%
    """
    t = max(0.0, min(temperature, 50.0)) / 50.0
    h = max(0.0, min(humidity, 100.0)) / 100.0
    l = max(0.0, min(light_intensity, 100000.0)) / 100000.0
    s = max(0.0, min(soil_moisture, 100.0)) / 100.0
    return [t, h, l, s]
