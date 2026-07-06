# StudyQuest AI Architecture

This document describes the technical architecture and multi-agent topology of **StudyQuest AI**, an autonomous study coach MVP.

## High-Level request flow

```mermaid
graph LR
    Frontend[Frontend Dashboard] -->|API Calls| FastAPI[FastAPI App]
    FastAPI -->|Event Coordination| Coordinator[Coordinator Agent]
    Coordinator -->|Delegates Context| MCP_Client[MCP Client Adapter]
    MCP_Client -->|Request tools| MCP_Server[MCP Server]
    MCP_Server -->|Commit / Query| SQLite[(SQLite Memory & Revisions)]
```

## System Topology Diagram

The diagram below outlines the interaction between the client, API backend, Google ADK Agents, and the SQLite storage layer.

```mermaid
graph TD
    User[User] -->|Interacts with| Frontend[Next.js Frontend]
    Frontend -->|HTTP Requests| FastAPI[FastAPI Backend]
    FastAPI -->|Delegates Events| Coordinator[Coordinator Agent]
    
    subgraph SpecialistAgents [Specialist Agents]
        Coordinator -->|1. Setup / Workloads| Planner[Planner Agent]
        Coordinator -->|2. Completes| Exec[Execution Agent]
        Coordinator -->|3. Intervals| Rev[Revision Agent]
        Coordinator -->|4. Streaks & Badges| Motiv[Motivation Agent]
        Coordinator -->|5. Advisory| Coach[Coach Agent]
    end

    subgraph ToolsServices [Tools / Services]
        Planner -->|Calls| ToolPlan[create_study_roadmap_tool]
        Exec -->|Calls| ToolExec[mark_session_complete_tool]
        Rev -->|Calls| ToolRev[schedule_spaced_revisions_tool]
        Motiv -->|Calls| ToolMotiv[update_gamification_tool]
        Coach -->|Calls| ToolCoach[generate_coach_insight_tool]
    end

    subgraph StorageLayer [Storage / MCP]
        ToolPlan -->|SQLite| DB[(SQLite DB)]
        ToolExec -->|SQLite| DB
        ToolRev -->|SQLite| DB
        ToolMotiv -->|SQLite| DB
        ToolCoach -->|SQLite| DB
        
        MCP[Model Context Protocol Server] -->|Searches/Logs| DB
    end

    DB -->|Aggregated Payloads| Dashboard[Dashboard View]
    Dashboard -->|Refreshes UI| Frontend
```

## Component Architecture

### 1. Frontend: Next.js Client
A visual, dark-themed dashboard command center rendering:
- **Daily Mission**: Focus item to execute.
- **Spaced Repetition Queue**: Tracks dynamic intervals (Day 1, 3, 7, 14, 30).
- **Gamification Deck**: XP meters, level metrics, coin stores, streaks.
- **Coach Panel**: strategic study insights.
- **Achievements drawer**: Locked/unlocked badges.

### 2. Backend: FastAPI Server
Exposes high-speed, type-safe JSON endpoints for data CRUD, and acts as the runtime host for the ADK multi-agent engine:
- `GET /api/dashboard`: Aggregates current user profile, streak, today's mission, revision, coach messages, achievements, and readiness metrics.
- `POST /api/exam/setup`: Initializes the study roadmap.
- `POST /api/session/complete`: Marks a mission complete, awards XP/coins, schedules spaced repetition revisions, and runs the coach diagnostic checks.
- `POST /api/pomodoro/log`: Logs completed Pomodoro focus blocks.

### 3. Google ADK Multi-Agent System
Organized as a sequential coordinator managing collaborative agent duties:
- **Planner Agent**: estimates work volumes, extracts syllabus topics, and writes roadmaps.
- **Execution Agent**: watches tasks and validates completions.
- **Revision Agent**: schedules spaced repetition intervals based on student confidence scores.
- **Motivation Agent**: runs streaks, levels, and unlocks badges.
- **Coach Agent**: evaluates overall study metrics to compose context-aware advising notes.

### 4. Storage: SQLite Database
Stores relational student metrics in a local `studyquest.db` file with schemas for:
- `users`: levels, XP, coins, streaks, last active.
- `exams`: target name, date, hours.
- `syllabus_topics`: topic name, completion status, confidence ratings.
- `daily_missions`: date, duration, completion status.
- `revisions`: revision dates, confidence ratings, completion status.
- `achievements`: badge definitions and unlock dates.
- `coaching_messages`: text feed of coach logs.

---

## 🔁 Agent Collaboration Workflow Diagram

The flowchart below traces the sequential delegation loop triggered upon study session completions:

```mermaid
graph TD
    Start([Complete Session]) --> Exec[Execution Agent: Marks Topic Completed]
    Exec --> Rev[Revision Agent: Calculates Spaced Repetition]
    Rev --> Motiv[Motivation Agent: Awards XP & Upgrades Level]
    Motiv --> Plan[Planner Agent: Adjusts Future Load]
    Plan --> Coach[Coach Agent: Composes Strategic Advisor Insight]
    Coach --> End([Dashboard Update])
```

---

## 🗃️ MCP Memory Flow Diagram

The diagram below maps how StudyQuest agents interface with the local Model Context Protocol tools to persist and fetch student context:

```mermaid
graph LR
    Agent[Agent / Service] -->|Request Memory| Client[MCP Client Adapter]
    Client -->|Stdio Protocol| Server[MCP Server Tools]
    Server -->|SQL query| DB[(SQLite Database)]
    DB -->|Return value| Server
    Server -->|JSON response| Client
    Client -->|Student Context dict| Agent
```
