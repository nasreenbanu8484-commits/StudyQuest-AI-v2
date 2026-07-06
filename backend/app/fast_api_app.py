# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import contextlib
import os
import sys
import re
from collections.abc import AsyncIterator
from datetime import datetime, date, timedelta

import google.auth
from a2a.server.tasks import InMemoryTaskStore
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.runners import Runner

# Add parent directory to system path to allow local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.app_utils import services
from app.app_utils.a2a import attach_a2a_routes
from app.app_utils.telemetry import setup_telemetry
from app.app_utils.typing import Feedback

# Local imports
from services.db import init_db, get_db_connection, get_recent_traces
from services.study_service import (
    get_active_exam,
    get_syllabus_topics,
    get_today_mission,
    get_overall_progress,
    reset_biology_demo,
    parse_syllabus_text,
    extract_text_from_pdf,
    clear_study_plan
)
from services.gamification_service import get_gamification_stats
from services.spaced_rep_service import get_revision_queue
from agents.coordinator import run_create_plan_workflow, run_session_complete_workflow, is_api_key_configured
from models.schemas import SetupExamRequest, CompleteSessionRequest, PomodoroLogRequest, ChatRequest, SwitchPlanRequest, DuplicatePlanRequest, ArchivePlanRequest, DeletePlanRequest

load_dotenv()
setup_telemetry()

# Robust logger setup for environments without GCP project configurations
try:
    _, project_id = google.auth.default()
except Exception:
    project_id = None

try:
    from google.cloud import logging as google_cloud_logging
    logging_client = google_cloud_logging.Client()
    logger = logging_client.logger(__name__)
except Exception:
    import logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    class MockLogger:
        def log_struct(self, data, severity="INFO"):
            logging.info(f"[{severity}] {data}")
    logger.log_struct = MockLogger().log_struct

allow_origins = (
    os.getenv("ALLOW_ORIGINS", "").split(",") if os.getenv("ALLOW_ORIGINS") else ["*"]
)

AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Initialize the local SQLite database
    init_db()

    from app.agent import app as adk_app
    from app.agent import root_agent

    runner = Runner(
        app=adk_app,
        session_service=services.get_session_service(),
        artifact_service=services.get_artifact_service(),
        auto_create_session=True,
    )
    app.state.runner = runner
    app.state.agent_app_name = adk_app.name
    await attach_a2a_routes(
        app,
        agent=root_agent,
        runner=runner,
        task_store=InMemoryTaskStore(),
        rpc_path=f"/a2a/{adk_app.name}",
    )
    yield


app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    artifact_service_uri=services.ARTIFACT_SERVICE_URI,
    allow_origins=allow_origins,
    session_service_uri=services.SESSION_SERVICE_URI,
    otel_to_cloud=False,
    lifespan=lifespan,
)
app.title = "StudyQuest AI API"
app.description = "API for the StudyQuest AI Autonomous Study Coach"

