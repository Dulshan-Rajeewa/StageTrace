# StageTrace Diff Engine

This backend module provides a standalone diff engine for StageTrace configuration drift analysis.

## What it does

`diff_engine.py` compares a staging config snapshot against a production config snapshot and returns a list of `Delta` objects representing added, removed, and modified keys.

The diff engine uses `DeepDiff` to detect changes and automatically classifies each diff by:

- `category`: env_var, feature_flag, dependency, schema
- `severity_hint`: high, medium, low

## Installation

Install the required dependency:

```bash
pip install deepdiff
```

## Usage

```python
from backend.diff_engine import compute_diff

staging = {
    "API_KEY": "staging-secret",
    "FEATURE_FLAG_NEW_UI": False,
    "database": {
        "host": "staging.db.example.com",
        "port": 5432,
    },
}

production = {
    "API_KEY": "production-secret",
    "FEATURE_FLAG_NEW_UI": True,
    "database": {
        "host": "production.db.example.com",
        "port": 5432,
    },
}

deltas = compute_diff(staging, production)
for delta in deltas:
    print(delta)
```

## Delta fields

- `key`: config key path, including nested keys (for example `database.host`)
- `staging_value`: the value from the staging snapshot or `None` if absent
- `production_value`: the value from the production snapshot or `None` if absent
- `category`: one of `env_var`, `feature_flag`, `dependency`, `schema`
- `severity_hint`: one of `high`, `medium`, `low`

## Running tests

From the repository root:

```bash
pytest backend/tests/test_diff_engine.py
```
