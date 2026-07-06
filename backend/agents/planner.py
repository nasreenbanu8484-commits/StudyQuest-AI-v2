from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types
from agents.tools import create_study_roadmap_tool
from services.db import add_agent_trace

planner_agent = Agent(
    name="planner_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""
    You are the Planner Agent for StudyQuest AI.
    Given exam targets, divide the syllabus topics across the available days leading to the exam,
    leaving a buffer for review.
    """,
    tools=[create_study_roadmap_tool],
    description="Estimates workload, splits syllabus topics, and writes roadmaps."
)

def planner_fallback(
    name: str, 
    exam_date: str, 
    daily_hours: float, 
    syllabus: str = None, 
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
) -> dict:
    """Fallback compiler for planning roadmaps in local/demo mode."""
    result = create_study_roadmap_tool(
        name, exam_date, daily_hours, syllabus, reminder_time, student_name,
        grade, session_duration, break_duration, score_target, rank_target,
        daily_goal, weekly_goal, edit_exam_id
    )
    add_agent_trace(
        agent_name="Planner Agent",
        action="Compiled study roadmap",
        output_summary=f"Plan generated for '{name}' exam. Seeded {result['topics_created']} syllabus topics."
    )
    return result
