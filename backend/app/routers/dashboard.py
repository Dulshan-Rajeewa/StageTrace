from typing import Any

from fastapi import APIRouter

from app.database import supabase
from app.cache import cache

router = APIRouter()


def _parity_status(score: int) -> str:
    if score >= 90:
        return "Healthy"
    if score >= 70:
        return "Warning"
    return "Critical"


@router.get("/summary")
def get_dashboard_summary() -> dict[str, Any]:
    # Check cache
    cache_key = f"dashboard:summary"
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # True totals
    total_result = supabase.table("incidents").select("id", count="exact").execute()
    total_count = total_result.count or 0
    
    critical_result = supabase.table("incidents").select("id", count="exact").eq("severity", "high").execute()
    critical_count = critical_result.count or 0
    
    # Get latest incident only for parity score
    latest = (
        supabase.table("incidents")
        .select("deltas, severity")
        .order("triggered_at", desc=True)
        .limit(1)
        .execute()
    )

    latest_incident = latest.data[0] if latest.data else None
    latest_diffs = len((latest_incident.get("deltas") or []) if latest_incident else [])
    latest_severity = (latest_incident.get("severity") or "low").lower() if latest_incident else "low"

    severity_penalty = {"high": 20, "medium": 10, "low": 0}.get(latest_severity, 0)
    score = max(0, 100 - (latest_diffs * 5) - severity_penalty)
    status = _parity_status(score)

    # Get recent incidents for the table
    result = (
        supabase.table("incidents")
        .select("id, triggered_at, severity, summary, deltas")
        .order("triggered_at", desc=True)
        .limit(50)
        .execute()
    )

    incidents = result.data or []
    recent = [
        {
            "id": incident.get("id"),
            "timestamp": incident.get("triggered_at"),
            "severity": incident.get("severity") or "low",
            "summary": incident.get("summary") or "No summary available.",
            "diff_count": len(incident.get("deltas") or []),
        }
        for incident in incidents
    ]
    
    response = {
        "parity_score": {"score": score, "status": status},
        "total_count": total_count,
        "critical_count": critical_count,
        "incidents": recent,
    }
    
    cache.set(cache_key, response)
    return response