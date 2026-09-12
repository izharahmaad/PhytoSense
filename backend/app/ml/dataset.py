"""
PhytoSense Dataset.

Expects a CSV manifest with columns:
    image_path, temperature, humidity, light_intensity, soil_moisture,
    health_score, stress_label, cause_labels

cause_labels is a semicolon-separated string of labels from settings.CAUSE_LABELS,
e.g. "water_deficit;heat_stress"
"""
import os
import cv2
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
import albumentations as A
from albumentations.pytorch import ToTensorV2

from app.config import settings
from app.ml.env_encoder import normalize_env_features


def get_train_transforms(image_size: int = settings.IMAGE_SIZE):
    return A.Compose([
        A.Resize(image_size, image_size),
        A.HorizontalFlip(p=0.5),
        A.RandomBrightnessContrast(p=0.3),
        A.HueSaturationValue(p=0.2),
        A.Rotate(limit=20, p=0.4),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])


def get_eval_transforms(image_size: int = settings.IMAGE_SIZE):
    return A.Compose([
        A.Resize(image_size, image_size),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])


class PhytoSenseDataset(Dataset):
    def __init__(self, manifest_csv: str, image_root: str = "", transforms=None):
        self.df = pd.read_csv(manifest_csv)
        self.image_root = image_root
        self.transforms = transforms or get_eval_transforms()
        self.stress_to_idx = {c: i for i, c in enumerate(settings.CLASS_NAMES)}
        self.cause_to_idx = {c: i for i, c in enumerate(settings.CAUSE_LABELS)}

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        row = self.df.iloc[idx]
        img_path = os.path.join(self.image_root, row["image_path"])
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        augmented = self.transforms(image=image)
        image_tensor = augmented["image"]

        env_features = torch.tensor(
            normalize_env_features(
                row["temperature"], row["humidity"], row["light_intensity"], row["soil_moisture"]
            ),
            dtype=torch.float32,
        )

        health_score = torch.tensor(float(row["health_score"]), dtype=torch.float32)
        stress_idx = self.stress_to_idx[row["stress_label"]]

        cause_vector = torch.zeros(len(settings.CAUSE_LABELS), dtype=torch.float32)
        if isinstance(row["cause_labels"], str) and row["cause_labels"].strip():
            for label in row["cause_labels"].split(";"):
                label = label.strip()
                if label in self.cause_to_idx:
                    cause_vector[self.cause_to_idx[label]] = 1.0

        return {
            "image": image_tensor,
            "env_features": env_features,
            "health_score": health_score,
            "stress_label": torch.tensor(stress_idx, dtype=torch.long),
            "cause_labels": cause_vector,
        }
