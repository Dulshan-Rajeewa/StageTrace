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

    print(f"[Agent] Done.\n Snapshot ID: {snapshot_id}")


if __name__ == "__main__":
    main()