# Additional CORS middleware for the next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/dashboard")
def get_dashboard():
    """Aggregates all database and gamification parameters into the dashboard view."""
    # User gamification profile
    gamification = get_gamification_stats(user_id=1)
    user_profile = gamification.get("user", {})
    achievements = gamification.get("achievements", [])

    active_exam = get_active_exam()
    topics_list = []
    today_mission = None
    revisions = []
    progress_percentage = 0.0
    overall_readiness = 0.0

    if active_exam:
        exam_id = active_exam["id"]
        
        # Synchronize active user profile stats back to the exam record
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE exams 
            SET xp = ?, coins = ?, daily_streak = ?, level = ?
            WHERE id = ?
        """, (user_profile.get("xp", 0), user_profile.get("coins", 0), user_profile.get("daily_streak", 0), user_profile.get("level", 1), exam_id))
        conn.commit()
        conn.close()

        topics_list = get_syllabus_topics(exam_id)
        today_mission = get_today_mission(exam_id)
        revisions = get_revision_queue()
        
        progress = get_overall_progress(exam_id)
        progress_percentage = progress["progress"]
        overall_readiness = progress["readiness"]

    # Retrieve or generate coaching message
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, content, type, timestamp FROM coaching_messages ORDER BY id DESC LIMIT 1")
    coach_row = cursor.fetchone()
    
    # Retrieve preferred reminder time
    cursor.execute("SELECT value FROM study_memory WHERE key = 'preferred_reminder_time'")
    reminder_row = cursor.fetchone()

    # Retrieve student name
    cursor.execute("SELECT value FROM study_memory WHERE key = 'student_name'")
    student_row = cursor.fetchone()
    conn.close()

    preferred_reminder_time = reminder_row[0] if reminder_row else "19:00"
    student_name = student_row[0] if student_row else None

    if coach_row:
        coach_message = dict(coach_row)
    else:
        # Create a default greeting message if none exists
        conn = get_db_connection()
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        default_content = "Welcome to StudyQuest AI! Setup your study roadmap to begin your quest. I'm here to coach you until exam day."
        cursor.execute("""
            INSERT INTO coaching_messages (content, type, timestamp)
            VALUES (?, 'general', ?)
        """, (default_content, now_str))
        conn.commit()
        msg_id = cursor.lastrowid
        conn.close()
        coach_message = {
            "id": msg_id,
            "content": default_content,
            "type": "general",
            "timestamp": now_str
        }

    # Fetch recent agent trace collaboration logs
    latest_traces = get_recent_traces(10)

    return {
        "user": user_profile,
        "active_exam": active_exam,
        "today_mission": today_mission,
        "upcoming_revisions": revisions,
        "progress_percentage": progress_percentage,
        "overall_readiness": overall_readiness,
        "coach_message": coach_message,
        "achievements": achievements,
        "topics": topics_list,
        "agent_traces": latest_traces,
        "fallback_mode": not is_api_key_configured(),
        "preferred_reminder_time": preferred_reminder_time,
        "student_name": student_name
    }


@app.post("/api/plans")
def create_plan(payload: SetupExamRequest):
    """Creates a new study plan roadmap via Coordinator -> Planner Agent."""
    try:
        run_create_plan_workflow(
            name=payload.name,
            exam_date=payload.date,
            daily_hours=payload.daily_hours,
            syllabus=payload.syllabus,
            reminder_time=payload.reminder_time,
            student_name=payload.student_name,
            grade=payload.grade,
            session_duration=payload.session_duration or 45,
            break_duration=payload.break_duration or 10,
            score_target=payload.score_target,
            rank_target=payload.rank_target,
            daily_goal=payload.daily_goal,
            weekly_goal=payload.weekly_goal,
            edit_exam_id=payload.edit_exam_id
        )
        return get_dashboard()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plans/reset")
def reset_plan():
    """Resets the active study plan and restores first-time setup state."""
    try:
        clear_study_plan()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sessions/complete")
def complete_session(payload: CompleteSessionRequest):
    """Marks a study session completed via Coordinator -> Multi-Agent workflow, returning updated state."""
    try:
        run_session_complete_workflow(
            mission_id=payload.mission_id,
            topic_id=payload.topic_id,
            confidence=payload.confidence,
            actual_hours=payload.actual_hours
        )
        return get_dashboard()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agents/trace")
def get_agent_traces():
    """Returns recent agent collaboration events."""
    try:
        return get_recent_traces(20)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/demo/reset")
def reset_demo():
    """Resets and seeds the Biology 30-day study quest demo."""
    try:
        reset_biology_demo()
        return get_dashboard()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")

@app.post("/api/syllabus/upload")
async def upload_syllabus(file: UploadFile = File(...)):
    """Handles syllabus PDF or text file uploads and parses candidate topics."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    filename = file.filename or "syllabus.txt"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".txt", ".pdf"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only .txt and .pdf files are supported.")
        
    clean_filename = re.sub(r"[^a-zA-Z0-9_\.-]", "", filename)
    filepath = os.path.join(UPLOAD_DIR, clean_filename)
    
    size_limit = 2 * 1024 * 1024
    content = await file.read()
    if len(content) > size_limit:
        raise HTTPException(status_code=400, detail="File size exceeds the 2MB limit.")
        
    try:
        with open(filepath, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file locally: {str(e)}")
        
    try:
        if ext == ".txt":
            extracted_text = content.decode("utf-8", errors="ignore")
        else:
            extracted_text = extract_text_from_pdf(filepath)
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        raise HTTPException(status_code=400, detail=f"Syllabus extraction error: {str(e)}")
        
    if os.path.exists(filepath):
        os.remove(filepath)
        
    candidates = parse_syllabus_text(extracted_text)
    
    return {
        "status": "success",
        "extracted_text": extracted_text[:1000] + ("..." if len(extracted_text) > 1000 else ""),
        "topic_candidates": candidates,
        "warnings": []
    }


@app.post("/api/pomodoro/log")
def log_pomodoro(payload: PomodoroLogRequest):
    """Logs a Pomodoro session block, awarding a minor XP boost."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # Award 15 XP for completing a Pomodoro interval
        cursor.execute("SELECT xp FROM users WHERE id = 1")
        row = cursor.fetchone()
        current_xp = row["xp"] if row else 0
        new_xp = current_xp + 15
        
        cursor.execute("UPDATE users SET xp = ? WHERE id = 1", (new_xp,))
        conn.commit()
        conn.close()
        return {"status": "success", "xp_earned": 15}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
def chat_with_coach(payload: ChatRequest):
    """Processes user chat queries, routing actions to specialist agents, and returns responses."""
    user_message = payload.message.strip()
    
    # Resolve student metrics & context
    from services.study_service import get_active_exam, get_today_mission, get_syllabus_topics
    from services.spaced_rep_service import get_revision_queue
    from services.db import get_db_connection, add_agent_trace
    from agents.coordinator import run_session_complete_workflow
    
    active_exam = get_active_exam()
    exam_name = active_exam["name"] if active_exam else "your subject"
    exam_id = active_exam["id"] if active_exam else 1
    
    # Match questions
    msg_lower = user_message.lower()
    
    reply_content = ""
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if "study next" in msg_lower or "what should i study" in msg_lower or "next mission" in msg_lower:
        # Route to: Planner Agent / Coach Agent
        today_mission = get_today_mission(exam_id)
        if today_mission:
            reply_content = f"The Planner Agent scheduled '{today_mission['title']}' for today. You should allocate {today_mission['duration_hours']} hours to complete this mission!"
        else:
            # Check next pending topic
            topics = get_syllabus_topics(exam_id)
            pending = [t for t in topics if t["status"] == "pending"]
            if pending:
                reply_content = f"You completed all missions for today. The Planner Agent recommends studying '{pending[0]['name']}' next."
            else:
                reply_content = "All syllabus topics are fully completed! You are exam ready!"
        
        # Add trace log
        add_agent_trace(
            agent_name="Coach Agent",
            action="Routed query: 'What should I study next?'",
            output_summary="Consulted Planner Agent. Advised student to study next mission."
        )
        
    elif "finished" in msg_lower or "complete" in msg_lower or "done" in msg_lower:
        # User completed a topic
        today_mission = get_today_mission(exam_id)
        topic_id = None
        topic_name = ""
        
        topics = get_syllabus_topics(exam_id)
        for t in topics:
            if t["name"].lower() in msg_lower:
                topic_id = t["id"]
                topic_name = t["name"]
                break
                
        if not topic_id and today_mission:
            topic_id = today_mission["topic_id"]
            topic_name = today_mission["title"].replace("Study ", "")
            
        if topic_id:
            duration = today_mission["duration_hours"] if today_mission else 2.0
            run_session_complete_workflow(
                mission_id=today_mission["id"] if today_mission else None,
                topic_id=topic_id,
                confidence=3,
                actual_hours=duration
            )
            reply_content = f"Great work! The Execution Agent marked '{topic_name}' as completed. The Revision Agent scheduled a spaced review in 3 days, and the Motivation Agent awarded you +120 XP (+15 Coins). Keep up the streak!"
        else:
            reply_content = "I couldn't locate which topic you completed. Please set up your study plan first or type 'I finished [Topic Name]'."
            
    elif "reschedule" in msg_lower or "postpone" in msg_lower or "change today" in msg_lower:
        # Pushes today's mission to tomorrow
        today_mission = get_today_mission(exam_id)
        if today_mission:
            conn = get_db_connection()
            cursor = conn.cursor()
            tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
            cursor.execute("UPDATE daily_missions SET date = ? WHERE id = ?", (tomorrow_str, today_mission["id"]))
            conn.commit()
            conn.close()
            
            reply_content = f"Understood. The Planner Agent pushed today's mission '{today_mission['title']}' to tomorrow ({tomorrow_str}). I adjusted your workload limit to prevent study fatigue."
            add_agent_trace(
                agent_name="Planner Agent",
                action="Rescheduled today's mission",
                output_summary=f"Postponed today's mission to tomorrow. Re-balanced workload limits."
            )
        else:
            reply_content = "You don't have any pending study mission scheduled for today to reschedule."
            
    elif "plan" in msg_lower or "roadmap" in msg_lower:
        topics = get_syllabus_topics(exam_id)
        completed = [t for t in topics if t["status"] == "completed"]
        pending = [t for t in topics if t["status"] == "pending"]
        in_progress = [t for t in topics if t["status"] == "in_progress"]
        reply_content = f"The Planner Agent compiled your study quest roadmap for '{exam_name}'. It contains {len(topics)} topics. Currently: {len(completed)} completed, {len(in_progress)} in progress, and {len(pending)} pending."
        add_agent_trace(
            agent_name="Planner Agent",
            action="Analyzed study plan status",
            output_summary=f"Reported plan progress: {len(completed)}/{len(topics)} completed."
        )

    elif "revision" in msg_lower or "spaced" in msg_lower or "repetition" in msg_lower or "review" in msg_lower or "schedule" in msg_lower:
        revisions = get_revision_queue()
        if revisions:
            pending_revs = [r for r in revisions if not r["is_completed"]]
            completed_revs = [r for r in revisions if r["is_completed"]]
            schedule_text = ", ".join([f"'{r['topic_name']}' on {r['scheduled_date']}" for r in pending_revs[:3]])
            reply_content = f"The Revision Agent is managing your spaced repetition queue. You have {len(pending_revs)} pending revisions and {len(completed_revs)} completed revisions. Next reviews scheduled: {schedule_text if schedule_text else 'None'}"
        else:
            reply_content = "You don't have any spaced repetition revision sessions scheduled yet. Complete a daily study mission to trigger review planning!"
        add_agent_trace(
            agent_name="Revision Agent",
            action="Reviewed spaced repetition queues",
            output_summary=f"Reported {len(revisions)} revisions in student queue."
        )
            
    elif "explain" in msg_lower or "what is" in msg_lower:
        topics = get_syllabus_topics(exam_id)
        matched_topic = None
        for t in topics:
            if t["name"].lower() in msg_lower:
                matched_topic = t
                break
        
        topic_name = matched_topic["name"] if matched_topic else "this subject"
        reply_content = f"Here is a summary explanation of '{topic_name}': It represents a core component of your '{exam_name}' syllabus. You should focus on understanding the key terminology, basic principles, and past practice questions."
        add_agent_trace(
            agent_name="Coach Agent",
            action=f"Explained topic '{topic_name}'",
            output_summary=f"Generated curriculum breakdown content for topic '{topic_name}'."
        )
        
    else:
        reply_content = "Hello! I am your Study Coach. Ask me 'What should I study next?', 'I finished [topic]', or 'Reschedule today's mission' to command your study quest!"
        add_agent_trace(
            agent_name="Coach Agent",
            action="Responded to user chat query",
            output_summary="Offered menu navigation help guidelines."
        )
        
    # Append message to coach messages
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO coaching_messages (content, type, timestamp)
        VALUES (?, 'coach_chat', ?)
    """, (reply_content, now_str))
    conn.commit()
    conn.close()
    
    dashboard = get_dashboard()
    dashboard["coach_chat_reply"] = reply_content
    return dashboard


