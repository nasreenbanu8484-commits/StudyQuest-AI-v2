import os
from google.adk.agents import SequentialAgent
from agents.planner import planner_agent, planner_fallback
from agents.execution import execution_agent, execution_fallback
from agents.revision import revision_agent, revision_fallback
from agents.motivation import motivation_agent, motivation_fallback
from agents.coach import coach_agent, coach_fallback
from agents.tools import replan_future_missions_tool
from services.db import add_agent_trace, get_db_connection

def is_api_key_configured() -> bool:
    """Checks if the Gemini API Key is configured for live LLM execution."""
    key = os.getenv("GEMINI_API_KEY")
    return bool(key and key != "" and key != "your-api-key-here" and "your_gemini" not in key.lower())

coordinator_agent = SequentialAgent(
    name="study_quest_coordinator",
    sub_agents=[
        planner_agent,
        execution_agent,
        revision_agent,
        motivation_agent,
        coach_agent
    ],
    description="The main coordinator agent for StudyQuest AI study coaching operations."
)

def run_create_plan_workflow(
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
    """Orchestrates the plan generation workflow via ADK or deterministic fallbacks."""
    if is_api_key_configured():
        # Live ADK code execution (if API key is present)
        # Note: In a fully configured env, we'd invoke:
        # runner.run_async(...) or similar. We isolate it here.
        pass

    # Deterministic local fallback
    print("StudyQuest Coordinator: Running in local fallback mode (Planner).")
    result = planner_fallback(
        name, exam_date, daily_hours, syllabus, reminder_time, student_name,
        grade, session_duration, break_duration, score_target, rank_target,
        daily_goal, weekly_goal, edit_exam_id
    )
    return result

def run_session_complete_workflow(mission_id: int, topic_id: int, confidence: int, actual_hours: float) -> dict:
    """Runs the sequential 5-agent study completion workflow.
    
    Order:
    1. Execution Agent: Marks topic complete.
    2. Revision Agent: Calculates spaced repetition date.
    3. Motivation Agent: Awards XP (+120), coins (+15), and updates streaks.
    4. Planner Agent: Re-plans and adjusts tomorrow's workload based on confidence.
    5. Coach Agent: Assesses readiness and writes progress advisory insight.
    """
    print("StudyQuest Coordinator: Running in local fallback mode (Session Complete).")
    
    # 1. Execution Agent
    exec_res = execution_fallback(mission_id, topic_id, confidence, actual_hours)
    
    # 2. Revision Agent
    rev_res = revision_fallback(topic_id, confidence)
    
    # 3. Motivation Agent
    mot_res = motivation_fallback(user_id=1, xp_amount=120, coin_amount=15)
    
    # 4. Planner Agent (re-planning)
    replan_future_missions_tool(confidence)
    # Write Planner Agent re-plan trace log
    if confidence >= 4:
        planner_action = "Trimming tomorrow's mission"
        planner_summary = "Reduced tomorrow's study load by 30 mins because of student mastery."
    elif confidence <= 2:
        planner_action = "Reinforcing tomorrow's workload"
        planner_summary = "Increased tomorrow's study load by 30 mins to reinforce low confidence topics."
    else:
        planner_action = "Maintaining schedule"
        planner_summary = "Tomorrow's workload kept at standard duration (protected study limit)."
        
    add_agent_trace(
        agent_name="Planner Agent",
        action=planner_action,
        output_summary=planner_summary
    )
    
    # Resolve active exam id
    from services.study_service import get_active_exam
    active_exam = get_active_exam()
    exam_id = active_exam["id"] if active_exam else 1

    # 5. Coach Agent
    coach_res = coach_fallback(exam_id, user_id=1, last_topic_id=topic_id, last_confidence=confidence)

    return {
        "execution": exec_res,
        "revision": rev_res,
        "motivation": mot_res,
        "coach": coach_res
    }
