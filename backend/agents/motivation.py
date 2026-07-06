from google.adk.agents import Agent
from google.adk.models import Gemini
from google.genai import types
from agents.tools import update_gamification_tool
from services.db import add_agent_trace

motivation_agent = Agent(
    name="motivation_agent",
    model=Gemini(
        model="gemini-flash-latest",
        retry_options=types.HttpRetryOptions(attempts=3),
    ),
    instruction="""
    You are the Motivation Agent for StudyQuest AI.
    Update the student's XP metrics, level statuses, coins registers, and streaks. Check for achievements to unlock.
    """,
    tools=[update_gamification_tool],
    description="Manages engagement metrics, streak calculations, level milestones, and unlocks badges."
)

def motivation_fallback(user_id: int, xp_amount: int, coin_amount: int) -> dict:
    """Fallback handler for gamification progress in local/demo mode."""
    result = update_gamification_tool(user_id, xp_amount, coin_amount)
    rewards = result.get("rewards", {})
    
    summary = f"Awarded +{xp_amount} XP, +{coin_amount} Coins. Streak: {rewards.get('daily_streak', 4)} days."
    if rewards.get("level_up", False):
        summary += f" LEVEL UP to Level {rewards.get('level', 2)}!"
        
    add_agent_trace(
        agent_name="Motivation Agent",
        action="Awarded rewards",
        output_summary=summary
    )
    return result