@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    """Collect and log feedback."""
    logger.log_struct(feedback.model_dump(), severity="INFO")
    return {"status": "success"}


@app.get("/health")
def health_check():
    """Simple check confirming backend is running."""
    return {"status": "healthy"}


@app.get("/ready")
def readiness_check():
    """Verifies backend database is accessible and responsive."""
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database offline: {str(e)}")


@app.get("/api/plans")
def list_plans():
    """Lists all created study plans with countdown, subjects counts, and progress status."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, date, daily_hours, status, last_opened, xp, coins, daily_streak, level,
                   grade, session_duration, break_duration, score_target, rank_target, daily_goal, weekly_goal, student_name
            FROM exams
            ORDER BY last_opened DESC, id DESC
        """)
        rows = cursor.fetchall()
        
        plans_list = []
        for r in rows:
            exam_id = r["id"]
            
            # Compute days remaining
            exam_date = datetime.strptime(r["date"], "%Y-%m-%d").date()
            today = date.today()
            countdown = (exam_date - today).days
            
            # Compute progress percentage based on completed daily missions
            cursor.execute("SELECT COUNT(*), SUM(is_completed) FROM daily_missions WHERE exam_id = ?", (exam_id,))
            total_m, comp_m = cursor.fetchone()
            comp_m = comp_m or 0
            progress = (comp_m / total_m * 100.0) if total_m > 0 else 0.0
            
            # Count subjects
            cursor.execute("SELECT name FROM syllabus_topics WHERE exam_id = ?", (exam_id,))
            topic_rows = cursor.fetchall()
            subjects = set()
            for t in topic_rows:
                if ":" in t["name"]:
                    subjects.add(t["name"].split(":")[0].strip())
            num_subjects = len(subjects) if subjects else 1
            
            plans_list.append({
                "id": r["id"],
                "name": r["name"],
                "date": r["date"],
                "daily_hours": r["daily_hours"],
                "status": r["status"] or "Active",
                "last_opened": r["last_opened"],
                "xp": r["xp"] or 0,
                "coins": r["coins"] or 0,
                "daily_streak": r["daily_streak"] or 0,
                "level": r["level"] or 1,
                "grade": r["grade"],
                "session_duration": r["session_duration"] or 45,
                "break_duration": r["break_duration"] or 10,
                "score_target": r["score_target"],
                "rank_target": r["rank_target"],
                "daily_goal": r["daily_goal"],
                "weekly_goal": r["weekly_goal"],
                "student_name": r["student_name"],
                "countdown_days": max(0, countdown),
                "progress_percentage": round(progress, 1),
                "num_subjects": num_subjects,
                "subjects": list(subjects) if subjects else [r["name"]]
            })
            
        conn.close()
        return plans_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plans/switch")
