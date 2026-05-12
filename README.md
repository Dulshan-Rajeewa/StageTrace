# StageTrace - Complete Setup & Run Guide

StageTrace is a DevOps tool for monitoring configuration drift between staging and production environments. This guide walks you through the complete setup.

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.13+ (for backend)
- **Supabase** account with a project created
- **Mistral API** key (for AI-powered root cause analysis)

## Architecture Overview

```
Frontend (React)
    ↓ (http://localhost:5173)
    ↓
Backend (FastAPI)
    ↓ (http://localhost:8000)
    ↓
Supabase PostgreSQL + Storage
```

- **Frontend**: React + TypeScript + Vite + Tailwind CSS (dark mode)
- **Backend**: FastAPI + Python 3.13 + Supabase client
- **Database**: PostgreSQL (snapshots & incidents tables)
- **Storage**: Supabase Storage for config JSON files

## Step 1: Set Up Supabase

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and log in
2. Create a new project
3. Note down your **Project URL** and **Service Role Key** (keep these secret!)

### 1.2 Run Database Migrations
Execute these SQL migrations in the Supabase SQL Editor:

**Migration 1: Create Tables**
```sql
-- backend/migrations/001_create_tables.sql
```

**Migration 2: Add Incident Columns**
```sql
-- backend/migrations/002_add_incident_payload_columns.sql
```

### 1.3 Create Storage Bucket
1. Go to Storage in your Supabase project
2. Create a new bucket named `snapshots`
3. Set it to private

## Step 2: Backend Setup

### 2.1 Install Dependencies

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies (with uv)
uv pip install -e .
# Or with pip:
pip install -e .
```

### 2.2 Configure Environment Variables

Create `backend/.env` file:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_BUCKET=snapshots

# Mistral AI
MISTRAL_API_KEY=your-mistral-api-key

# Frontend CORS (allow localhost:5173)
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:3000

# Environment
ENVIRONMENT=development
```

**⚠️ Important:** Add `.env` to `.gitignore` - never commit secrets!

### 2.3 Run Backend Server

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Health check:**
```bash
curl http://localhost:8000/health
# Should return: {"status": "ok"}
```

## Step 3: Frontend Setup

### 3.1 Install Dependencies

```bash
cd frontend
npm install
```

### 3.2 Configure Environment Variables

Create `frontend/.env.local`:

```
VITE_API_BASE_URL=http://localhost:8000
```

### 3.3 Run Development Server

```bash
cd frontend
npm run dev
```

Expected output:
```
  ➜  Local:   http://localhost:5173
  ➜  Press q + enter to quit
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Dark mode by default!** Toggle light mode in Settings (top-right corner).

## Step 4: Run End-to-End Test

The test script creates two snapshots with intentional differences and triggers incident analysis:

```bash
cd backend
python test_e2e.py
```

Expected output:
```
[2026-05-11 14:23:45] INFO: StageTrace End-to-End Test
[2026-05-11 14:23:45] OK: ✓ Backend is healthy
[2026-05-11 14:23:46] OK: ✓ Created staging snapshot: abc-123
[2026-05-11 14:23:47] OK: ✓ Created production snapshot: xyz-789
[2026-05-11 14:23:48] OK: ✓ Triggered incident: incident-uuid
[2026-05-11 14:23:48] INFO: Severity: high
[2026-05-11 14:23:48] INFO: Diffs found: 3
[2026-05-11 14:23:48] OK: ✓ End-to-end test completed successfully!
```

Then refresh your dashboard in the browser (http://localhost:5173) to see the incident!

## Full Stack Overview - What's Running

| Component | URL | Port | Process |
|-----------|-----|------|---------|
| Frontend | http://localhost:5173 | 5173 | `npm run dev` |
| Backend | http://localhost:8000 | 8000 | `uvicorn app.main:app --reload` |
| Database | Supabase Cloud | N/A | Managed |

## Project Structure

```
StageTrace/
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, IncidentReport, DriftHistory
│   │   ├── services/      # API client (api.ts)
│   │   ├── components/    # Layout, theme toggle
│   │   ├── types/         # TypeScript models
│   │   └── App.tsx        # Routes + Toaster
│   ├── package.json       # Dependencies (react, vite, tailwind, sonner)
│   └── .env.local         # Local config
│
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app + CORS setup
│   │   ├── config.py      # Environment variable loading
│   │   ├── routers/       # API endpoints (incidents, snapshots, dashboard)
│   │   └── database.py    # Supabase client
│   ├── migrations/        # Database schema files
│   ├── test_e2e.py        # Automation script
│   ├── pyproject.toml     # Dependencies
│   └── .env               # Secrets (never commit!)
│
└── README.md              # Project overview
```

## API Endpoints

### Health & Status
- `GET /health` - Backend health check

### Snapshots
- `POST /snapshots/` - Create snapshot (upload config)
- `GET /snapshots/?limit=50&offset=0` - List snapshots (paginated)

### Incidents
- `POST /incidents/trigger` - Trigger incident analysis
- `GET /incidents/?limit=50&offset=0` - List incidents (paginated)
- `GET /incidents/{id}/report` - Get incident details
- `GET /incidents/history?limit=50&offset=0&time_range=all&search=` - Get drift history with filters

### Dashboard
- `GET /dashboard/summary` - Get dashboard metrics

## Features

### Frontend
- ✅ Dark mode by default (toggle in Settings)
- ✅ Real-time incident dashboard
- ✅ Detailed incident drift viewer
- ✅ Searchable drift history with time range filters
- ✅ Error handling with toast notifications
- ✅ Pagination support
- ✅ Loading states

### Backend
- ✅ FastAPI with CORS for localhost
- ✅ Supabase integration (PostgreSQL + Storage)
- ✅ Configuration diffing engine
- ✅ AI-powered root cause analysis (Mistral)
- ✅ Incident persistence with metadata
- ✅ Pagination and filtering on all list endpoints

### Database
- ✅ Snapshots table with S3-like storage
- ✅ Incidents table with forensic reports
- ✅ Structured delta storage (JSON)
- ✅ Audit trail of all diffs

## Troubleshooting

### "Failed to load dashboard data"
**Problem:** Frontend can't reach backend  
**Solution:** 
1. Check backend is running: `curl http://localhost:8000/health`
2. Check CORS: Backend logs should show `GET /dashboard/summary`
3. Verify `VITE_API_BASE_URL` in `.env.local`

