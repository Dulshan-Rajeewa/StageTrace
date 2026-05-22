from datetime import datetime, timezone
import json
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import supabase
from app.config import SUPABASE_BUCKET
from app.cache import cache

router = APIRouter()


class SnapshotPayload(BaseModel):
    environment: str  # "staging" | "production"
    version_tag: str | None = None
    config: dict
    
    
@router.post("/", status_code=201)
def create_snapshot(payload: SnapshotPayload):
    if payload.environment not in ("staging", "production"):
        raise HTTPException(status_code=400, detail="Environment must be 'staging' or 'production'")
    
    snapshot_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    file_path = f"{payload.environment}/{snapshot_id}.json"

    # Upload config JSON to Supabase Storage
    config_bytes = json.dumps(payload.config).encode("utf-8")
    supabase.storage.from_(SUPABASE_BUCKET).upload(
        file=config_bytes,
        path=file_path,
        file_options={"content-type": "application/json"}
    )
    
    # Get public URL
    payload_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(file_path)

    # Insert record into snapshots table
    record = {
        "id": snapshot_id,
        "environment": payload.environment,
        "version_tag": payload.version_tag,
        "timestamp": timestamp,
        "payload_url": payload_url,
        "metadata": {"source": "agent"}
    }
    supabase.table("snapshots").insert(record).execute()
    cache.invalidate_pattern("snapshot:")

    return {"id": snapshot_id, "payload_url": payload_url}


@router.get("/")
def list_snapshots():
    # Check cache
    cache_key = f"snapshot:list"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    result = supabase.table("snapshots").select("*").order("timestamp", desc=True).execute()
    response = result.data
    
    cache.set(cache_key, response)
    return response