def switch_plan(payload: SwitchPlanRequest):
    """Switches active study plan by updating memory active ID and copying stats into users profile."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Get current active plan ID if any
        cursor.execute("SELECT value FROM study_memory WHERE key = 'active_exam_id'")
        mem_row = cursor.fetchone()
        active_id = int(mem_row[0]) if mem_row else None
        
        # 2. Get current user profile stats
        cursor.execute("SELECT xp, coins, daily_streak, level FROM users WHERE id = 1")
        user_row = cursor.fetchone()
        
        # 3. Save current user profile stats to current active plan
        if active_id and user_row:
            cursor.execute("""
                UPDATE exams
                SET xp = ?, coins = ?, daily_streak = ?, level = ?
                WHERE id = ?
            """, (user_row["xp"], user_row["coins"], user_row["daily_streak"], user_row["level"], active_id))
            
        # 4. Set target plan active
        cursor.execute("""
            INSERT OR REPLACE INTO study_memory (key, value)
            VALUES ('active_exam_id', ?)
        """, (str(payload.exam_id),))
        
        # 5. Fetch target plan stats
        cursor.execute("SELECT xp, coins, daily_streak, level, status, student_name, name FROM exams WHERE id = ?", (payload.exam_id,))
        target_exam = cursor.fetchone()
        
        if target_exam:
            # Restore stats in user profile
            cursor.execute("""
                UPDATE users
                SET xp = ?, coins = ?, daily_streak = ?, level = ?
                WHERE id = 1
            """, (target_exam["xp"] or 0, target_exam["coins"] or 0, target_exam["daily_streak"] or 0, target_exam["level"] or 1, ))
            
            # Keep sync with student name in study memory
            if target_exam["student_name"]:
                cursor.execute("""
                    INSERT OR REPLACE INTO study_memory (key, value)
                    VALUES ('student_name', ?)
                """, (target_exam["student_name"],))
            else:
                cursor.execute("DELETE FROM study_memory WHERE key = 'student_name'")
            
        # 6. Update target plan last_opened
        cursor.execute("""
            UPDATE exams
            SET last_opened = ?
            WHERE id = ?
        """, (datetime.now().strftime("%Y-%m-%d %H:%M:%S"), payload.exam_id))
        
        conn.commit()
        conn.close()
        return get_dashboard()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plans/duplicate")
def duplicate_plan(payload: DuplicatePlanRequest):
    """Creates a deep copy of a previous study plan (exam, topics, missions, and revisions)."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Read target plan
        cursor.execute("""
            SELECT name, date, daily_hours, syllabus, grade, session_duration, break_duration, 
                   score_target, rank_target, daily_goal, weekly_goal, xp, coins, daily_streak, level, student_name
            FROM exams WHERE id = ?
        """, (payload.exam_id,))
        exam_row = cursor.fetchone()
        if not exam_row:
            raise HTTPException(status_code=404, detail="Study plan not found.")
            
        # 2. Insert new exam
        new_name = f"{exam_row['name']} (Copy)"
        cursor.execute("""
            INSERT INTO exams (name, date, daily_hours, syllabus, grade, session_duration, break_duration, 
                              score_target, rank_target, daily_goal, weekly_goal, status, last_opened, 
                              xp, coins, daily_streak, level, student_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?)
        """, (new_name, exam_row["date"], exam_row["daily_hours"], exam_row["syllabus"], 
              exam_row["grade"], exam_row["session_duration"] or 45, exam_row["break_duration"] or 10,
              exam_row["score_target"], exam_row["rank_target"], exam_row["daily_goal"], exam_row["weekly_goal"],
              datetime.now().strftime("%Y-%m-%d %H:%M:%S"), exam_row["xp"] or 0, exam_row["coins"] or 0, 
              exam_row["daily_streak"] or 0, exam_row["level"] or 1, exam_row["student_name"]))
        new_exam_id = cursor.lastrowid
        
        # 3. Duplicate syllabus topics
        cursor.execute("SELECT id, name, status, confidence_score, order_index FROM syllabus_topics WHERE exam_id = ?", (payload.exam_id,))
        topic_rows = cursor.fetchall()
        topic_id_map = {} # old_id -> new_id
        for t in topic_rows:
            cursor.execute("""
                INSERT INTO syllabus_topics (exam_id, name, status, confidence_score, order_index)
                VALUES (?, ?, ?, ?, ?)
            """, (new_exam_id, t["name"], t["status"], t["confidence_score"], t["order_index"]))
            topic_id_map[t["id"]] = cursor.lastrowid
            
        # 4. Duplicate daily missions
        cursor.execute("SELECT topic_id, title, date, duration_hours, is_completed FROM daily_missions WHERE exam_id = ?", (payload.exam_id,))
        mission_rows = cursor.fetchall()
        for m in mission_rows:
            new_topic_id = topic_id_map.get(m["topic_id"]) if m["topic_id"] else None
            cursor.execute("""
                INSERT INTO daily_missions (exam_id, topic_id, title, date, duration_hours, is_completed)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (new_exam_id, new_topic_id, m["title"], m["date"], m["duration_hours"], m["is_completed"]))
            
        # 5. Duplicate revisions
        for old_t_id, new_t_id in topic_id_map.items():
            cursor.execute("SELECT scheduled_date, confidence_score, is_completed FROM revisions WHERE topic_id = ?", (old_t_id,))
            rev_rows = cursor.fetchall()
            for r in rev_rows:
                cursor.execute("""
                    INSERT INTO revisions (topic_id, scheduled_date, confidence_score, is_completed)
                    VALUES (?, ?, ?, ?)
                """, (new_t_id, r["scheduled_date"], r["confidence_score"], r["is_completed"]))
                
        conn.commit()
        conn.close()
        return list_plans()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plans/archive")
def archive_plan(payload: ArchivePlanRequest):
    """Sets status to Archived for the target study plan."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE exams SET status = 'Archived' WHERE id = ?", (payload.exam_id,))
        conn.commit()
        conn.close()
        return list_plans()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plans/delete")
