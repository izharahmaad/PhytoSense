import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "models/phytosense_fusion.pt")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./phytosense.db")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", 8000))
    MAX_UPLOAD_SIZE_MB: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", 10))
    IMAGE_SIZE: int = 224
    CLASS_NAMES = ["healthy", "mild_stress", "moderate_stress", "severe_stress"]
    CAUSE_LABELS = ["water_deficit", "nutrient_deficiency", "pest_pressure",
                     "heat_stress", "fungal_infection", "light_stress"]

settings = Settings()
