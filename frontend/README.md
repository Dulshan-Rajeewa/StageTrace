# StageTrace Frontend

React + TypeScript + Vite UI for StageTrace.

## Environment

Copy `.env.example` to `.env` and set:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

## Run frontend

From `frontend`:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Backend dependency

This app expects the backend API to be running and reachable at `VITE_API_BASE_URL`.

Main data flows:

- Dashboard: `GET /dashboard/summary`
- Incident page: `GET /incidents/` then `GET /incidents/{id}/report`
- Drift History: `GET /incidents/history`

## Build

```bash
npm run build
```
