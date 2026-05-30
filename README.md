# StageTrace

StageTrace is a modern DevOps tool designed to monitor, track, and analyze configuration drift between staging and production environments. It automatically captures configuration snapshots, calculates environmental differences (drift), ranks potential root causes using AI, and presents reports in an intuitive, responsive dashboard.

---

## Introduction

In modern microservice and cloud architectures, subtle differences in environment variables, feature flags, database settings, or package versions between staging and production can lead to unexpected outages. StageTrace solves this by continuously diffing configuration payloads and providing automated, AI-powered root-cause analysis when incidents are triggered.

### System Architecture

```
                 +-----------------------------------+
                 |         Frontend (React)          |
                 |      http://localhost:5173        |
                 +-----------------+-----------------+
                                   | (HTTP / REST)
                                   v
                 +-----------------+-----------------+
                 |         Backend (FastAPI)         |
                 |      http://localhost:8000        |
                 +--------+-----------------+--------+
                          |                 |
         (Metadata & Logs)|                 | (Config JSONs)
                          v                 v
                 +--------+--------+      +-+----------------+
                 |    Supabase     |      | Supabase Storage |
                 |   PostgreSQL    |      | (snapshots bucket)
                 +-----------------+      +------------------+
```

### Key Features

* **Interactive Frontend (React + TypeScript + Vite + Tailwind CSS)**:
  * Sleek UI with **Dark Mode by default** (toggleable in Settings).
  * In-depth Incident Reports detailing specific configuration changes.
  * Searchable and filterable Drift History with pagination and time range controls.
  * Modern, non-blocking toast notifications for system health and API states.
* **Robust Backend (FastAPI + Python 3.13)**:
  * High-performance configuration diffing engine.
  * AI-powered Root Cause Analysis utilizing **Gemini AI** to rank the likelihood of drift causing a particular incident.
  * Supabase Client integration for PostgreSQL queries and storage interactions.
  * Paginated, searchable REST API endpoints.
* **Secure Database & Storage**: Powered by Supabase.
  * Audited snapshot storage using Supabase Storage.
  * Relational schema to track snapshot metadata and generated incidents.

### Project Structure

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
│   └── .env.example       # Frontend environment template
│
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app + CORS setup
│   │   ├── config.py      # Environment variable loading
│   │   ├── routers/       # API endpoints (incidents, snapshots, dashboard)
│   │   └── database.py    # Supabase client
│   ├── migrations/        # Database schema files
│   ├── tests/             # Automated test suites
│   ├── agent.py           # Snapshot agent script
│   ├── pyproject.toml     # Dependencies
│   └── .env.example       # Backend environment template
│
├── run-backend.bat        # Batch script to start backend
├── run-frontend.bat       # Batch script to start frontend
└── run-test.bat           # Batch script to run E2E tests
```

### API Endpoints Reference

* **Health & Status**
  * `GET /health` - Backend health check
* **Snapshots**
  * `POST /snapshots/` - Create a snapshot (upload configuration)
  * `GET /snapshots/?limit=50&offset=0` - List snapshots (paginated)
* **Incidents**
  * `POST /incidents/trigger` - Trigger incident analysis between staging and production snapshots
  * `GET /incidents/?limit=50&offset=0` - List incidents (paginated)
  * `GET /incidents/{id}/report` - Get incident forensic report details
  * `GET /incidents/history?limit=50&offset=0&time_range=all&search=` - Get drift history with filters
* **Dashboard**
  * `GET /dashboard/summary` - Get dashboard summary metrics

---

## Steps for Testing

StageTrace supports automated test suites as well as end-to-end simulation workflows.

### 1. Automated Tests

Backend tests are powered by `pytest` and cover snapshot uploads, drift calculation, API endpoints, and database interactions.

* **Run all tests**:
  Navigate to the `backend/` directory and run:
  ```bash
  .venv\Scripts\pytest
  ```
  *(Or `uv run pytest` if using uv)*

* **Run specific test files**:
  ```bash
  # Diff engine tests
  .venv\Scripts\pytest tests/test_diff_engine.py

  # E2E integration test suite
  .venv\Scripts\pytest tests/endpoints/test_e2e.py
  ```

* **Quick Full Test Command**:
  You can run the end-to-end integration test suite using the batch script in the repository root:
  ```bash
  run-test.bat
  ```

---

### 2. End-to-End Agent Simulation

To manually test the entire flow and populate the dashboard with realistic drift data, use the **Snapshot Agent**:

1. Ensure both the **Backend** and **Frontend** servers are running.
2. From the `backend/` directory, execute the agent to upload environment configurations:
   * **Staging Configuration**:
     ```bash
     .venv\Scripts\python agent.py --env staging --env-file fixtures/staging.env --config-file fixtures/staging.config.yaml --skip-trigger
     ```
   * **Production Configuration**:
     ```bash
     .venv\Scripts\python agent.py --env production --env-file fixtures/production.env --config-file fixtures/production.config.yaml
     ```
     > [!TIP]
     > When the second configuration is uploaded, the Agent will automatically detect the counterpart environment, trigger an incident analysis, diff the files, and run Gemini AI to diagnose the drift.

3. **Check the Dashboard**:
   * Refresh [http://localhost:5173](http://localhost:5173). You will see a new incident appearing under the dashboard feed, complete with drift details and AI analysis.

---

## Steps for Setup (Complete Guide)

This guide will walk you through the complete setup of StageTrace from scratch.

### Prerequisites

Ensure you have the following installed on your system:
* **Node.js** (v18 or higher)
* **Python** (v3.13) and **UV package manager**
* A **Supabase** account
* A **Gemini API** key (for AI-powered root cause analysis). You can get one by visiting [Google AI Studio](https://aistudio.google.com/app/apikey).

---

### Step 1: Database & Storage Setup (Supabase)

1. **Create a Supabase Project**:
   * Sign in to [Supabase](https://supabase.com) and create a new project.
   * Note down your **Project URL** and the **service_role** API keys.

2. **Run Schema Migrations**:
   * Navigate to the SQL Editor in the Supabase console.
   * Run the SQL scripts in the following order:
     1. `backend/migrations/001_create_tables.sql` (Creates snapshots and incidents tables)
     2. `backend/migrations/002_add_incident_payload_columns.sql` (Adds forensic report and structured delta storage)

3. **Configure Storage Bucket**:
   * Under **Storage** in the Supabase Sidebar, create a new bucket named `snapshots`.
   * Configure this bucket to be **Public**.

---

### Step 2: Backend Configuration & Start

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Set Environment Variables**:
   * Copy the template file `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   * Populate the `.env` file with your credentials:
     ```ini
     SUPABASE_URL="https://your-project.supabase.co"
     SUPABASE_KEY="your-supabase-service-role-key"
     GEMINI_API_KEY="your-gemini-api-key"
     SUPABASE_BUCKET="snapshots"
     STAGETRACE_API_URL="http://localhost:8000"
     FRONTEND_ORIGINS="http://localhost:5173"
     ```
     > [!IMPORTANT]
     > Never commit your `.env` file to version control. It is already added to `.gitignore`.

