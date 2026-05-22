"""
Tests for snapshots endpoints.

POST /snapshots/    - Create snapshot
GET /snapshots/     - List snapshots
"""

import json
import uuid
import pytest


def test_create_snapshot_success(client, sample_snapshot_payload):
    """POST /snapshots/ creates snapshot and returns ID."""
    response = client.post("/snapshots/", json=sample_snapshot_payload)
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert "payload_url" in data
    assert isinstance(data["id"], str)
    assert len(data["id"]) > 0


def test_create_snapshot_staging(client):
    """POST /snapshots/ accepts staging environment."""
    payload = {
        "environment": "staging",
        "version_tag": "test-1",
        "config": {"key": "value"}
    }
    response = client.post("/snapshots/", json=payload)
    assert response.status_code == 201


def test_create_snapshot_production(client):
    """POST /snapshots/ accepts production environment."""
    payload = {
        "environment": "production",
        "version_tag": "test-1",
        "config": {"key": "value"}
    }
    response = client.post("/snapshots/", json=payload)
    assert response.status_code == 201


def test_create_snapshot_invalid_environment(client):
    """POST /snapshots/ rejects invalid environment."""
    payload = {
        "environment": "development",
        "version_tag": "test-1",
        "config": {"key": "value"}
    }
    response = client.post("/snapshots/", json=payload)
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


def test_create_snapshot_complex_config(client):
    """POST /snapshots/ handles nested config objects."""
    payload = {
        "environment": "staging",
        "version_tag": "v1.2.3",
        "config": {
            "database": {
                "primary": {"host": "db-1", "port": 5432},
                "replica": {"host": "db-2", "port": 5432},
            },
            "cache": ["redis-1", "redis-2"],
            "logging": {"level": "DEBUG"}
        }
    }
    response = client.post("/snapshots/", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert "id" in data


def test_create_snapshot_optional_version_tag(client):
    """POST /snapshots/ version_tag is optional."""
    payload = {
        "environment": "staging",
        "config": {"key": "value"}
    }
    response = client.post("/snapshots/", json=payload)
    
    assert response.status_code == 201


def test_list_snapshots_empty(client):
    """GET /snapshots/ returns empty list initially."""
    response = client.get("/snapshots/")
    
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


def test_list_snapshots_after_create(client, sample_snapshot_payload):
    """GET /snapshots/ lists created snapshots."""
    resp1 = client.post("/snapshots/", json=sample_snapshot_payload)
    id1 = resp1.json()["id"]
    
    payload2 = {**sample_snapshot_payload, "environment": "production", "version_tag": "v2.0.0"}
    resp2 = client.post("/snapshots/", json=payload2)
    id2 = resp2.json()["id"]
    
    response = client.get("/snapshots/")
    assert response.status_code == 200
    snapshots = response.json()
    
    assert len(snapshots) == 2
    ids = {s["id"] for s in snapshots}
    assert id1 in ids
    assert id2 in ids


def test_list_snapshots_ordered_by_timestamp(client, sample_snapshot_payload):
    """GET /snapshots/ returns snapshots ordered by timestamp (descending)."""
    client.post("/snapshots/", json={**sample_snapshot_payload, "version_tag": "v1"})
    client.post("/snapshots/", json={**sample_snapshot_payload, "version_tag": "v2"})
    
    response = client.get("/snapshots/")
    snapshots = response.json()
    
    assert len(snapshots) >= 2
    assert snapshots[0]["timestamp"] >= snapshots[1]["timestamp"]