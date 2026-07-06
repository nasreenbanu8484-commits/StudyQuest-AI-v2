import sys
import os
import logging
import json
from datetime import datetime, date

# Save original path
original_path = list(sys.path)

# Resolve paths
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
mcp_dir = os.path.join(backend_dir, "mcp")

# Setup sys path to find local mcp_server module
sys.path = [p for p in sys.path if p not in (mcp_dir, backend_dir, "")]
if mcp_dir not in sys.path:
    sys.path.append(mcp_dir)

import importlib
try:
    mcp_server = importlib.import_module("mcp_server")
    MCP_AVAILABLE = True
    print("StudyQuest MCP Client: Connection to local MCP tools verified.")
except Exception as e:
    logging.warning(f"StudyQuest MCP Client: Local MCP tools unavailable ({str(e)}). Direct service fallback active.")
    MCP_AVAILABLE = False
finally:
    # Restore original path
    sys.path = original_path

# Fallback implementations in case MCP module fails to load
from services import db, spaced_rep_service, study_service

def call_save_study_memory(key: str, value: str) -> str:
    """Invokes save_study_memory MCP tool, falling back to local DB if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.save_study_memory(key, value)
        except Exception as e:
            logging.warning(f"MCP save_study_memory tool error: {str(e)}. Falling back.")
            
    # Fallback
    try:
        db.set_memory_value(key, value)
        return f"[Fallback] Saved memory key '{key}' = '{value}'."
    except Exception as err:
        return f"Error in fallback study memory save: {str(err)}"

def call_get_study_memory(key: str) -> str:
    """Invokes get_study_memory MCP tool, falling back to local DB if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.get_study_memory(key)
        except Exception as e:
            logging.warning(f"MCP get_study_memory tool error: {str(e)}. Falling back.")
            
    # Fallback
    val = db.get_memory_value(key)
    if val is None:
        return f"Memory key '{key}' not found."
    return val

def call_list_study_memories() -> str:
    """Invokes list_study_memories MCP tool, falling back to local DB if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.list_study_memories()
        except Exception as e:
            logging.warning(f"MCP list_study_memories tool error: {str(e)}. Falling back.")
            
    # Fallback
    try:
        memories = db.list_all_memories()
        return json.dumps(memories)
    except Exception as err:
        return json.dumps({"error": str(err)})

def call_schedule_revision(topic_id: int, confidence: int) -> str:
    """Invokes schedule_revision MCP tool, falling back to local service if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.schedule_revision(topic_id, confidence)
        except Exception as e:
            logging.warning(f"MCP schedule_revision tool error: {str(e)}. Falling back.")
            
    # Fallback
    try:
        dt = spaced_rep_service.schedule_spaced_repetition(topic_id, confidence)
        return f"[Fallback] Scheduled revision for Topic {topic_id} on {dt}."
    except Exception as err:
        return f"Error in fallback schedule: {str(err)}"

def call_list_due_revisions() -> str:
    """Invokes list_due_revisions MCP tool, falling back to local DB if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.list_due_revisions()
        except Exception as e:
            logging.warning(f"MCP list_due_revisions tool error: {str(e)}. Falling back.")
            
    # Fallback
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        today_str = date.today().strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT r.id, r.scheduled_date, t.name as topic_name 
            FROM revisions r
            JOIN syllabus_topics t ON r.topic_id = t.id
            WHERE r.is_completed = 0 AND r.scheduled_date <= ?
            ORDER BY r.scheduled_date ASC
        """, (today_str,))
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return "No revisions are currently due!"
            
        results = ["Due Revisions:"]
        for r in rows:
            results.append(f"- {r['topic_name']} (Due: {r['scheduled_date']})")
        return "\n".join(results)
    except Exception as err:
        return f"Error: {str(err)}"

def call_record_session_event(event_type: str, details: str) -> str:
    """Invokes record_session_event MCP tool, falling back to local DB if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.record_session_event(event_type, details)
        except Exception as e:
            logging.warning(f"MCP record_session_event tool error: {str(e)}. Falling back.")
            
    # Fallback
    try:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO coaching_messages (content, type, timestamp)
            VALUES (?, ?, ?)
        """, (details, event_type, now_str))
        conn.commit()
        conn.close()
        return f"[Fallback] Logged event of type '{event_type}'."
    except Exception as err:
        return f"Error: {str(err)}"

def call_get_student_context() -> str:
    """Invokes get_student_context MCP tool, falling back to local analysis if unavailable."""
    if MCP_AVAILABLE:
        try:
            return mcp_server.get_student_context()
        except Exception as e:
            logging.warning(f"MCP get_student_context tool error: {str(e)}. Falling back.")
            
    # Fallback
    try:
        exam = study_service.get_active_exam()
        exam_name = exam["name"] if exam else "None"
        pref_hours = exam["daily_hours"] if exam else 2.0
        
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT name, confidence_score 
            FROM syllabus_topics 
            WHERE status = 'completed' AND confidence_score <= 2
        """)
        weak_topics = [dict(row) for row in cursor.fetchall()]
        
        cursor.execute("SELECT COUNT(*) FROM syllabus_topics WHERE status = 'completed'")
        completed_count = cursor.fetchone()[0]
        
        today_str = date.today().strftime("%Y-%m-%d")
        cursor.execute("SELECT COUNT(*) FROM daily_missions WHERE date < ? AND is_completed = 0", (today_str,))
        missed_sessions = cursor.fetchone()[0]
        
        conn.close()
        
        context = {
            "active_exam": exam_name,
            "preferred_daily_hours": pref_hours,
            "completed_topics_count": completed_count,
            "weak_topics": weak_topics,
            "missed_sessions_count": missed_sessions,
            "streak_days": 4,
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        return json.dumps(context)
    except Exception as err:
        return json.dumps({"error": str(err)})
