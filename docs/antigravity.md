# Antigravity IDE Developer Handoff Guide

This guide details how to inspect, run, and develop **StudyQuest AI** inside the Antigravity IDE workspace.

---

## 📂 Project Structure Map

- [backend/agents/](file:///home/unish/StudyQuest-AI/backend/agents/): Contains Google ADK agent specifications.
  - [coordinator.py](file:///home/unish/StudyQuest-AI/backend/agents/coordinator.py): Central StudyQuest Coordinator.
  - [planner.py](file:///home/unish/StudyQuest-AI/backend/agents/planner.py), [execution.py](file:///home/unish/StudyQuest-AI/backend/agents/execution.py), [revision.py](file:///home/unish/StudyQuest-AI/backend/agents/revision.py), [motivation.py](file:///home/unish/StudyQuest-AI/backend/agents/motivation.py), [coach.py](file:///home/unish/StudyQuest-AI/backend/agents/coach.py): Specialist agents with fallback structures.
  - [tools.py](file:///home/unish/StudyQuest-AI/backend/agents/tools.py): Declares the functional tools.
  - [schemas.py](file:///home/unish/StudyQuest-AI/backend/agents/schemas.py): Holds standard schema validations.
- [backend/mcp/](file:///home/unish/StudyQuest-AI/backend/mcp/): Contains Model Context Protocol components.
  - [mcp_server.py](file:///home/unish/StudyQuest-AI/backend/mcp/mcp_server.py): FastMCP python server. Exposes the 7 required memory tools.
- [backend/utils/](file:///home/unish/StudyQuest-AI/backend/utils/):
  - [mcp_client.py](file:///home/unish/StudyQuest-AI/backend/utils/mcp_client.py): Client-side adapter with failover stubs.
- [backend/services/](file:///home/unish/StudyQuest-AI/backend/services/):
  - [db.py](file:///home/unish/StudyQuest-AI/backend/services/db.py): SQLite schemas and key-value memory methods.
  - [study_service.py](file:///home/unish/StudyQuest-AI/backend/services/study_service.py): Topic parser and coaching advisory composition.
  - [spaced_rep_service.py](file:///home/unish/StudyQuest-AI/backend/services/spaced_rep_service.py): Dynamic intervals and load balance calculations.
- [frontend/src/app/](file:///home/unish/StudyQuest-AI/frontend/src/app/): Next.js App Router client files.
  - [page.tsx](file:///home/unish/StudyQuest-AI/frontend/src/app/page.tsx): Main command dashboard component.
- [backend/tests/](file:///home/unish/StudyQuest-AI/backend/tests/):
  - [unit/test_coordinator.py](file:///home/unish/StudyQuest-AI/backend/tests/unit/test_coordinator.py): Coordinator tests.
- [evals/](file:///home/unish/StudyQuest-AI/evals/): Evaluator configuration profiles.

---

## ⚡ Execution Commands

To execute or inspect components in the terminal:

### 1. Run Unit Tests
```bash
cd backend
uv run pytest tests/unit/test_coordinator.py
```

### 2. Start Services Concurrently
Use the startup script in the workspace root to launch FastAPI, Next.js, and MCP:
```bash
./run_all.sh
```

### 3. Run API Smoke Checks
```bash
cd backend
uv run python scripts/smoke_test.py
```

---

## 🔧 Environment & Credentials

The `.env` file should be located at `backend/.env`.
If `GEMINI_API_KEY` is missing or contains placeholder values:
- The backend activates **Fallback Mode** automatically.
- All specialist agents fall back to local database stubs, writing trace entries to the SQL database.
- The UI renders the **Fallback active** badge.
- This ensures 100% reliable local demo functionality.

If `GEMINI_API_KEY` is present:
- Google ADK runs using `gemini-flash-latest` model.
- Agent tool definitions are executed dynamically.

---

## 🧭 Next Phase: Phase 6 (Deployment & Production Handoff)
- Build final production bundles: `npm run build` inside `frontend/`.
- Deploy backend service to Cloud Run or GKE using Google ADK tools.
- Configure Google Cloud Secret Manager for credentials.
