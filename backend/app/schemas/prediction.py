from typing import Dict

from pydantic import BaseModel, ConfigDict, Field


class PredictionResponse(BaseModel):
    health_score: float = Field(..., ge=0.0, le=1.0)
    stress_level: str
    stress_probabilities: Dict[str, float]
    cause_probabilities: Dict[str, float]
    environmental_attribution: Dict[str, float]
    recommendation: str


class PredictionHistoryItem(BaseModel):
    id: int
    created_at: str
    temperature: float
    humidity: float
    light_intensity: float
    soil_moisture: float
    health_score: float
    stress_level: str
    recommendation: str

    model_config = ConfigDict(from_attributes=True)