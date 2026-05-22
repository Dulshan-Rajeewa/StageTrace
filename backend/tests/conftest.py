"""
Pytest configuration and shared fixtures for StageTrace backend tests.

Mocks database, storage, and AI API to avoid external dependencies.
"""

import json
import os
from pathlib import Path
from unittest.mock import MagicMock, patch
from typing import Any

# Load test environment before importing app (which loads config)
env_test_path = Path(__file__).parent.parent / ".env.test"
if env_test_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_test_path)

# Ensure dummy env vars exist
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")

import pytest
from fastapi.testclient import TestClient


# ============================================================================
# Database Mock
# ============================================================================

class MockSupabaseStorage:
    """Mock Supabase Storage (file upload/download)."""
    
    def __init__(self):
        self.files: dict[str, bytes] = {}
    
    def from_(self, bucket_name: str):
        """Return self to chain calls."""
        return self
    
    def upload(self, file: bytes, path: str, file_options: dict | None = None):
        """Store file in mock storage."""
        self.files[path] = file
        return MagicMock()
    
    def download(self, path: str) -> bytes:
        """Retrieve file from mock storage."""
        if path not in self.files:
            raise FileNotFoundError(f"File not found: {path}")
        return self.files[path]
    
    def get_public_url(self, path: str) -> str:
        """Return mock public URL."""
        return f"https://mock-bucket.supabase.co/object/public/snapshots/{path}"


class MockSupabaseTable:
    """Mock Supabase table queries."""
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.data: dict[str, dict] = {}
        self._filters: list[tuple[str, str, Any]] = []
        self._order_by: tuple[str, bool] | None = None
        self._range: tuple[int, int] | None = None
        self._single = False
        self._count = False
        self._insert_records: list[dict] | None = None
    
    def select(self, *columns, count: str | None = None):
        """SELECT columns, optionally with count."""
        if count == "exact":
            self._count = True
        return self
    
    def eq(self, col: str, value: Any):
        """WHERE col = value."""
        self._filters.append(("eq", col, value))
        return self
    
    def gte(self, col: str, value: Any):
        """WHERE col >= value."""
        self._filters.append(("gte", col, value))
        return self
    
    def order(self, col: str, desc: bool = False):
        """ORDER BY col."""
        self._order_by = (col, desc)
        return self
    
    def range(self, start: int, end: int):
        """LIMIT/OFFSET pagination."""
        self._range = (start, end)
        return self
    
    def single(self):
        """Expect exactly one row."""
        self._single = True
        return self
    
    def insert(self, records: dict | list[dict]):
        """INSERT records."""
        if isinstance(records, dict):
            records = [records]
        for record in records:
            record_id = record.get("id")
            if record_id:
                self.data[record_id] = record
        self._insert_records = records
        return self  # Return self for chaining
    
    def execute(self) -> "MockExecuteResult":
        """Execute the query."""
        # If this was an insert, return the inserted records
        if self._insert_records is not None:
            records = self._insert_records
            self._insert_records = None
            return MockExecuteResult(success=True, data=records[0] if len(records) == 1 else records)
        
        # Standard SELECT query
        filtered = list(self.data.values())
        for op, col, value in self._filters:
            if op == "eq":
                filtered = [row for row in filtered if row.get(col) == value]
            elif op == "gte":
                filtered = [row for row in filtered if row.get(col) and row.get(col) >= value]
        
        if self._order_by:
            col, desc = self._order_by
            filtered.sort(key=lambda row: row.get(col, ""), reverse=desc)
        
        if self._range:
            start, end = self._range
            filtered = filtered[start : end + 1]
        
        if self._single:
            data = filtered[0] if filtered else None
            return MockExecuteResult(success=bool(data), data=data, count=len(self.data))
        
        if self._count:
            return MockExecuteResult(success=True, data=[], count=len(self.data))
        
        return MockExecuteResult(success=True, data=filtered, count=len(self.data))


class MockExecuteResult:
    """Result of a Supabase query execution."""
    
    def __init__(self, success: bool = True, data: Any = None, count: int = 0):
        self.success = success
        self.data = data
        self.count = count


class MockSupabaseClient:
    """Mock Supabase client (database + storage)."""
    
    def __init__(self):
        self.storage = MockSupabaseStorage()
        self._table_data: dict[str, dict[str, dict]] = {}  # {table_name: {id: row}}
    
    def table(self, name: str) -> MockSupabaseTable:
        """Get a fresh mock table with current data."""
        if name not in self._table_data:
            self._table_data[name] = {}
        
        # Always return a fresh table instance (prevents state pollution)
        table = MockSupabaseTable(name)
        table.data = self._table_data[name]
        return table
    
    def reset(self):
        """Clear all data (useful between tests)."""
        self._table_data = {}
        self.storage.files = {}


@pytest.fixture
def mock_supabase():
    """Fixture: Mock Supabase client."""
    return MockSupabaseClient()


# @pytest.fixture(autouse=True)
# def reset_mocks(mock_supabase):
#     """Reset mock state before each test (autouse)."""
#     mock_supabase.reset()
#     yield


@pytest.fixture
def mock_gemini():
    """Fixture: Mock Gemini API response."""
    mock_client = MagicMock()
    
    def mock_generate_content(**kwargs):
        response_data = {
            "top_cause": "email_rate_limit_enabled",
            "ranked_causes": ["email_rate_limit_enabled", "database.pool_size"],
            "summary": "The silent feature flag divergence causes rate limiting in production but not staging.",
            "confidence": "high",
            "suggested_fix": "Sync email_rate_limit_enabled across environments.",
        }
        mock_response = MagicMock()
        mock_response.text = json.dumps(response_data)
        return mock_response
    
    mock_client.models.generate_content = mock_generate_content
    return mock_client


# @pytest.fixture(autouse=True)
# def _reset_mocks_between_tests(mock_supabase):
#     """Reset mock state before every test, regardless of fixture usage."""
#     mock_supabase.reset()
#     yield


@pytest.fixture
def client(mock_supabase, mock_gemini):
    mock_supabase._table_data.clear()
    mock_supabase.storage.files.clear()

    from app.cache import cache
    cache.clear()

    from app.routers import snapshots, incidents
    snapshots.supabase = mock_supabase
    incidents.supabase = mock_supabase

    import ranker
    ranker.client = mock_gemini

    from app.main import app
    return TestClient(app)


@pytest.fixture
def sample_snapshot_payload():
    """Fixture: Sample snapshot creation payload."""
    return {
        "environment": "staging",
        "version_tag": "v1.0.0",
        "config": {
            "database": {"host": "staging-db", "port": 5432},
            "cache": {"ttl": 3600, "backend": "redis"},
            "logging": {"level": "DEBUG"},
        }
    }


@pytest.fixture
def sample_deltas():
    """Fixture: Sample diffs for testing."""
    from diff_engine import Delta
    return [
        Delta(
            key="email_rate_limit_enabled",
            staging_value="False",
            production_value="True",
            category="feature_flag",
            severity_hint="medium",
        ),
        Delta(
            key="database.pool_size",
            staging_value="10",
            production_value="50",
            category="schema",
            severity_hint="low",
        ),
    ]