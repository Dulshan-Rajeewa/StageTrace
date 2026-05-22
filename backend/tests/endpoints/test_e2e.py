"""
End-to-end integration tests for StageTrace.

Tests the complete flow:
1. Create staging snapshot
2. Create production snapshot
3. Trigger incident analysis
4. Fetch forensic report
"""

import pytest


def test_e2e_complete_flow(client, mock_supabase):
    """
    E2E: Create snapshots → trigger incident → fetch report.
    
    Scenario: Silent feature flag divergence
    - Staging: email_rate_limit_enabled = False
    - Production: email_rate_limit_enabled = True
    """
    
    staging_config = {
        "database": {
            "host": "staging-db.internal",
            "port": 5432,
            "pool_size": 10,
            "ssl": False,
        },
        "cache": {
            "ttl": 3600,
            "backend": "redis",
            "host": "staging-redis:6379",
        },
        "logging": {
            "level": "DEBUG",
            "format": "json",
        },
        "email_rate_limit_enabled": False,
    }
    
    staging_payload = {
        "environment": "staging",
        "version_tag": "v1.0.0",
        "config": staging_config,
    }
    
    staging_response = client.post("/snapshots/", json=staging_payload)
    assert staging_response.status_code == 201
    staging_id = staging_response.json()["id"]
    assert staging_id is not None
    
    production_config = {
        "database": {
            "host": "prod-db.internal",
            "port": 5432,
            "pool_size": 50,
            "ssl": True,
        },
        "cache": {
            "ttl": 7200,
            "backend": "redis",
            "host": "prod-redis:6379",
        },
        "logging": {
            "level": "INFO",
            "format": "json",
        },
        "email_rate_limit_enabled": True,
    }
    
    prod_payload = {
        "environment": "production",
        "version_tag": "v1.0.0",
        "config": production_config,
    }
    
    prod_response = client.post("/snapshots/", json=prod_payload)
    assert prod_response.status_code == 201
    prod_id = prod_response.json()["id"]
    assert prod_id is not None
    
    trigger_payload = {
        "staging_snapshot_id": staging_id,
        "production_snapshot_id": prod_id,
        "incident_description": "Users unable to send emails in production",
    }
    
    trigger_response = client.post("/incidents/trigger", json=trigger_payload)
    assert trigger_response.status_code == 201
    trigger_data = trigger_response.json()
    
    incident_id = trigger_data["incident_id"]
    assert incident_id is not None
    
    assert "severity" in trigger_data
    assert "deltas" in trigger_data
    assert "forensic_report" in trigger_data
    
    deltas = trigger_data["deltas"]
    assert len(deltas) > 0
    
    for delta in deltas:
        assert "key" in delta
        assert "staging_value" in delta
        assert "production_value" in delta
        assert "category" in delta
        assert "severity_hint" in delta
    
    # Should detect multiple diffs (the key diff is category type)
    assert len(deltas) > 0, f"Expected deltas but got empty list: {deltas}"
    
    report_response = client.get(f"/incidents/{incident_id}/report")
    assert report_response.status_code == 200
    
    report_data = report_response.json()
    
    assert report_data["id"] == incident_id
    assert "severity" in report_data
    assert "status" in report_data
    assert "summary" in report_data
    assert "deltas" in report_data
    assert "forensic_report" in report_data
    assert "staging_snapshot_id" in report_data
    assert "production_snapshot_id" in report_data
    
    forensic = report_data["forensic_report"]
    assert "top_cause" in forensic
    assert "ranked_causes" in forensic
    assert "summary" in forensic
    assert "confidence" in forensic
    assert "suggested_fix" in forensic
    
    assert forensic["confidence"] in ["high", "medium", "low"]
    
    list_response = client.get("/incidents/")
    assert list_response.status_code == 200
    
    list_data = list_response.json()
    assert "data" in list_data
    assert "pagination" in list_data
    
    incident_ids = {inc["id"] for inc in list_data["data"]}
    assert incident_id in incident_ids


def test_e2e_no_diffs(client, mock_supabase):
    """E2E: Identical configs result in empty diffs and low severity."""
    config = {
        "api_key": "secret",
        "debug": False,
        "database": {"host": "db", "port": 5432},
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
    
    incident_id = data["incident_id"]
    report = client.get(f"/incidents/{incident_id}/report").json()
    
    assert report["severity"] == "low"
    assert len(report["deltas"]) == 0


def test_e2e_high_severity_incident(client, mock_supabase):
    """E2E: Sensitive config change (API key) triggers high severity."""
    staging_config = {"api_key": "staging-secret", "debug": False}
    prod_config = {"api_key": "prod-secret", "debug": False}
    
    resp1 = client.post(
        "/snapshots/",
        json={"environment": "staging", "version_tag": "v1", "config": staging_config}
    )
    staging_id = resp1.json()["id"]
    
    resp2 = client.post(
        "/snapshots/",
        json={"environment": "production", "version_tag": "v1", "config": prod_config}
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
    
    assert data["severity"] == "high"
    assert len(data["deltas"]) == 1
    assert data["deltas"][0]["key"] == "api_key"
    assert data["deltas"][0]["severity_hint"] == "high"


def test_e2e_workflow_with_snapshot_listing(client, mock_supabase):
    """E2E: Create snapshots, list them, then trigger incident."""
    resp1 = client.post(
        "/snapshots/",
        json={"environment": "staging", "version_tag": "v1.0", "config": {"a": 1}}
    )
    snap1 = resp1.json()["id"]
    
    resp2 = client.post(
        "/snapshots/",
        json={"environment": "staging", "version_tag": "v2.0", "config": {"a": 2}}
    )
    snap2 = resp2.json()["id"]
    
    list_resp = client.get("/snapshots/")
    assert list_resp.status_code == 200
    snapshots = list_resp.json()
    assert len(snapshots) >= 2
    
    snap_ids = {s["id"] for s in snapshots}
    assert snap1 in snap_ids
    assert snap2 in snap_ids
    
    resp3 = client.post(
        "/snapshots/",
        json={"environment": "production", "version_tag": "v1.0", "config": {"a": 100}}
    )
    snap3 = resp3.json()["id"]
    
    trigger_resp = client.post(
        "/incidents/trigger",
        json={
            "staging_snapshot_id": snap2,
            "production_snapshot_id": snap3,
        }
    )
    
    assert trigger_resp.status_code == 201
    incident_id = trigger_resp.json()["incident_id"]
    
    report_resp = client.get(f"/incidents/{incident_id}/report")
    assert report_resp.status_code == 200