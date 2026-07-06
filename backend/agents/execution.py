from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types
from agents.tools import mark_session_complete_tool
from services.db import add_agent_trace

execution_agent = Agent(
    name="execution_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""
    You are the Execution Agent for StudyQuest AI.
    Verify when a daily study session is completed by the student and mark the mission complete in the database.
    """,
    tools=[mark_session_complete_tool],
    description="Tracks daily mission progress and session completions."
)

def execution_fallback(mission_id: int, topic_id: int, confidence: int, actual_hours: float) -> dict:
    """Fallback handler for marking sessions complete in local/demo mode."""
    result = mark_session_complete_tool(mission_id, topic_id, confidence, actual_hours)
    
    # Resolve topic name for trace log
    from services.db import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM syllabus_topics WHERE id = ?", (topic_id,))
    row = cursor.fetchone()
    topic_name = row["name"] if row else "Current Topic"
    conn.close()

    add_agent_trace(
        agent_name="Execution Agent",
        action="Marked session complete",
        output_summary=f"Completed '{topic_name}' session. Time spent: {actual_hours} hours, Confidence: {confidence}/5."
    )
    return result
