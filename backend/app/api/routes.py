from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.ml.inference import run_inference
from app.db.database import get_db
from app.db import crud
from app.schemas.prediction import PredictionResponse

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    image: UploadFile = File(...),
    temperature: float = Form(...),
    humidity: float = Form(...),
    light_intensity: float = Form(...),
    soil_moisture: float = Form(...),
    db: Session = Depends(get_db),
):
    if image.content_type not in ("image/jpeg", "image/png", "image/jpg"):
        raise HTTPException(status_code=400, detail="Only JPEG/PNG images are supported.")

    image_bytes = await image.read()
    result = run_inference(image_bytes, temperature, humidity, light_intensity, soil_moisture)

    crud.create_prediction(db, {
        "temperature": temperature,
        "humidity": humidity,
        "light_intensity": light_intensity,
        "soil_moisture": soil_moisture,
        "health_score": result["health_score"],
        "stress_level": result["stress_level"],
        "cause_probabilities": result["cause_probabilities"],
        "recommendation": result["recommendation"],
    })

    return result


@router.get("/history")
def history(limit: int = 50, db: Session = Depends(get_db)):
    records = crud.list_predictions(db, limit=limit)
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "light_intensity": r.light_intensity,
            "soil_moisture": r.soil_moisture,
            "health_score": r.health_score,
            "stress_level": r.stress_level,
            "recommendation": r.recommendation,
        }
        for r in records
    ]


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "PhytoSense API"}
