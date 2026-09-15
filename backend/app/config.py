import os
from pathlib import Path

from dotenv import load_dotenv


BACKEND_ROOT = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_ROOT / ".env")


class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        str(BACKEND_ROOT / "models" / "phytosense_fusion.pt"),
    )
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BACKEND_ROOT / 'phytosense.db'}",
    )
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8001"))
    MAX_UPLOAD_SIZE_MB: int = int(
        os.getenv("MAX_UPLOAD_SIZE_MB", "10")
    )
    IMAGE_SIZE: int = 224

    CLASS_NAMES = [
        "healthy",
        "mild_stress",
        "moderate_stress",
        "severe_stress",
    ]

    CAUSE_LABELS = [
        "water_deficit",
        "nutrient_deficiency",
        "pest_pressure",
        "heat_stress",
        "fungal_infection",
        "light_stress",
    ]


settings = Settings()