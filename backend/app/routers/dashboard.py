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
    result = (
        supabase.table("incidents")
        .select("id, triggered_at, severity, summary, deltas")
        .order("triggered_at", desc=True)
        .limit(50)
        .execute()
    )

    incidents = result.data or []
    total_diffs = sum(len(incident.get("deltas") or []) for incident in incidents)

    # Simple parity model: every mismatch reduces parity by 3 points, floor at 0.
    score = max(0, 100 - (total_diffs * 3))
    status = _parity_status(score)

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
