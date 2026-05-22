"""
Tests for incidents endpoints.

POST /incidents/trigger       - Trigger incident analysis
GET /incidents/{id}/report    - Fetch incident report
GET /incidents/               - List incidents
GET /incidents/history        - Get drift history
"""

import json
import pytest


def test_trigger_incident_success(client, mock_supabase, sample_snapshot_payload):
    """POST /incidents/trigger creates incident and returns report."""
    staging_response = client.post(
        "/snapshots/",
        json={**sample_snapshot_payload, "environment": "staging", "version_tag": "v1"}
    )
    staging_id = staging_response.json()["id"]
    
    prod_payload = {
        **sample_snapshot_payload,
        "environment": "production",
        "version_tag": "v1",
        "config": {
            "database": {"host": "prod-db", "port": 5432},
            "cache": {"ttl": 7200, "backend": "redis"},
            "logging": {"level": "INFO"},
        }
    }
    prod_response = client.post("/snapshots/", json=prod_payload)
    prod_id = prod_response.json()["id"]
    
    trigger_payload = {
        "staging_snapshot_id": staging_id,
        "production_snapshot_id": prod_id,
    }
    response = client.post("/incidents/trigger", json=trigger_payload)
    
    assert response.status_code == 201
    data = response.json()
    assert "incident_id" in data
    assert "severity" in data
    assert "deltas" in data
    assert "forensic_report" in data
    assert isinstance(data["deltas"], list)
    assert len(data["deltas"]) > 0


def test_trigger_incident_no_diffs(client, mock_supabase):
    """POST /incidents/trigger with identical configs has empty deltas."""
    config = {
        "database": {"host": "db", "port": 5432},
        "cache": {"ttl": 3600},
    }
    
    resp1 = client.post(
        "/snapshots/",
        json={"environment": "staging", "version_tag": "v1", "config": config}
    )
    staging_id = resp1.json()["id"]
    
    resp2 = client.post(
        "/snapshots/",
        json={"environment": "production", "version_tag": "v1", "config": config}
    )
    prod_id = resp2.json()["id"]
    
    response = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": staging_id,
            "production_snapshot_id": prod_id,
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert len(data["deltas"]) == 0


def test_trigger_incident_staging_not_found(client):
    """POST /incidents/trigger with invalid staging snapshot returns 404."""
    response = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": "nonexistent-staging",
            "production_snapshot_id": "nonexistent-prod",
        }
    )
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_trigger_incident_production_not_found(client, mock_supabase):
    """POST /incidents/trigger with invalid production snapshot returns 404."""
    resp = client.post(
        "/snapshots/",
        json={
            "environment": "staging",
            "version_tag": "v1",
            "config": {"key": "value"}
        }
    )
    staging_id = resp.json()["id"]
    
    response = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": staging_id,
            "production_snapshot_id": "nonexistent-prod",
        }
    )
    
    assert response.status_code == 404


def test_trigger_incident_with_description(client, mock_supabase):
    """POST /incidents/trigger accepts optional incident_description."""
    resp1 = client.post(
        "/snapshots/",
        json={"environment": "staging", "version_tag": "v1", "config": {"a": 1}}
    )
    staging_id = resp1.json()["id"]
    
    resp2 = client.post(
        "/snapshots/",
        json={"environment": "production", "version_tag": "v1", "config": {"a": 2}}
    )
    prod_id = resp2.json()["id"]
    
    response = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": staging_id,
            "production_snapshot_id": prod_id,
            "incident_description": "User reports emails not being sent in production",
        }
    )
    
    assert response.status_code == 201


def test_get_incident_report_success(client, mock_supabase):
    """GET /incidents/{id}/report returns full incident details."""
    resp1 = client.post(
        "/snapshots/",
        json={
            "environment": "staging",
            "version_tag": "v1",
            "config": {"email_rate_limit_enabled": False}
        }
    )
    staging_id = resp1.json()["id"]
    
    resp2 = client.post(
        "/snapshots/",
        json={
            "environment": "production",
            "version_tag": "v1",
            "config": {"email_rate_limit_enabled": True}
        }
    )
    prod_id = resp2.json()["id"]
    
    trigger_resp = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": staging_id,
            "production_snapshot_id": prod_id,
        }
    )
    incident_id = trigger_resp.json()["incident_id"]
    
    response = client.get(f"/incidents/{incident_id}/report")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == incident_id
    assert "severity" in data
    assert "deltas" in data
    assert "forensic_report" in data
    assert "staging_snapshot_id" in data
    assert "production_snapshot_id" in data


def test_get_incident_report_not_found(client):
    """GET /incidents/{id}/report with invalid ID returns 404."""
    response = client.get("/incidents/nonexistent-incident/report")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_list_incidents_empty(client):
    """GET /incidents/ returns empty list initially."""
    response = client.get("/incidents/")
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert isinstance(data["data"], list)
    assert len(data["data"]) == 0


def test_list_incidents_pagination(client, mock_supabase):
    """GET /incidents/ supports limit and offset parameters."""
    for i in range(3):
        resp1 = client.post(
            "/snapshots/",
            json={
                "environment": "staging",
                "version_tag": f"v{i}",
                "config": {"key": i}
            }
        )
        staging_id = resp1.json()["id"]
        
        resp2 = client.post(
            "/snapshots/",
            json={
                "environment": "production",
                "version_tag": f"v{i}",
                "config": {"key": i + 100}
            }
        )
        prod_id = resp2.json()["id"]
        
        client.post(
            "/incidents/trigger",
            json={
                "staging_snapshot_id": staging_id,
                "production_snapshot_id": prod_id,
            }
        )
    
    response = client.get("/incidents/?limit=2&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["data"]) == 2
    assert data["pagination"]["total"] >= 3


def test_get_drift_history_empty(client):
    """GET /incidents/history returns empty when no incidents."""
    response = client.get("/incidents/history")
    
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert "pagination" in data
    assert "filters" in data
    assert isinstance(data["data"], list)


def test_get_drift_history_with_filter(client):
    """GET /incidents/history supports search filter."""
    response = client.get("/incidents/history?search=database")
    
    assert response.status_code == 200
    data = response.json()
    assert "filters" in data
    assert data["filters"]["search"] == "database"


def test_get_drift_history_time_range(client):
    """GET /incidents/history supports time range filter."""
    response = client.get("/incidents/history?time_range=last_7_days")
    
    assert response.status_code == 200
    data = response.json()
    assert data["filters"]["time_range"] == "last_7_days"


def test_forensic_report_structure(client, mock_supabase):
    """Forensic report has required fields."""
    resp1 = client.post(
        "/snapshots/",
        json={"environment": "staging", "version_tag": "v1", "config": {"a": 1}}
    )
    staging_id = resp1.json()["id"]
    
    resp2 = client.post(
        "/snapshots/",
        json={"environment": "production", "version_tag": "v1", "config": {"a": 2}}
    )
    prod_id = resp2.json()["id"]
    
    response = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": staging_id,
            "production_snapshot_id": prod_id,
        }
    )
    
    data = response.json()
    report = data["forensic_report"]
    
    assert "top_cause" in report
    assert "ranked_causes" in report
    assert "summary" in report
    assert "confidence" in report
    assert "suggested_fix" in report
    assert report["confidence"] in ["high", "medium", "low"]