from backend.diff_engine import compute_diff


def test_identical_snapshots_return_empty_list():
    staging = {"api_key": "secret", "nested": {"value": 1}}
    production = {"api_key": "secret", "nested": {"value": 1}}

    result = compute_diff(staging, production)

    assert result == []


def test_single_modified_key_detects_one_delta():
    staging = {"API_KEY": "staging-value"}
    production = {"API_KEY": "production-value"}

    result = compute_diff(staging, production)

    assert len(result) == 1
    delta = result[0]
    assert delta.key == "API_KEY"
    assert delta.staging_value == "staging-value"
    assert delta.production_value == "production-value"
    assert delta.category == "env_var"
    assert delta.severity_hint == "high"


def test_multiple_changes_include_added_removed_and_modified_keys():
    staging = {
        "API_KEY": "staging-value",
        "REMOVED_FEATURE_FLAG": True,
        "shared_version": "1.0.0",
    }
    production = {
        "API_KEY": "production-value",
        "ADDED_FEATURE_FLAG": False,
        "shared_version": "1.0.0",
    }

    result = compute_diff(staging, production)
    keys = {delta.key for delta in result}

    assert len(result) == 3
    assert "API_KEY" in keys
    assert "REMOVED_FEATURE_FLAG" in keys
    assert "ADDED_FEATURE_FLAG" in keys

    modified = next(delta for delta in result if delta.key == "API_KEY")
    assert modified.staging_value == "staging-value"
    assert modified.production_value == "production-value"

    removed = next(delta for delta in result if delta.key == "REMOVED_FEATURE_FLAG")
    assert removed.staging_value == "True"
    assert removed.production_value is None

    added = next(delta for delta in result if delta.key == "ADDED_FEATURE_FLAG")
    assert added.production_value == "False"
    assert added.staging_value is None


def test_nested_config_changes_are_detected():
    staging = {
        "services": {
            "web": {
                "replicas": 2,
                "env": {"DEBUG": False},
            }
        }
    }
    production = {
        "services": {
            "web": {
                "replicas": 3,
                "env": {"DEBUG": False},
            }
        }
    }

    result = compute_diff(staging, production)

    assert len(result) == 1
    delta = result[0]
    assert delta.key == "services.web.replicas"
    assert delta.staging_value == "2"
    assert delta.production_value == "3"
    assert delta.category == "schema"
    assert delta.severity_hint == "low"
