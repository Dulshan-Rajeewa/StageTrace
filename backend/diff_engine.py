from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Literal

from deepdiff import DeepDiff

DeltaCategory = Literal["env_var", "feature_flag", "dependency", "schema"]
SeverityHint = Literal["high", "medium", "low"]

_SENSITIVE_KEYWORDS = (
    "password",
    "secret",
    "token",
    "api_key",
    "client_secret",
    "private_key",
    "credentials",
    "auth",
)
_FEATURE_FLAG_KEYWORDS = (
    "feature",
    "flag",
    "beta",
    "rollout",
    "experiment",
)
_DEPENDENCY_KEYWORDS = (
    "version",
    "package",
    "dependency",
    "image",
    "module",
    "library",
)
_SCHEMA_KEYWORDS = (
    "schema",
    "table",
    "column",
    "field",
    "model",
    "migration",
    "index",
    "constraint",
)


@dataclass
class Delta:
    key: str
    staging_value: str | None
    production_value: str | None
    category: DeltaCategory
    severity_hint: SeverityHint


def _normalize_path(path: str) -> str:
    normalized = path.replace("root", "")
    normalized = normalized.replace("['", ".")
    normalized = normalized.replace("']", "")
    return normalized.lstrip(".")


def _get_value_for_path(snapshot: Dict[str, Any], path: str) -> Any:
    if not path:
        return snapshot

    current: Any = snapshot
    token_pattern = re.compile(r"([^.\[\]]+)|\[(\d+)\]")
    for match in token_pattern.finditer(path):
        key_token, index_token = match.groups()
        if key_token is not None:
            if not isinstance(current, dict) or key_token not in current:
                return None
            current = current[key_token]
        elif index_token is not None:
            if not isinstance(current, list):
                return None
            index = int(index_token)
            if index < 0 or index >= len(current):
                return None
            current = current[index]

    return current


def _format_value(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return json.dumps(value, sort_keys=True)
    return str(value)


def _detect_category(key: str) -> DeltaCategory:
    lower_key = key.lower()

    if any(token in lower_key for token in _SENSITIVE_KEYWORDS):
        return "env_var"
    if any(token in lower_key for token in _FEATURE_FLAG_KEYWORDS):
        return "feature_flag"
    if any(token in lower_key for token in _DEPENDENCY_KEYWORDS):
        return "dependency"
    if any(token in lower_key for token in _SCHEMA_KEYWORDS):
        return "schema"
    if key.isupper() or "_" in key:
        return "env_var"
    return "schema"


def _detect_severity_hint(key: str, category: DeltaCategory) -> SeverityHint:
    lower_key = key.lower()
    if any(token in lower_key for token in _SENSITIVE_KEYWORDS):
        return "high"
    if category == "env_var":
        return "high"
    if category in ("feature_flag", "dependency"):
        return "medium"
    return "low"


def _build_delta(
    key: str,
    staging_value: Any,
    production_value: Any,
) -> Delta:
    category = _detect_category(key)
    severity_hint = _detect_severity_hint(key, category)
    return Delta(
        key=key,
        staging_value=_format_value(staging_value),
        production_value=_format_value(production_value),
        category=category,
        severity_hint=severity_hint,
    )


def compute_diff(snapshot_a: Dict[str, Any], snapshot_b: Dict[str, Any]) -> List[Delta]:
    diff = DeepDiff(snapshot_a, snapshot_b, ignore_order=True)
    deltas: List[Delta] = []

    for path in diff.get("dictionary_item_added", set()):
        key = _normalize_path(str(path))
        production_value = _get_value_for_path(snapshot_b, key)
        deltas.append(_build_delta(key, None, production_value))

    for path in diff.get("dictionary_item_removed", set()):
        key = _normalize_path(str(path))
        staging_value = _get_value_for_path(snapshot_a, key)
        deltas.append(_build_delta(key, staging_value, None))

    for path, change in diff.get("values_changed", {}).items():
        key = _normalize_path(str(path))
        if isinstance(change, dict):
            deltas.append(_build_delta(key, change.get("old_value"), change.get("new_value")))
        else:
            deltas.append(_build_delta(key, change.t1, change.t2))

    for path, change in diff.get("type_changes", {}).items():
        key = _normalize_path(str(path))
        if isinstance(change, dict):
            deltas.append(_build_delta(key, change.get("old_value"), change.get("new_value")))
        else:
            deltas.append(_build_delta(key, change.t1, change.t2))

    for path in diff.get("iterable_item_added", set()):
        key = _normalize_path(str(path))
        production_value = _get_value_for_path(snapshot_b, key)
        deltas.append(_build_delta(key, None, production_value))

    for path in diff.get("iterable_item_removed", set()):
        key = _normalize_path(str(path))
        staging_value = _get_value_for_path(snapshot_a, key)
        deltas.append(_build_delta(key, staging_value, None))

    return deltas
