from datetime import datetime, timezone, timedelta
import json
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.database import supabase
from app.config import SUPABASE_BUCKET
from diff_engine import compute_diff
from ranker import rank_deltas

router = APIRouter()


class TriggerPayload(BaseModel):
    staging_snapshot_id: str
    production_snapshot_id: str
    incident_description: str | None = None


def _fetch_config(snapshot_id: str, environment: str) -> dict:
    """ Download config JSON from Supabase Storage """
    file_path = f"{environment}/{snapshot_id}.json"
    response = supabase.storage.from_(SUPABASE_BUCKET).download(file_path)
    return json.loads(response)


def _derive_severity(deltas: list[dict[str, Any]]) -> str:
    hints = {str(d.get("severity_hint", "")).lower() for d in deltas}
    if "high" in hints:
        return "high"
    if "medium" in hints:
        return "medium"
    return "low"


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
        payload.staging_snapshot_id,
        "staging"
    )
    production_config = _fetch_config(
        payload.production_snapshot_id,
        "production"
    )
    
    # Diff
    deltas = compute_diff(staging_config, production_config)

    # AI ranking
    report = rank_deltas(deltas)

    serialized_deltas = [
        {
            "key": d.key,
            "staging_value": d.staging_value,
            "production_value": d.production_value,
            "category": d.category,
            "severity_hint": d.severity_hint,
        }
        for d in deltas
    ]
    severity = _derive_severity(serialized_deltas)
    forensic_report = {
        "top_cause": report.top_cause,
        "ranked_causes": report.ranked_causes,
        "summary": report.summary,
        "confidence": report.confidence,
        "suggested_fix": report.suggested_fix,
    }

    # Store incident
    incident_id = str(uuid.uuid4())
    supabase.table("incidents").insert({
        "id": incident_id,
        "triggered_at": datetime.now(timezone.utc).isoformat(),
        "staging_snapshot_id": payload.staging_snapshot_id,
        "production_snapshot_id": payload.production_snapshot_id,
        "status": "open",
        "severity": severity,
        "summary": report.summary,
        "deltas": serialized_deltas,
        "forensic_report": forensic_report,
    }).execute()

    return {
        "incident_id": incident_id,
        "severity": severity,
        "deltas": serialized_deltas,
        "forensic_report": forensic_report,
    }
    

@router.get("/")
def list_incidents(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    # Get total count
    count_result = supabase.table("incidents").select("id", count="exact").execute()
    total_count = count_result.count if count_result.count else 0
    
    # Get paginated results
    result = (
        supabase.table("incidents")
        .select("*")
        .order("triggered_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    rows = result.data or []
    incidents = [
        {
            "id": row.get("id"),
            "timestamp": row.get("triggered_at"),
            "severity": row.get("severity") or "low",
            "status": row.get("status") or "open",
            "summary": row.get("summary") or "No summary available.",
            "diff_count": len(row.get("deltas") or []),
        }
        for row in rows
    ]
    
    return {
        "data": incidents,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count,
        }
    }


@router.get("/history")
def get_drift_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    environment_pair: str = Query("staging/production", description="Environment pair filter"),
    time_range: str = Query("all", regex="^(last_7_days|last_30_days|last_90_days|all)$", description="Time range filter"),
    search: str = Query("", description="Config key search filter")
):
    # Build time filter
    now = datetime.now(timezone.utc)
    time_cutoff = None
    
    if time_range == "last_7_days":
        time_cutoff = (now - timedelta(days=7)).isoformat()
    elif time_range == "last_30_days":
        time_cutoff = (now - timedelta(days=30)).isoformat()
    elif time_range == "last_90_days":
        time_cutoff = (now - timedelta(days=90)).isoformat()
    
    # Build query
    query = supabase.table("incidents").select("id, triggered_at, deltas")
    
    if time_cutoff:
        query = query.gte("triggered_at", time_cutoff)
    
    # Get total count with filters
    count_result = query.order("triggered_at", desc=True).execute()
    total_filtered = len(count_result.data or [])
    
    # Get paginated results
    result = query.order("triggered_at", desc=True).range(offset, offset + limit - 1).execute()
    rows = result.data or []
    
    history: list[dict[str, Any]] = []

    for row in rows:
        deltas = row.get("deltas") or []
        for delta in deltas:
            staging_value = delta.get("staging_value")
            production_value = delta.get("production_value")
            config_key = delta.get("key", "")

            if staging_value is None:
                change_type = "Added"
            elif production_value is None:
                change_type = "Missing"
            else:
                change_type = "Modified"

            # Apply search filter
            if search and search.lower() not in config_key.lower():
                continue

            history.append(
                {
                    "incident_id": row.get("id"),
                    "timestamp": row.get("triggered_at"),
                    "environment_pair": environment_pair,
                    "config_key": config_key,
                    "staging_value": staging_value,
                    "production_value": production_value,
                    "change_type": change_type,
                }
            )

    return {
        "data": history,
        "pagination": {
            "total": total_filtered,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_filtered,
        },
        "filters": {
            "time_range": time_range,
            "environment_pair": environment_pair,
            "search": search,
        }
    }


@router.get("/{incident_id}/report")
def get_incident_report(incident_id: str):
    result = (
        supabase.table("incidents")
        .select("*")
        .eq("id", incident_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Incident not found")

    row = result.data
    return {
        "id": row.get("id"),
        "timestamp": row.get("triggered_at"),
        "severity": row.get("severity") or "low",
        "status": row.get("status") or "open",
        "summary": row.get("summary") or "No summary available.",
        "deltas": row.get("deltas") or [],
        "forensic_report": row.get("forensic_report") or {
            "top_cause": "unknown",
            "ranked_causes": [],
            "summary": row.get("summary") or "No summary available.",
            "confidence": "low",
            "suggested_fix": "Review incident deltas manually.",
        },
        "staging_snapshot_id": row.get("staging_snapshot_id"),
        "production_snapshot_id": row.get("production_snapshot_id"),
    }