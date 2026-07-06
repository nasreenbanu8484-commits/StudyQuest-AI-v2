import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from services.db import get_db_connection, init_db
from services.spaced_rep_service import schedule_spaced_repetition
from services.gamification_service import award_rewards

def parse_syllabus_text(text: str) -> List[str]:
    """Sanitizes syllabus input and splits it into a clean list of topics."""
    if not text or text.strip() == "":
        return []
    raw_parts = []
    lines = [line.strip() for line in text.replace("\r", "").split("\n") if line.strip()]
    for line in lines:
        if "," in line:
            raw_parts.extend([p.strip() for p in line.split(",") if p.strip()])
        else:
            raw_parts.append(line)
    
    seen = set()
    cleaned = []
    for t in raw_parts:
        low = t.lower()
        if low not in seen:
            seen.add(low)
            cleaned.append(t)
    return cleaned

def extract_text_from_pdf(filepath: str) -> str:
    """Extracts text from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(filepath)
        text_parts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_parts.append(t)
        return "\n".join(text_parts)
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")

def get_active_exam() -> Optional[Dict[str, Any]]:
    """Gets the active exam details and calculates the countdown in days."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if there is an active_exam_id set in study_memory
    cursor.execute("SELECT value FROM study_memory WHERE key = 'active_exam_id'")
    mem_row = cursor.fetchone()
    row = None
    if mem_row:
        val = mem_row["value"]
        if val in ("none", "null", "-1", ""):
            conn.close()
            return None
        try:
            active_id = int(val)
            cursor.execute("""
                SELECT id, name, date, daily_hours, syllabus, grade, session_duration, break_duration, 
                       score_target, rank_target, daily_goal, weekly_goal, status, last_opened 
                FROM exams WHERE id = ?
            """, (active_id,))
            row = cursor.fetchone()
        except Exception:
            pass
            
    if not row and not mem_row:
        cursor.execute("""
            SELECT id, name, date, daily_hours, syllabus, grade, session_duration, break_duration, 
                   score_target, rank_target, daily_goal, weekly_goal, status, last_opened 
            FROM exams ORDER BY id DESC LIMIT 1
        """)
        row = cursor.fetchone()
        
    conn.close()

    if not row:
        return None

    exam_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
    today = date.today()
    countdown = (exam_date - today).days

    row_dict = dict(row)
    return {
        "id": row_dict["id"],
        "name": row_dict["name"],
        "date": row_dict["date"],
        "daily_hours": row_dict["daily_hours"],
        "countdown_days": max(0, countdown),
        "grade": row_dict.get("grade"),
        "session_duration": row_dict.get("session_duration") or 45,
        "break_duration": row_dict.get("break_duration") or 10,
        "score_target": row_dict.get("score_target"),
        "rank_target": row_dict.get("rank_target"),
        "daily_goal": row_dict.get("daily_goal"),
        "weekly_goal": row_dict.get("weekly_goal"),
        "status": row_dict.get("status") or "Active",
        "last_opened": row_dict.get("last_opened")
    }

