# StageTrace Backend

FastAPI backend for StageTrace. It stores snapshots in Supabase Storage, computes drift, ranks likely root cause, and serves dashboard/incident/history APIs used by the frontend.

## Environment variables

Configure these in `backend/.env`:

- `SUPABASE_URL`
- `SUPABASE_KEY` (service role key)
- `MISTRAL_API_KEY`
- `SUPABASE_BUCKET` (default `snapshots`)
- `FRONTEND_ORIGINS` (comma-separated, for example `http://localhost:5173`)
- `STAGETRACE_API_URL` (used by `agent.py`)

## Database setup

Run both SQL migrations in Supabase SQL editor:

1. `backend/migrations/001_create_tables.sql`
2. `backend/migrations/002_add_incident_payload_columns.sql`

Create a storage bucket named `snapshots` (or match `SUPABASE_BUCKET`).

## Run backend

From `backend`:

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## API overview

- `GET /health`
- `POST /snapshots/`
- `GET /snapshots/`
- `POST /incidents/trigger`
- `GET /incidents/`
- `GET /incidents/history`
- `GET /incidents/{incident_id}/report`
- `GET /dashboard/summary`

## Generate snapshots and trigger incident

From `backend`:

```bash
uv run python agent.py --env staging --env-file fixtures/staging.env --config-file fixtures/staging.config.yaml --version-tag v1
uv run python agent.py --env production --env-file fixtures/production.env --config-file fixtures/production.config.yaml --version-tag v1
```

Then call `POST /incidents/trigger` with the two snapshot ids.

## Tests

From repository root:

```bash
pytest backend/tests/test_diff_engine.py
```
