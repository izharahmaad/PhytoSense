from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PhytoSense API",
    description="Multimodal Plant Health & Stress Assessment System",
    version="0.6.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten this before production deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "PhytoSense API is running. See /docs for the interactive API reference."}