def delete_plan(payload: DeletePlanRequest):
    """Deletes exam and cascades (missions, topics, revisions). Re-points active exam if active was deleted."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check active exam ID in memory
        cursor.execute("SELECT value FROM study_memory WHERE key = 'active_exam_id'")
        mem_row = cursor.fetchone()
        active_id = None
        if mem_row:
            try:
                active_id = int(mem_row["value"])
            except Exception:
                pass
        
        # Safe cascading delete
        cursor.execute("DELETE FROM revisions WHERE topic_id IN (SELECT id FROM syllabus_topics WHERE exam_id = ?)", (payload.exam_id,))
        cursor.execute("DELETE FROM syllabus_topics WHERE exam_id = ?", (payload.exam_id,))
        cursor.execute("DELETE FROM daily_missions WHERE exam_id = ?", (payload.exam_id,))
        cursor.execute("DELETE FROM exams WHERE id = ?", (payload.exam_id,))
        
        # If the deleted exam was the active exam, set pointer to -1 and reset user stats
        if active_id == payload.exam_id:
            cursor.execute("""
                INSERT INTO study_memory (key, value)
                VALUES ('active_exam_id', '-1')
                ON CONFLICT(key) DO UPDATE SET value = '-1'
            """)
            cursor.execute("UPDATE users SET level = 1, xp = 0, coins = 0, daily_streak = 0, weekly_streak = 0, last_active = NULL")
            
        conn.commit()
        conn.close()
        return list_plans()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Main execution
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