3. **Install Dependencies**:
   * If you use [uv](https://github.com/astral-sh/uv), sync the environment:
     ```bash
     uv sync --python 3.13
     ```
   * Alternatively, create a virtual environment and install dependencies manually:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     pip install -r pyproject.toml
     ```

4. **Start the Server**:
   * Run via the batch script at the root:
     ```bash
     run-backend.bat
     ```
   * Or run directly:
     ```bash
     uv run uvicorn app.main:app --reload --port 8000
     ```
     *(Or `.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000`)*

5. **Verify Backend Status**:
   * Send a health check request:
     ```bash
     curl http://localhost:8000/health
     # Expected response: {"status":"ok"}
     ```

---

### Step 3: Frontend Configuration & Start

1. **Navigate to the Frontend Directory**:
   ```bash
   cd frontend
   ```

2. **Set Environment Variables**:
   * Copy the template file `.env.example` to `.env`:
     ```bash
     copy .env.example .env
     ```
   * Make sure it contains:
     ```ini
     VITE_API_BASE_URL=http://localhost:8000
     ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   * Run via the batch script at the root:
     ```bash
     run-frontend.bat
     ```
   * Or run directly:
     ```bash
     npm run dev
     ```

5. **Access the App**:
   * Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Service Ports Summary

| Component | URL | Port | Launch Command |
| :--- | :--- | :--- | :--- |
| **Frontend** | `http://localhost:5173` | `5173` | `npm run dev` |
| **Backend** | `http://localhost:8000` | `8000` | `uvicorn app.main:app --reload` |
| **Database & Storage** | Supabase Cloud | *Managed* | N/A |

---

## Troubleshooting

### "Failed to load dashboard data" on the frontend
* **Problem**: Frontend cannot communicate with the API.
* **Solutions**:
  1. Click the Retry button on the top of the dashboard.
  2. Verify backend is running on port `8000` (`curl http://localhost:8000/health`).
  3. Check that `VITE_API_BASE_URL` in `frontend/.env` is correctly pointing to port `8000`.
  4. Confirm CORS configuration in `backend/.env` allows `http://localhost:5173`.

### Backend connection refused
* **Problem**: Backend server is not running or accessible.
* **Solutions**:
  1. Verify whether the virtual environment is activated.
  2. Ensure you run `uvicorn app.main:app --reload --port 8000` inside the `backend` directory inside the active Python virtual environment.

### "Supabase connection failed" / Database Errors
* **Problem**: Backend fails to fetch data or write snapshots.
* **Solutions**:
  1. Verify your `SUPABASE_URL` and `SUPABASE_KEY` are correct in the `backend/.env` file.
  2. **Note:** `SUPABASE_KEY` should be the **Service Role Key**, not the Anon Key (this reduces the complexity of setting up policies).
  3. Ensure your database migrations were successfully run in the Supabase SQL editor.
  4. Check that the `snapshots` storage bucket exists and is set to **Public**.

### Environment variable setup
* **Solutions**: Ensure the environment variables are saved in a `.env` file of the respective directories (`frontend/.env` and `backend/.env`).

### No Incidents Displayed
* **Problem**: The dashboard is empty.
* **Solutions**:
  1. Run the **End-to-End Agent Simulation** commands above to populate the database with test snapshots and generate an incident.
  2. Run the automated tests (`run-test.bat`) to verify endpoints are operating properly.
