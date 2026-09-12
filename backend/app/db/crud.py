from sqlalchemy.orm import Session

from app.db.models import PredictionRecord


def create_prediction(db: Session, payload: dict) -> PredictionRecord:
    record = PredictionRecord(
        temperature=payload["temperature"],
        humidity=payload["humidity"],
        light_intensity=payload["light_intensity"],
        soil_moisture=payload["soil_moisture"],
        health_score=payload["health_score"],
        stress_level=payload["stress_level"],
        cause_probabilities=payload["cause_probabilities"],
        recommendation=payload["recommendation"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def list_predictions(db: Session, limit: int = 50):
    return (
        db.query(PredictionRecord)
        .order_by(PredictionRecord.created_at.desc())
        .limit(limit)
        .all()
    )
