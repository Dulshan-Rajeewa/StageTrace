from datetime import datetime, timezone
import json
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import supabase
from app.config import SUPABASE_BUCKET
from diff_engine import compute_diff
from ranker import rank_deltas

router = APIRouter()


class TriggerPayload(BaseModel):
    staging_snapshot_id: str
    production_snapshot_id: str


def _fetch_config(payload_url: str, snapshot_id: str, environment: str) -> dict:
    """ Download config JSON from Supabase Storage """
    file_path = f"{environment}/{snapshot_id}.json"
    response = supabase.storage.from_(SUPABASE_BUCKET).download(file_path)
    return json.loads(response)


@router.post("/trigger", status_code=201)
def trigger_incident(payload: TriggerPayload):
    # Fetch both snapshot records
    staging_row = supabase.table("snapshots").select("*").eq("id", payload.staging_snapshot_id).single().execute()
    production_row = supabase.table("snapshots").select("*").eq("id", payload.production_snapshot_id).single().execute()
    
    if not staging_row.data:
        raise HTTPException(status_code=404, detail="Staging snapshot not found")
    if not production_row.data:
        raise HTTPException(status_code=404, detail="Production snapshot not found")
    
    # Download configs from Storage
    staging_config = _fetch_config(
        staging_row.data["payload_url"],
        payload.staging_snapshot_id,
        "staging"
    )
    production_config = _fetch_config(
        production_row.data["payload_url"],
        payload.production_snapshot_id,
        "staging"
    )
    
    # Diff
    deltas = compute_diff(staging_config, production_config)

    # AI ranking
    report = rank_deltas(deltas)

    # Store incident
    incident_id = str(uuid.uuid4())
    supabase.table("incidents").insert({
        "id": incident_id,
        "triggered_at": datetime.now(timezone.utc).isoformat(),
        "staging_snapshot_id": payload.staging_snapshot_id,
        "production_snapshot_id": payload.production_snapshot_id,
        "status": "resolved"
    }).execute()

    return {
        "incident_id": incident_id,
        "deltas": [
            {
                "key": d.key,
                "staging_value": d.staging_value,
                "production_value": d.production_value,
                "category": d.category,
                "severity_hint": d.severity_hint
            } for d in deltas
        ],
        "forensic_report": {
            "top_cause": report.top_cause,
            "ranked_causes": report.ranked_causes,
            "summary": report.summary,
            "confidence": report.confidence,
            "suggested_fix": report.suggested_fix
        }
    }
    

@router.get("/{incident_id}/report")
def get_incident_report(incident_id: str):
    result = supabase.table("incidents").select("*").eq("id", incident_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")
    return result.data