### "Backend connection refused"
**Problem:** Backend isn't running  
**Solution:** Run `uvicorn app.main:app --reload --port 8000` in backend directory

### "Supabase connection failed"
**Problem:** Invalid credentials or network issue  
**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
2. Check Supabase project is running
3. Verify migrations were applied

### "No incidents showing"
**Problem:** Test script hasn't been run yet  
**Solution:** Run `python test_e2e.py` to create sample data

## Development Workflow

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   source .venv/bin/activate  # or .venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Terminal 3 - Test (when needed):**
   ```bash
   cd backend
   python test_e2e.py
   ```

4. **Browser:**
   Open http://localhost:5173

## Production Deployment

When ready to deploy:

1. **Frontend:** Build with `npm run build`, deploy `dist/` folder
2. **Backend:** Use production ASGI server (gunicorn, uvicorn with workers)
3. **Database:** Upgrade Supabase plan for production workloads
4. **Secrets:** Use environment variables in production, never .env files

## Next Steps

- [ ] Explore the dashboard at http://localhost:5173
- [ ] Run the test script: `python test_e2e.py`
- [ ] View incident details and drift analysis
- [ ] Toggle dark/light mode in Settings
- [ ] Search and filter drift history
- [ ] Review forensic reports with AI insights

## Support

For issues or questions:
1. Check logs: Frontend console (F12) and backend terminal
2. Verify `.env` files have all required variables
3. Run health check: `curl http://localhost:8000/health`
4. Re-run test: `python test_e2e.py`

---

## Implementation Notes

## How to Run Everything

### Quick Start (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd backend
.venv\Scripts\activate  # Windows
# or: source .venv/bin/activate  # macOS/Linux
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # if you haven't yet (to get sonner)
npm run dev
```

**Terminal 3 - Test (optional, anytime after backend/frontend running):**
```bash
cd backend
python test_e2e.py
```

Then open http://localhost:5173 in your browser.

---

## API Changes Summary

### Before:
```
GET /incidents/ → BackendIncidentListRow[]
GET /incidents/history → BackendHistoryRow[]
```

### After:
```
GET /incidents/?limit=50&offset=0 → {
  data: BackendIncidentListRow[],
  pagination: { total, limit, offset, has_more }
}

GET /incidents/history?limit=50&offset=0&time_range=all&search= → {
  data: BackendHistoryRow[],
  pagination: { total, limit, offset, has_more },
  filters: { time_range, environment_pair, search }
}
```

---

## Files Modified

### Backend
- `app/routers/incidents.py` - Added pagination & filters (imports: timedelta, Query)
- `pyproject.toml` - No changes needed (all deps already present)

### Frontend
- `package.json` - Added sonner dependency
- `src/services/api.ts` - Updated response types & API calls
- `src/pages/Dashboard.tsx` - Added toast + retry UI
- `src/pages/IncidentReport.tsx` - Added toast notifications
- `src/pages/DriftHistory.tsx` - Added toast + retry UI
- `src/App.tsx` - Added Toaster component

### New Files
- `backend/test_e2e.py` - End-to-end test automation
- `SETUP.md` - Complete setup & run guide

---

## Testing the Features

### 1. Test Pagination
```bash
curl "http://localhost:8000/incidents/?limit=10&offset=0"
# Response includes pagination metadata
```

### 2. Test Filters
```bash
curl "http://localhost:8000/incidents/history?time_range=last_30_days&search=database"
# Only shows diffs from last 30 days matching "database"
```

### 3. Test Error Handling
- Stop backend server while app is running
- Refresh dashboard page
- See toast error with retry button
- Click retry (won't work until backend is back)

### 4. Test Full Flow
```bash
python backend/test_e2e.py
# Then refresh http://localhost:5173
# Incident should appear in dashboard!
```

---

## What's Next?

1. **Run the backend:** `uvicorn app.main:app --reload --port 8000`
2. **Run the frontend:** `npm run dev`
3. **Run the test:** `python test_e2e.py`
4. **Open browser:** http://localhost:5173
5. **See the incident:** Should appear on dashboard!
6. **Toggle dark/light mode:** Settings (top-right)
7. **View details:** Click incident to see drift details
8. **Test filters:** Use time range and search in Drift History

---

## Key Improvements

✅ **Better UX**: Users see errors instead of silent failures  
✅ **Scalable**: Pagination prevents loading massive datasets  
✅ **Filterable**: Time range & search reduce noise  
✅ **Recoverable**: Retry buttons let users fix transient errors  
✅ **Professional**: Toast notifications match modern web standards  
✅ **Production-Ready**: All error paths handled gracefully

---