def get_syllabus_topics(exam_id: int) -> List[Dict[str, Any]]:
    """Returns all topics for the given exam."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, status, confidence_score, order_index 
        FROM syllabus_topics 
        WHERE exam_id = ?
        ORDER BY order_index ASC
    """, (exam_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_today_mission(exam_id: int) -> Optional[Dict[str, Any]]:
    """Gets today's pending study mission."""
    conn = get_db_connection()
    cursor = conn.cursor()
    today_str = date.today().strftime("%Y-%m-%d")
    cursor.execute("""
        SELECT id, topic_id, title, date, duration_hours, is_completed
        FROM daily_missions
        WHERE exam_id = ? AND date = ? AND is_completed = 0
        LIMIT 1
    """, (exam_id, today_str))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_overall_progress(exam_id: int) -> Dict[str, Any]:
    """Calculates overall course completion percentage and readiness score."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Progress percentage based on completed daily missions
    cursor.execute("SELECT COUNT(*), SUM(is_completed) FROM daily_missions WHERE exam_id = ?", (exam_id,))
    total_missions, completed_missions = cursor.fetchone()
    completed_missions = completed_missions or 0
    progress = (completed_missions / total_missions * 100.0) if total_missions > 0 else 0.0

    # Readiness score based on syllabus topics status and confidence scores
    cursor.execute("SELECT id, status, confidence_score FROM syllabus_topics WHERE exam_id = ?", (exam_id,))
    topics = cursor.fetchall()
    conn.close()

    if not topics:
        return {"progress": 0.0, "readiness": 0.0}

    # Readiness weight: 60% completion status, 40% confidence score averages
    status_score = 0
    confidence_sum = 0
    for t in topics:
        if t["status"] == "completed":
            status_score += 100
        elif t["status"] == "in_progress":
            status_score += 50
        
        # Normalize confidence to 0-100 scale (max confidence is 5)
        confidence_sum += (t["confidence_score"] / 5.0) * 100

    avg_status = status_score / len(topics)
    avg_confidence = confidence_sum / len(topics)
    readiness = (avg_status * 0.6) + (avg_confidence * 0.4)

    return {
        "progress": round(progress, 1),
        "readiness": round(readiness, 1)
    }

def create_study_roadmap(
    name: str, 
    exam_date_str: str, 
    daily_hours: float, 
    syllabus_text: str = None, 
    reminder_time: str = "19:00", 
    student_name: str = None,
    grade: str = None,
    session_duration: int = 45,
    break_duration: int = 10,
    score_target: int = None,
    rank_target: str = None,
    daily_goal: str = None,
    weekly_goal: str = None,
    edit_exam_id: int = None
) -> Dict[str, Any]:
    """Sets up a new exam, parses topics, and plans daily missions with mock/revision buffers."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Save preferred reminder time in study memory
    cursor.execute("""
        INSERT OR REPLACE INTO study_memory (key, value)
        VALUES ('preferred_reminder_time', ?)
    """, (reminder_time,))

    # Save student name if provided
    if student_name:
        cursor.execute("""
            INSERT OR REPLACE INTO study_memory (key, value)
            VALUES ('student_name', ?)
        """, (student_name,))

    # Variables for state preservation
    old_xp = 0
    old_coins = 0
    old_streak = 0
    old_level = 1
    old_topics = {}

    if edit_exam_id:
        # 1. Fetch old exam stats
        cursor.execute("SELECT xp, coins, daily_streak, level FROM exams WHERE id = ?", (edit_exam_id,))
        old_exam_row = cursor.fetchone()
        if old_exam_row:
            old_xp = old_exam_row["xp"] or 0
            old_coins = old_exam_row["coins"] or 0
            old_streak = old_exam_row["daily_streak"] or 0
            old_level = old_exam_row["level"] or 1
            
        # 2. Fetch old syllabus topics to map completed status
        cursor.execute("SELECT name, status, confidence_score FROM syllabus_topics WHERE exam_id = ?", (edit_exam_id,))
        old_topic_rows = cursor.fetchall()
        for r in old_topic_rows:
            old_topics[r["name"]] = (r["status"], r["confidence_score"])
    else:
        # Starting a completely new plan - reset active profile stats so the student starts fresh
        cursor.execute("UPDATE users SET level = 1, xp = 0, coins = 0, daily_streak = 0, weekly_streak = 0, last_active = NULL WHERE id = 1")
        cursor.execute("UPDATE achievements SET is_unlocked = 0, unlocked_at = NULL")

    # Create new exam entry with target parameters
    cursor.execute("""
        INSERT INTO exams (name, date, daily_hours, syllabus, grade, session_duration, break_duration, 
                          score_target, rank_target, daily_goal, weekly_goal, status, last_opened, 
                          xp, coins, daily_streak, level, student_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?, ?, ?, ?)
    """, (name, exam_date_str, daily_hours, syllabus_text, grade, session_duration, break_duration, 
          score_target, rank_target, daily_goal, weekly_goal, datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
          old_xp, old_coins, old_streak, old_level, student_name))
    exam_id = cursor.lastrowid

    # Set the active exam ID in memory
    cursor.execute("""
        INSERT OR REPLACE INTO study_memory (key, value)
        VALUES ('active_exam_id', ?)
    """, (str(exam_id),))

    # Parse topics or fall back
    topics = parse_syllabus_text(syllabus_text)
    if not topics:
        subjects = [s.strip() for s in name.split(",") if s.strip()]
        topics = []
        for sub in subjects:
            sub_lower = sub.lower()
            sub_topics = []
            if "calculus" in sub_lower:
                sub_topics = ["Limits & Continuity", "Derivatives", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations"]
            elif "chemistry" in sub_lower:
                sub_topics = ["Atomic Structure", "Chemical Bonding", "Stoichiometry", "States of Matter", "Chemical Kinetics", "Organic Chemistry"]
            elif "physics" in sub_lower:
                sub_topics = ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Quantum Physics", "Nuclear Physics"]
            elif "biology" in sub_lower:
                sub_topics = ["Cell Division", "Genetics", "Human Reproduction", "Evolution", "Ecology", "Biotechnology"]
            else:
                sub_topics = [
                    f"{sub} Fundamentals",
                    f"Core {sub} Concepts",
                    f"Advanced {sub} Topics",
                    f"{sub} Practice & Review"
                ]
            
            if len(subjects) > 1:
                topics.extend([f"{sub}: {t}" for t in sub_topics])
            else:
                topics.extend(sub_topics)

    # Insert topics into syllabus_topics (and copy revisions if editing)
    for idx, t_name in enumerate(topics):
        old_status, old_confidence = old_topics.get(t_name, ("pending", 0))
        cursor.execute("""
            INSERT INTO syllabus_topics (exam_id, name, status, confidence_score, order_index)
            VALUES (?, ?, ?, ?, ?)
        """, (exam_id, t_name, old_status, old_confidence, idx))
        new_topic_id = cursor.lastrowid
        
        if edit_exam_id:
            # Look up corresponding old topic ID
            cursor.execute("SELECT id FROM syllabus_topics WHERE exam_id = ? AND name = ?", (edit_exam_id, t_name))
            old_topic_row = cursor.fetchone()
            if old_topic_row:
                old_topic_id = old_topic_row["id"]
                # Copy revisions
                cursor.execute("SELECT scheduled_date, confidence_score, is_completed FROM revisions WHERE topic_id = ?", (old_topic_id,))
                rev_rows = cursor.fetchall()
                for rev in rev_rows:
                    cursor.execute("""
                        INSERT INTO revisions (topic_id, scheduled_date, confidence_score, is_completed)
                        VALUES (?, ?, ?, ?)
                    """, (new_topic_id, rev["scheduled_date"], rev["confidence_score"], rev["is_completed"]))

    # Fetch inserted topic IDs
    cursor.execute("SELECT id, name FROM syllabus_topics WHERE exam_id = ? ORDER BY order_index ASC", (exam_id,))
    syllabus_rows = cursor.fetchall()
    topic_map = {row["name"]: row["id"] for row in syllabus_rows}

    # Generate daily missions over the period
    exam_date = datetime.strptime(exam_date_str, "%Y-%m-%d").date()
    today = date.today()
    total_days = (exam_date - today).days

    if total_days > 0:
        # Buffer days capped at 10% of total days (between 1 and 5 days)
        buffer_days = max(1, min(5, total_days // 10))
        study_days = total_days - buffer_days
        
        if study_days <= 0:
            study_days = total_days
            buffer_days = 0
            
        # Calculate days allocated per topic
        days_per_topic = max(1, study_days // len(topics))
        current_date = today
        
        # Sequentially map topics to study days
        for idx, t_name in enumerate(topics):
            topic_id = topic_map[t_name]
            is_completed_val = 0
            if edit_exam_id:
                old_status, _ = old_topics.get(t_name, ("pending", 0))
                if old_status == "completed":
                    is_completed_val = 1

            for day_offset in range(days_per_topic):
                if current_date >= (exam_date - timedelta(days=buffer_days)):
                    break
                cursor.execute("""
                    INSERT INTO daily_missions (exam_id, topic_id, title, date, duration_hours, is_completed)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (exam_id, topic_id, f"Study {t_name}", current_date.strftime("%Y-%m-%d"), daily_hours, is_completed_val))
                current_date += timedelta(days=1)
                
        # Fill intermediate study gaps if any remain before buffer starts
        study_end_date = exam_date - timedelta(days=buffer_days)
        while current_date < study_end_date:
            last_topic_name = topics[-1]
            last_completed = 1 if edit_exam_id and old_topics.get(last_topic_name, ("pending", 0))[0] == "completed" else 0
            cursor.execute("""
                INSERT INTO daily_missions (exam_id, topic_id, title, date, duration_hours, is_completed)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (exam_id, topic_map[last_topic_name], f"Study {last_topic_name}", current_date.strftime("%Y-%m-%d"), daily_hours, last_completed))
            current_date += timedelta(days=1)
            
        # Fill buffer days with mock/revision exercises
        while current_date < exam_date:
            cursor.execute("""
                INSERT INTO daily_missions (exam_id, topic_id, title, date, duration_hours, is_completed)
                VALUES (?, NULL, ?, ?, ?, 0)
            """, (exam_id, "Mock Exam & Final Review", current_date.strftime("%Y-%m-%d"), daily_hours))
            current_date += timedelta(days=1)
    else:
        # Default single mission if exam date is today/past
        topic_id = topic_map[topics[0]]
        is_completed_val = 0
        if edit_exam_id:
            old_status, _ = old_topics.get(topics[0], ("pending", 0))
            if old_status == "completed":
                is_completed_val = 1
        cursor.execute("""
            INSERT INTO daily_missions (exam_id, topic_id, title, date, duration_hours, is_completed)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (exam_id, topic_id, f"Study {topics[0]}", today.strftime("%Y-%m-%d"), daily_hours, is_completed_val))

    # 3. Archive old edited exam database records instead of deleting to preserve study plan history
    if edit_exam_id:
        cursor.execute("UPDATE exams SET status = 'Archived' WHERE id = ?", (edit_exam_id,))

    conn.commit()
    conn.close()

    # Also log a memory save of preferred hours configuration
    from utils.mcp_client import call_save_study_memory
    call_save_study_memory("preferred_hours", str(daily_hours))

    return {
        "exam_id": exam_id,
        "topics_created": len(topics)
    }

def complete_daily_mission(mission_id: int, topic_id: int, confidence: int, actual_hours: float) -> Dict[str, Any]:
    """Marks a mission completed, updates topic confidence, and schedules revisions."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Update daily mission
    cursor.execute("UPDATE daily_missions SET is_completed = 1 WHERE id = ?", (mission_id,))

    # 2. Update syllabus topic confidence and status
    cursor.execute("""
        UPDATE syllabus_topics 
        SET status = 'completed', confidence_score = ? 
        WHERE id = ?
    """, (confidence, topic_id))

    conn.commit()
    conn.close()

    # 3. Schedule spaced repetition revision
    scheduled_revision_date = schedule_spaced_repetition(topic_id, confidence)

    # 4. Award rewards (XP and Coins)
    rewards_result = award_rewards(user_id=1, xp_amount=120, coin_amount=15)

    # 5. Handle dynamic tomorrow replanning (workload adjustment)
    adjust_tomorrow_workload(confidence)

    # 6. Generate and save diagnostic coach message
    active_exam = get_active_exam()
    if active_exam:
        generate_coaching_message(active_exam["id"], user_id=1, last_completed_topic_id=topic_id, last_confidence=confidence)

    return {
        "scheduled_revision_date": scheduled_revision_date,
        "rewards": rewards_result
    }

def adjust_tomorrow_workload(confidence: int):
    """Adjusts tomorrow's study mission hours dynamically based on confidence."""
    conn = get_db_connection()
    cursor = conn.cursor()
    tomorrow_str = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    cursor.execute("SELECT id, duration_hours FROM daily_missions WHERE date = ? AND is_completed = 0 LIMIT 1", (tomorrow_str,))
    tomorrow_mission = cursor.fetchone()

    if tomorrow_mission:
        m_id = tomorrow_mission["id"]
        current_hours = tomorrow_mission["duration_hours"]
        
        # High confidence decreases tomorrow's load, low confidence increases it
        if confidence >= 5:
            new_hours = max(1.0, current_hours - 0.5) # cut 30 mins
        elif confidence <= 2:
            new_hours = current_hours + 0.5 # add 30 mins
        else:
            new_hours = current_hours

        cursor.execute("UPDATE daily_missions SET duration_hours = ? WHERE id = ?", (new_hours, m_id))
        conn.commit()

    conn.close()

def generate_coaching_message(exam_id: int, user_id: int, last_completed_topic_id: Optional[int] = None, last_confidence: Optional[int] = None) -> str:
    """Generates a contextual, progress-aware coaching message using MCP memory signals."""
    from utils.mcp_client import call_get_student_context
    
    # Fetch student context from MCP Client
    context_str = call_get_student_context()
    try:
        context = json.loads(context_str)
    except Exception:
        context = {}
        
    weak_topics = context.get("weak_topics", [])
    completed_count = context.get("completed_topics_count", 0)
    missed_sessions = context.get("missed_sessions_count", 0)
    daily_hours = context.get("preferred_daily_hours", 2.0)
    
    exam = get_active_exam()
    countdown = exam["countdown_days"] if exam else 30
    exam_name = exam["name"] if exam else "Exam"

    conn = get_db_connection()
    cursor = conn.cursor()

    # Draft specific recommendation text
    if last_completed_topic_id and last_confidence:
        cursor.execute("SELECT name FROM syllabus_topics WHERE id = ?", (last_completed_topic_id,))
        row = cursor.fetchone()
        topic_name = row["name"] if row else "Topic"
        
        if last_confidence <= 2:
            coach_text = f"Your confidence for '{topic_name}' was low ({last_confidence}/5), so I scheduled the next review earlier and kept tomorrow's workload under {daily_hours} hours."
        elif last_confidence == 3:
            coach_text = f"'{topic_name}' is complete with moderate confidence (3/5). I scheduled review in 3 days. Tomorrow's workload has been adjusted to protect your {daily_hours}-hour study limit."
        else:
            coach_text = f"Masterful job! '{topic_name}' completed with 5/5 confidence. I've scheduled your review in 7 days and trimmed 30 mins off tomorrow's mission so you can pace yourself."
    elif missed_sessions > 0:
        coach_text = f"I notice you skipped {missed_sessions} sessions recently. Tomorrow's workload has been adjusted to ease you back into the flow. You completed {completed_count} topics so far."
    elif len(weak_topics) > 0:
        weak_name = weak_topics[0]["name"]
        coach_text = f"You completed {completed_count} topics, but your confidence for '{weak_name}' was low. I recommend reviewing it before we proceed."
    else:
        coach_text = f"Your current pace predicts completion before the exam! Keep it up: {countdown} days remaining, with {completed_count} topics successfully completed."

    # Save to database
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO coaching_messages (content, type, timestamp)
        VALUES (?, 'strategic', ?)
    """, (coach_text, now_str))

    conn.commit()
    conn.close()

    return coach_text

def reset_biology_demo() -> Dict[str, Any]:
    """Clears all existing database state and seeds the Biology 30-day exam quest."""
    # Reset/Init Tables
    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Truncate tables by deleting all data
    cursor.execute("DELETE FROM daily_missions")
    cursor.execute("DELETE FROM revisions")
    cursor.execute("DELETE FROM syllabus_topics")
    cursor.execute("DELETE FROM exams")
    cursor.execute("DELETE FROM coaching_messages")
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM agent_traces")
    
    # 1. Seed user profile: level 1, 380 XP, 40 coins, streak 4
    yesterday_str = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    cursor.execute("""
        INSERT INTO users (id, level, xp, coins, daily_streak, weekly_streak, last_active)
        VALUES (1, 1, 380, 40, 4, 1, ?)
    """, (yesterday_str,))

    # 2. Seed active exam: Biology in 30 days, 2 hours/day
    exam_date = date.today() + timedelta(days=30)
    exam_date_str = exam_date.strftime("%Y-%m-%d")
    cursor.execute("""
        INSERT INTO exams (id, name, date, daily_hours, syllabus)
        VALUES (1, 'Biology', ?, 2.0, 'Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology')
    """, (exam_date_str,))
    exam_id = 1

    # 3. Seed topics: Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology
    topics = ["Cell Division", "Genetics", "Human Reproduction", "Evolution", "Ecology", "Biotechnology"]
    for idx, t_name in enumerate(topics):
        cursor.execute("""
            INSERT INTO syllabus_topics (id, exam_id, name, status, confidence_score, order_index)
            VALUES (?, ?, ?, 'pending', 0, ?)
        """, (idx + 1, exam_id, t_name, idx))

    # 4. Seed daily missions
    current_date = date.today()
    for idx, t_name in enumerate(topics):
        cursor.execute("""
            INSERT INTO daily_missions (exam_id, topic_id, title, date, duration_hours, is_completed)
            VALUES (?, ?, ?, ?, 2.0, 0)
        """, (exam_id, idx + 1, f"Study {t_name}", current_date.strftime("%Y-%m-%d")))
        current_date += timedelta(days=5) # spread over 30 days

    # 5. Seed initial welcome coach message
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    welcome_text = "Welcome to the Biology Study Quest! Your 30-day roadmap is set. Today's primary mission: 'Study Cell Division'. Your current pace predicts completion before the exam."
    cursor.execute("""
        INSERT INTO coaching_messages (content, type, timestamp)
        VALUES (?, 'general', ?)
    """, (welcome_text, now_str))

    # Reset achievements unlocks
    cursor.execute("UPDATE achievements SET is_unlocked = 0, unlocked_at = NULL")

    # Seed initial planner agent trace
    cursor.execute("""
        INSERT INTO agent_traces (agent_name, action, output_summary, timestamp)
        VALUES ('Planner Agent', 'Initialized biology study roadmap', 'Divided Biology syllabus into 6 topics over 30 days.', ?)
    """, (now_str,))

    conn.commit()
    conn.close()

    return {
        "status": "success",
        "streak_seeded": 4,
        "xp_seeded": 380,
        "exam": "Biology"
    }

def clear_study_plan() -> Dict[str, Any]:
    """Clears the active study plan pointer to reset the setup wizard without deleting history."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Update active_exam_id in study_memory to -1
    cursor.execute("""
        INSERT INTO study_memory (key, value)
        VALUES ('active_exam_id', '-1')
        ON CONFLICT(key) DO UPDATE SET value = '-1'
    """)
    
    # Also reset the active user profile stats (xp, level, coins, daily_streak) for the new quest
    cursor.execute("UPDATE users SET level = 1, xp = 0, coins = 0, daily_streak = 0, weekly_streak = 0, last_active = NULL")
    cursor.execute("UPDATE achievements SET is_unlocked = 0, unlocked_at = NULL")
    
    conn.commit()
    conn.close()
    return {"status": "success"}
