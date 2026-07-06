# StudyQuest AI — Kaggle AI Agents Capstone Submission Manifest

StudyQuest AI is an active, autonomous multi-agent study coach built on the Google Agent Development Kit (ADK) and Model Context Protocol (MCP) to help students actually complete their study goals.

---

## 🏆 Project Summary
Traditional study trackers are passive. When a student falls behind or struggles with comprehension, traditional apps do nothing. The work stacks up and burnout sets in.

StudyQuest AI introduces an active, adaptive multi-agent coaching loop:
- **Planner Agent**: Estimates work volumes, extracts syllabus topics, and writes roadmaps.
- **Execution Agent**: Watches tasks and validates completions.
- **Revision Agent**: Schedules spaced repetition intervals based on student confidence scores.
- **Motivation Agent**: Runs streaks, levels, and unlocks badges.
- **Coach Agent**: Evaluates overall study metrics to compose context-aware advising notes.

---

## 🎥 Video Demo Script Outline

### Hook (0:00 - 0:30)
- Present the core problem of passive study schedulers.
- Introduce StudyQuest AI as an active multi-agent coach that replans and adapts workload dynamically.

### Core Demo (0:30 - 2:00)
- Reset the Biology study quest. Show starting dashboard metrics.
- Complete "Cell Division" with moderate confidence (3/5).
- Highlight the **Agent Activity Log** illustrating how the 5 agents run sequentially.
- Point out the updated dashboard metrics: Level up to Level 2, daily streak set to 5, revision scheduled, and coach advice updated.

### Technical Walkthrough & Call to Action (2:00 - 3:00)
- Explain the dynamic stubs fallback mode when Gemini API keys are not present.
- Describe the Stdio-based FastMCP server storing student memory parameters in SQLite.

---

## 📐 Architecture & Technology Stack

- **Frontend**: Next.js App Router (TypeScript, Vanilla CSS modules)
- **Backend**: Python, FastAPI
- **Agent Framework**: Google Gemini + Google Agent Development Kit (ADK)
- **Tool Protocol**: Model Context Protocol (MCP) Stdio server
- **Database**: SQLite (`studyquest.db`)

### request flow Path
`Frontend -> FastAPI -> Coordinator Agent -> MCP Client -> MCP Server -> SQLite Memory/Revisions`

---

## 🚀 How to Run Locally

Concurrently start all servers using the root script launcher:
```bash
chmod +x run_all.sh
./run_all.sh
```
- Open `http://localhost:3000` to view the frontend dashboard.
- API endpoints are hosted at `http://localhost:8000`.

---

## 🛡️ Production Safety & Security
- **Strict Size Limits**: Upload files limited to **2MB** in memory.
- **Filename Sanitation**: Regex filters sanitize filenames to block path traversal.
- **Immediate File Deletion**: Uploaded syllabus documents are deleted immediately after text extraction. Server path details are never leaked.
- **CORS Restricting**: CORS origins limited to configured ports.
- **SQL Parametrization**: Parametrized SQL commands block SQL injection vectors.

---

## 🔮 Future Scope & Limitations
- **Multi-user Sync**: Upgrading SQLite to a relational PostgreSQL database to support multiple user profiles concurrently.
- **Extended File Types**: Supporting PowerPoint (.ppt), MS Word (.docx), or epub ingestion parsers.
- **Enhanced MCP Integrations**: Syncing revisions directly into user calendars (Google Calendar API).
