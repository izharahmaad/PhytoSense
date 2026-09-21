from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.db import crud
from app.db.database import get_db
from app.ml.inference import run_inference
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
    allowed_types = {"image/jpeg", "image/jpg", "image/png"}

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are supported.",
        )

    image_bytes = await image.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    max_bytes = 10 * 1024 * 1024
    if len(image_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail="The image must be smaller than 10 MB.",
        )

    try:
        result = run_inference(
            image_bytes=image_bytes,
            temperature=temperature,
            humidity=humidity,
            light_intensity=light_intensity,
            soil_moisture=soil_moisture,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    crud.create_prediction(
        db,
        {
            "temperature": temperature,
            "humidity": humidity,
            "light_intensity": light_intensity,
            "soil_moisture": soil_moisture,
            "health_score": result["health_score"],
            "stress_level": result["stress_level"],
            "cause_probabilities": result["cause_probabilities"],
            "recommendation": result["recommendation"],
        },
    )

    return result


@router.get("/history")
def history(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 100))
    records = crud.list_predictions(db, limit=limit)

    return [
        {
            "id": record.id,
            "created_at": (
                record.created_at.isoformat()
                if record.created_at
                else None
            ),
            "temperature": record.temperature,
            "humidity": record.humidity,
            "light_intensity": record.light_intensity,
            "soil_moisture": record.soil_moisture,
            "health_score": record.health_score,
            "stress_level": record.stress_level,
            "recommendation": record.recommendation,
        }
        for record in records
    ]


@router.get("/health")
def health_check():
    return {"status": "ok", "service": "PhytoSense API"}