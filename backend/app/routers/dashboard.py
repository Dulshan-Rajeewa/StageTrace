from typing import Any

from fastapi import APIRouter

from app.database import supabase

router = APIRouter()


def _parity_status(score: int) -> str:
    if score >= 90:
        return "Healthy"
    if score >= 70:
        return "Warning"
    return "Critical"


@router.get("/summary")
def get_dashboard_summary() -> dict[str, Any]:
    # Get latest incident only for parity score
    latest = (
        supabase.table("incidents")
        .select("deltas")
        .order("triggered_at", desc=True)
        .limit(1)
        .execute()
    )

    latest_diffs = len((latest.data[0].get("deltas") or []) if latest.data else [])
    score = max(0, 100 - (latest_diffs * 5))
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
    
    return {
        "parity_score": {
            "score": score,
            "status": status,
        },
        "incidents": recent,
    }