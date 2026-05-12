"""
StageTrace Snapshot Agent

Reads environment variables and a config.yaml from the local machine,
packages them as a snapshot, and POSTs to the StageTrace API.

Usage:
    uv run python agent.py --env staging --env-file fixtures/staging.env --config-file fixtures/staging.config.yaml
    uv run python agent.py --env production --env-file fixtures/production.env --config-file fixtures/production.config.yaml
"""

import argparse
import sys
import os

import httpx
import yaml
from dotenv import dotenv_values


API_BASE = os.getenv("STAGETRACE_API_URL", "http://localhost:8000")


def load_env_vars(env_file: str) -> dict:
    if not os.path.exists(env_file):
        print(f"[Agent] env file not found: {env_file}")
        sys.exit(1)
    return dict(dotenv_values(env_file))


def load_config_yaml(config_file: str) -> dict:
    if not os.path.exists(config_file):
        print(f"[Agent] config file not found: {config_file}")
        sys.exit(1)
    with open(config_file, "r") as f:
        return yaml.safe_load(f) or {}

        
def build_snapshot(env_vars: dict, config: dict) -> dict:
    return {
        "env_vars": env_vars,
        "feature_flags": config.get("feature_flags", {}),
        "services": config.get("services", {}),
        "dependencies": config.get("dependencies", {})
    }
    
    
def post_snapshot(environment: str, version_tag: str | None, config: dict) -> str:
    payload = {
        "environment": environment,
        "version_tag": version_tag,
        "config": config
    }
    response = httpx.post(f"{API_BASE}/snapshots/", json=payload, timeout=30)
    response.raise_for_status()
    data = response.json()
    return data["id"]


def fetch_latest_snapshot(environment: str) -> str | None:
    response = httpx.get(f"{API_BASE}/snapshots/", timeout=30)
    response.raise_for_status()
    snapshots = response.json()
    matches = [s for s in snapshots if s["environment"] == environment]
    return matches[0]["id"] if matches else None


def trigger_incident(staging_id: str, production_id: str) -> str:
    payload = {
        "staging_snapshot_id": staging_id,
        "production_snapshot_id": production_id,
    }
    response = httpx.post(f"{API_BASE}/incidents/trigger", json=payload, timeout=60)
    response.raise_for_status()
    return response.json()["incident_id"]

    
def main():
    parser = argparse.ArgumentParser(description="StageTrace Snapshot Agent")
    parser.add_argument("--env", required=True, choices=["staging", "production"])
    parser.add_argument("--env-file", required=True, help="Path to .env file")
    parser.add_argument("--config-file", required=True, help="Path to config.yaml file")
    parser.add_argument("--version-tag", default=None, help="Optional version tag")
    args = parser.parse_args()

    print(f"[Agent] Loading env vars from {args.env_file}")
    env_vars = load_env_vars(args.env_file)
    
    print(f"[Agent] Loading config from {args.config_file}")
    config = load_config_yaml(args.config_file)

    snapshot = build_snapshot(env_vars, config)

    print(f"[Agent] POST {args.env} snapshot to {API_BASE}/snapshots/")
    snapshot_id = post_snapshot(args.env, args.version_tag, snapshot)

    print(f"[Agent] Done. Snapshot ID: {snapshot_id}")

    opposite_env = "production" if args.env == "staging" else "staging"
    print(f"[Agent] Checking for existing {opposite_env} snapshot...")
    opposite_id = fetch_latest_snapshot(opposite_env)

    if not opposite_id:
        print(f"[Agent] No {opposite_env} snapshot found. Run the agent for {opposite_env} to trigger analysis.")
        return

    staging_id = snapshot_id if args.env == "staging" else opposite_id
    production_id = snapshot_id if args.env == "production" else opposite_id

    print(f"[Agent] Both snapshots found. Triggering incident analysis...")
    incident_id = trigger_incident(staging_id, production_id)
    print(f"[Agent] Incident created. Incident ID: {incident_id}")


if __name__ == "__main__":
    main()