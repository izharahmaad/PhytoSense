from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.sql import func

from app.db.database import Base


class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    temperature = Column(Float)
    humidity = Column(Float)
    light_intensity = Column(Float)
    soil_moisture = Column(Float)
    health_score = Column(Float)
    stress_level = Column(String)
    cause_probabilities = Column(JSON)
    recommendation = Column(String)
