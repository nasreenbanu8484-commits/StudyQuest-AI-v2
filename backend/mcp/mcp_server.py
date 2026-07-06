import sys
import os
import json
from datetime import datetime, date

# Save original path
original_path = list(sys.path)

# Temporarily remove paths that resolve to local folders named 'mcp'
# to force python to load the third-party library from site-packages.
mcp_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(mcp_dir)
sys.path = [p for p in sys.path if p not in (mcp_dir, backend_dir, "")]

# Import third-party FastMCP
from mcp.server.fastmcp import FastMCP

# Restore sys.path and add backend dir for local imports
sys.path = original_path
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# Local imports
from services.db import get_db_connection, set_memory_value, get_memory_value, list_all_memories
from services.spaced_rep_service import schedule_spaced_repetition
from services.study_service import get_active_exam

mcp = FastMCP("StudyQuest-AI-MCP")

@mcp.tool()
def save_study_memory(key: str, value: str) -> str:
    """Stores or updates a study memory parameter key-value pair in persistent storage.
    
    Args:
        key: The configuration name or identifier (e.g. 'preferred_hours', 'weak_topics').
        value: The text or JSON string to store.
        
    Returns:
        Confirmation message.
    """
    try:
        set_memory_value(key, value)
        return f"Successfully saved memory key '{key}' = '{value}'."
    except Exception as e:
        return f"Error saving study memory: {str(e)}"

@mcp.tool()
def get_study_memory(key: str) -> str:
    """Retrieves a study memory parameter value by its identifier.
    
    Args:
        key: The configuration name or identifier.
        
    Returns:
        The value if found, or a message indicating it was not found.
    """
    try:
        val = get_memory_value(key)
        if val is None:
            return f"Memory key '{key}' not found."
        return val
    except Exception as e:
        return f"Error retrieving study memory: {str(e)}"

@mcp.tool()
def list_study_memories() -> str:
    """Retrieves all saved key-value metrics from persistent study memory.
    
    Returns:
        JSON string representing all memories list.
    """
    try:
        memories = list_all_memories()
        return json.dumps(memories, indent=2)
    except Exception as e:
        return f"Error listing memories: {str(e)}"

@mcp.tool()
def schedule_revision(topic_id: int, confidence: int) -> str:
    """Schedules a spaced repetition revision task for a completed syllabus topic.
    
    Args:
        topic_id: ID of the syllabus topic database row.
        confidence: Student comprehension score (1 to 5).
        
    Returns:
        Confirmation message with the scheduled date.
    """
    try:
        target_date = schedule_spaced_repetition(topic_id, confidence)
        return f"Successfully scheduled revision for Topic ID {topic_id} on {target_date} based on confidence {confidence}/5."
    except Exception as e:
        return f"Error scheduling revision: {str(e)}"

@mcp.tool()
def list_due_revisions() -> str:
    """Lists all study revisions due today or past.
    
    Returns:
        A list of due revision topics and scheduled dates.
    """
    try:
        conn = get_db_connection()
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
            return "No revisions are currently due! You are up to date."
            
        results = ["Due Revisions:"]
        for r in rows:
            results.append(f"- {r['topic_name']} (Due Date: {r['scheduled_date']}, Revision ID: {r['id']})")
            
        return "\n".join(results)
    except Exception as e:
        return f"Error listing due revisions: {str(e)}"

@mcp.tool()
def record_session_event(event_type: str, details: str) -> str:
    """Records a study event or notification in the coaching messages feed.
    
    Args:
        event_type: The category of event (e.g. 'session_complete', 'warning', 'streak').
        details: Explanation or log details of the event.
        
    Returns:
        Confirmation message.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.execute("""
            INSERT INTO coaching_messages (content, type, timestamp)
            VALUES (?, ?, ?)
        """, (details, event_type, now_str))
        conn.commit()
        conn.close()
        return f"Successfully recorded session event of type '{event_type}'."
    except Exception as e:
        return f"Error logging session event: {str(e)}"

@mcp.tool()
def get_student_context() -> str:
    """Aggregates student context metrics including preferred hours, weak topics, and progress.
    
    Returns:
        JSON string representing student profile context and diagnostics.
    """
    try:
        # Get active exam
        exam = get_active_exam()
        exam_name = exam["name"] if exam else "None"
        pref_hours = exam["daily_hours"] if exam else 2.0
        
        # Override preferred hours if customized in memory
        pref_hours_mem = get_memory_value("preferred_hours")
        if pref_hours_mem:
            try:
                pref_hours = float(pref_hours_mem)
            except ValueError:
                pass
                
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Weak topics: completed topics with confidence <= 2
        cursor.execute("""
            SELECT name, confidence_score 
            FROM syllabus_topics 
            WHERE status = 'completed' AND confidence_score <= 2
        """)
        weak_topics = [dict(row) for row in cursor.fetchall()]
        
        # Completed topics count
        cursor.execute("SELECT COUNT(*) FROM syllabus_topics WHERE status = 'completed'")
        completed_count = cursor.fetchone()[0]
        
        # Missed sessions count (missions due before today that are not completed)
        today_str = date.today().strftime("%Y-%m-%d")
        cursor.execute("SELECT COUNT(*) FROM daily_missions WHERE date < ? AND is_completed = 0", (today_str,))
        missed_sessions = cursor.fetchone()[0]
        
        # Streak
        cursor.execute("SELECT daily_streak FROM users WHERE id = 1")
        row = cursor.fetchone()
        streak = row["daily_streak"] if row else 0
        
        conn.close()
        
        context = {
            "active_exam": exam_name,
            "preferred_daily_hours": pref_hours,
            "completed_topics_count": completed_count,
            "weak_topics": weak_topics,
            "missed_sessions_count": missed_sessions,
            "streak_days": streak,
            "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return json.dumps(context, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    mcp.run()
