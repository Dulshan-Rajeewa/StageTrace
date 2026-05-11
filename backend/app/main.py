from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import FRONTEND_ORIGINS
from app.routers import snapshots, incidents, dashboard

app = FastAPI(
    title="StageTrace API",
    description="Forensic intelligence platform for environment configuration drift.",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(snapshots.router, prefix="/snapshots", tags=["snapshots"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

@app.get("/health")
def health():
    return {"status": "ok"}