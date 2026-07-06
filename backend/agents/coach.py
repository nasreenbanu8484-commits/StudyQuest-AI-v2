from typing import Optional
from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types
from agents.tools import generate_coach_insight_tool
from services.db import add_agent_trace

coach_agent = Agent(
    name="coach_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""
    You are the Coach Agent for StudyQuest AI.
    Evaluate the overall student roadmap metrics and compose context-aware advising notes.
    """,
    tools=[generate_coach_insight_tool],
    description="Composes strategic and diagnostic advising notes."
)

def coach_fallback(exam_id: int, user_id: int, last_topic_id: Optional[int] = None, last_confidence: Optional[int] = None) -> dict:
    """Fallback handler for coaching updates in local/demo mode."""
    result = generate_coach_insight_tool(exam_id, user_id, last_topic_id, last_confidence)
    
    add_agent_trace(
        agent_name="Coach Agent",
        action="Generated coaching insight",
        output_summary=f"Insight compiled: '{result['message']}'"
    )
    return result
