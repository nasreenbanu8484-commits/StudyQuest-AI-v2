from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types
from agents.tools import schedule_spaced_revisions_tool
from services.db import add_agent_trace

revision_agent = Agent(
    name="revision_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""
    You are the Revision Agent for StudyQuest AI.
    Calculate spaced repetition intervals based on the student confidence rating and schedule upcoming review sessions.
    """,
    tools=[schedule_spaced_revisions_tool],
    description="Schedules spaced repetition review tasks."
)

def revision_fallback(topic_id: int, confidence: int) -> dict:
    """Fallback handler for spaced repetition reviews in local/demo mode."""
    result = schedule_spaced_revisions_tool(topic_id, confidence)
    
    # Resolve topic name for trace log
    from services.db import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM syllabus_topics WHERE id = ?", (topic_id,))
    row = cursor.fetchone()
    topic_name = row["name"] if row else "Current Topic"
    conn.close()

    # Dynamic interval text based on confidence scale (Phase 2):
    # Confidence 1: 1 day, 2: 2 days, 3: 3 days, 4: 5 days, 5: 7 days
    if confidence == 1:
        days = 1
    elif confidence == 2:
        days = 2
    elif confidence == 3:
        days = 3
    elif confidence == 4:
        days = 5
    else:
        days = 7

    add_agent_trace(
        agent_name="Revision Agent",
        action="Scheduled spaced repetition",
        output_summary=f"Next review of '{topic_name}' scheduled in {days} days ({result['scheduled_date']}) based on confidence {confidence}/5."
    )
    return result
