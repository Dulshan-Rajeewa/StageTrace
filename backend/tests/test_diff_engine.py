"""
Unit tests for diff_engine.py

Tests the configuration diff detection and delta categorization.
"""

import sys
from pathlib import Path

# Add parent directory to path so we can import diff_engine
sys.path.insert(0, str(Path(__file__).parent.parent))

from diff_engine import compute_diff


def test_identical_snapshots_return_empty_list():
    """identical configs return empty delta list"""
    config = {
        "database": {"host": "db", "port": 5432},
        "cache": {"ttl": 3600},
    }
    
    deltas = compute_diff(config, config)
    
    assert deltas == []


def test_single_modified_key_detects_one_delta():
    """single value change detected as one delta"""
    config_a = {"database": {"host": "staging", "port": 5432}}
    config_b = {"database": {"host": "production", "port": 5432}}
    
    deltas = compute_diff(config_a, config_b)
    
    assert len(deltas) == 1
    assert deltas[0].key == "database.host"
    assert deltas[0].staging_value == "staging"
    assert deltas[0].production_value == "production"


def test_multiple_changes_include_added_removed_and_modified_keys():
    """multiple diffs including add, remove, modify detected"""
    config_a = {
        "api_key": "secret",
        "debug": True,
        "database": {"host": "staging"}
    }
    config_b = {
        "api_key": "different_secret",
        "database": {"host": "production"},
        "new_feature": "enabled"
    }
    
    deltas = compute_diff(config_a, config_b)
    
    keys = {d.key for d in deltas}
    assert "api_key" in keys
    assert "debug" in keys
    assert "database.host" in keys
    assert "new_feature" in keys


def test_nested_config_changes_are_detected():
    """deeply nested config changes detected"""
    config_a = {
        "services": {
            "email": {
                "provider": "sendgrid",
                "rate_limit": 1000
            }
        }
    }
    config_b = {
        "services": {
            "email": {
                "provider": "mailgun",
                "rate_limit": 500
            }
        }
    }
    
    deltas = compute_diff(config_a, config_b)
    
    keys = {d.key for d in deltas}
    assert "services.email.provider" in keys
    assert "services.email.rate_limit" in keys