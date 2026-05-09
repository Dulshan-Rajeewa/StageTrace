from fastapi import FastAPI
from app.routers import snapshots, incidents

app = FastAPI(
    title="StageTrace API",
    description="Forensic intelligence platform for environment configuration drift.",
    version="0.1.0"
)

app.include_router(snapshots.router, prefix="/snapshots", tags=["snapshots"])
app.include_router(incidents.router, prefix="/incidents", tags=["incidents"])

@app.get("/health")
def health():
    return {"status": "ok"}