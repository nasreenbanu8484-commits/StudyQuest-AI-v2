# StudyQuest AI — Judge Demo Script & Narration

Use this script for a high-impact, 3-minute competition presentation of StudyQuest AI.

---

## 🎙️ Narration Walkthrough

### Part 1: Introduction (0:00 - 0:45)
- **Narration**: *"Traditional study and task managers are passive. When a student falls behind, reports low comprehension of a topic, or struggles, traditional apps do nothing. The work stacks up and burnout sets in. StudyQuest AI fixes this. It is an active, autonomous multi-agent study coach built on the Google Agent Development Kit and Model Context Protocol. It doesn't just track tasks; it actively plans, monitors, motivates, schedules revision intervals, and coaches you to exam day."*
- **Action**: Load the dashboard setup wizard screen on the screen.

### Part 2: Loading the Quest (0:45 - 1:30)
- **Narration**: *"Let's prepare for a Biology Exam scheduled in 30 days. We allocate 2.0 hours of daily study time. Instead of typing the topics manually, we can upload a syllabus PDF or paste text here. Our Planner Agent sanitizes the input, extracts the key topics, estimates workloads, and maps them across the study window, leaving a 10% mock exam buffer at the end."*
- **Action**: Click **Load Biology Demo** on the top right.
- **Judges Observe**:
  - The setup wizard transitions immediately into a dark, premium command center dashboard.
  - The metrics cards show **30 Days Left**, **0% Completion**, and **0% AI Readiness**.
  - Today's mission is populated: **Study Cell Division (2.0 Hours)**.
  - The Agent Activity Log shows: `[Planner Agent] Initialized biology study roadmap: Divided Biology syllabus into 6 topics over 30 days.`

### Part 3: Autonomous Workflow Collaboration (1:30 - 2:30)
- **Narration**: *"Let's complete our first study session for 'Cell Division'. We spent the 2 hours, but confidence was moderate: 3/5. When I log this completion, a coordinated 5-agent workflow activates autonomously via the StudyQuest Coordinator."*
- **Action**: Click **Complete Session** on the Today's Mission card. Keep the default **confidence 3**, and click **Record Success**.
- **Judges Observe**:
  - **Level Up**: Student gains **+120 XP**, Level increments to **Level 2** (XP updates to 500), and Coins increment to **55**.
  - **Streak**: Study streak increases to **5 days**.
  - **Spaced Repetition**: Revision queue gets "Cell Division" scheduled exactly 3 days from now.
  - **Workload Adjustment**: Planner Agent reports tomorrow's load kept at standard to protect the student's 2-hour limit.
  - **Coaching message**: Advisor updates dynamically: *"Cell Division is complete with moderate confidence (3/5). I scheduled review in 3 days. Tomorrow's workload has been adjusted..."*
  - **Trace logs**: The Agent Activity Log updates in real time, showing the sequential trace of the 5 agents: Execution, Revision, Motivation, Planner, and Coach.

### Part 4: Technical Summary & Handoff (2:30 - 3:00)
- **Narration**: *"This entire coordination runs locally. When Gemini credentials are not present, our local fallback adapter executes deterministic stubs to verify the logic. Revisions, preferences, and progress states are logged in our SQLite persistent study memory, which the Coach Agent reads to compose progress-aware feedback. Thank you!"*

---

## 🔬 Under the Hood: API Calls & Flows

1. **Step 1 (Reset)**: Frontend calls `POST /api/demo/reset`. Clear SQLite, seed level 1 user (380 XP, 40 coins, streak 4), seed Biology 30-day exam, and log initial planner trace.
2. **Step 2 (Complete)**: Frontend calls `POST /api/sessions/complete` with payload:
   ```json
   {
     "mission_id": 101,
     "topic_id": 1,
     "confidence": 3,
     "actual_hours": 2.0
   }
   ```
3. **Step 3 (Re-render)**: Frontend fetches `GET /api/dashboard`. Returns updated profile data, revision queue dates, dynamic coach advisor texts, and the 5-agent activity trace list.

---

## 🛡️ Fallback Scenarios

If the local backend server is temporarily unreachable:
- The Next.js frontend has built-in **offline fallback mocks** for all button triggers.
- Clicking **Load Biology Demo** or **Record Success** executes the state increments entirely in react state, showing the exact same metrics increments, level-ups, revisions, and agent trace lines.
- **The demo is guaranteed to run successfully on any presentation laptop!**
