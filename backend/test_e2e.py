#!/usr/bin/env python3
"""
End-to-end test automation script for StageTrace.

Creates two snapshots (staging and production) with config differences,
then triggers an incident to verify the full flow works.

Usage:
    python test_e2e.py
"""

import json
import time
import urllib.request
import urllib.error
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:8000"
TIMEOUT = 10

# Sample config payloads
STAGING_CONFIG = {
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
}

PRODUCTION_CONFIG = {
    "database": {
        "host": "prod-db.internal",
        "port": 5432,
        "pool_size": 50,  # Different
        "ssl": True,  # Different
    },
    "cache": {
        "ttl": 7200,  # Different
        "backend": "redis",
        "host": "prod-redis:6379",  # Different
    },
    "logging": {
        "level": "INFO",  # Different
        "format": "json",
    },
}


def log(message: str, level: str = "INFO"):
    """Print timestamped log message."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")


def check_health():
    """Verify backend is running."""
    try:
        with urllib.request.urlopen(f"{API_BASE_URL}/health", timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body)
            if data.get("status") == "ok":
                log("✓ Backend is healthy", "OK")
                return True
    except Exception:
        pass
    log("✗ Backend is not running. Start it with: .venv\\Scripts\\python -m uvicorn app.main:app --reload --port 8000", "ERROR")
    return False


def create_snapshot(environment: str, config: dict) -> str | None:
    """Create a snapshot and return its ID."""
    try:
        payload = {
            "environment": environment,
            "version_tag": f"test-{int(time.time())}",
            "config": config,
            "metadata": {
                "test_run": True,
                "created_at": datetime.utcnow().isoformat(),
            },
        }

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(f"{API_BASE_URL}/snapshots/", data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            if resp.status == 201:
                body = resp.read().decode("utf-8")
                data = json.loads(body)
                snapshot_id = data.get("id")
                log(f"✓ Created {environment} snapshot: {snapshot_id}", "OK")
                return snapshot_id
            else:
                body = resp.read().decode("utf-8")
                log(f"✗ Failed to create {environment} snapshot: {resp.status} - {body}", "ERROR")
                return None
    except Exception as e:
        log(f"✗ Error creating {environment} snapshot: {str(e)}", "ERROR")
        return None


def trigger_incident(staging_id: str, production_id: str) -> str | None:
    """Trigger an incident and return its ID."""
    try:
        payload = {
            "staging_snapshot_id": staging_id,
            "production_snapshot_id": production_id,
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(f"{API_BASE_URL}/incidents/trigger", data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8")
            if resp.status == 201:
                data = json.loads(body)
                incident_id = data.get("incident_id")
                log(f"✓ Triggered incident: {incident_id}", "OK")

                severity = data.get("severity", "unknown")
                deltas = data.get("deltas", [])
                forensic = data.get("forensic_report", {})

                log(f"  Severity: {severity}", "INFO")
                log(f"  Diffs found: {len(deltas)}", "INFO")
                log(f"  Root cause: {forensic.get('summary', 'N/A')}", "INFO")

                return incident_id
            else:
                log(f"✗ Failed to trigger incident: {resp.status} - {body}", "ERROR")
                return None
    except Exception as e:
        log(f"✗ Error triggering incident: {str(e)}", "ERROR")
        return None


def fetch_incident_details(incident_id: str) -> dict | None:
    """Fetch and display full incident details."""
    try:
        with urllib.request.urlopen(f"{API_BASE_URL}/incidents/{incident_id}/report", timeout=TIMEOUT) as resp:
            body = resp.read().decode("utf-8")
            if resp.status == 200:
                log(f"✓ Fetched incident details", "OK")
                return json.loads(body)
            else:
                log(f"✗ Failed to fetch incident: {resp.status}", "ERROR")
                return None
    except Exception as e:
        log(f"✗ Error fetching incident: {str(e)}", "ERROR")
        return None


def main():
    """Run end-to-end test."""
    log("=" * 60, "INFO")
    log("StageTrace End-to-End Test", "INFO")
    log("=" * 60, "INFO")
    
    # Health check
    if not check_health():
        return 1
    
    log("", "INFO")
    log("Step 1: Creating staging snapshot...", "INFO")
    staging_id = create_snapshot("staging", STAGING_CONFIG)
    if not staging_id:
        return 1
    
    log("", "INFO")
    log("Step 2: Creating production snapshot...", "INFO")
    production_id = create_snapshot("production", PRODUCTION_CONFIG)
    if not production_id:
        return 1
    
    log("", "INFO")
    log("Step 3: Triggering incident analysis...", "INFO")
    incident_id = trigger_incident(staging_id, production_id)
    if not incident_id:
        return 1
    
    log("", "INFO")
    log("Step 4: Fetching incident details...", "INFO")
    incident = fetch_incident_details(incident_id)
    if not incident:
        return 1
    
    # Summary
    log("", "INFO")
    log("=" * 60, "OK")
    log("✓ End-to-end test completed successfully!", "OK")
    log("=" * 60, "OK")
    log("", "INFO")
    log("Summary:", "INFO")
    log(f"  Staging Snapshot ID: {staging_id}", "INFO")
    log(f"  Production Snapshot ID: {production_id}", "INFO")
    log(f"  Incident ID: {incident_id}", "INFO")
    log(f"  Severity: {incident.get('severity', 'unknown')}", "INFO")
    log(f"  Diffs: {len(incident.get('deltas', []))}", "INFO")
    log("", "INFO")
    log("Next steps:", "INFO")
    log("  1. Open http://localhost:5173 in your browser", "INFO")
    log("  2. The dashboard should now show the incident", "INFO")
    log("  3. Click on the incident to view details", "INFO")
    log("", "INFO")
    
    return 0


if __name__ == "__main__":
    exit(main())
