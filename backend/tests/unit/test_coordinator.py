import pytest
import sys
import os
from datetime import date, datetime, timedelta

# Add parent directory to system path to allow local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from services.db import init_db, get_recent_traces
from services.study_service import reset_biology_demo, parse_syllabus_text, generate_coaching_message
from services.spaced_rep_service import schedule_spaced_repetition
from services.gamification_service import award_rewards
from agents.coordinator import run_session_complete_workflow
from utils.mcp_client import call_save_study_memory, call_get_study_memory

@pytest.fixture(autouse=True)
def setup_database():
    """Initializes the database before running each test case."""
    init_db()
    reset_biology_demo()

def test_syllabus_topic_extraction():
    """Tests parsing comma-separated and line-separated syllabus text."""
    raw_text = "Topic A\nTopic B, Topic C\nTopic A\n\nTopic D"
    candidates = parse_syllabus_text(raw_text)
    
    assert len(candidates) == 4
    assert candidates == ["Topic A", "Topic B", "Topic C", "Topic D"]

def test_mcp_memory_save_get():
    """Tests save and retrieval of student key-value parameters via MCP Client."""
    res_save = call_save_study_memory("preferred_hours", "3.5")
    assert "preferred_hours" in res_save
    
    res_get = call_get_study_memory("preferred_hours")
    assert res_get == "3.5"

def test_revision_scheduling_limits():
    """Tests that scheduled revisions do not exceed the target exam date."""
    # Seed an exam due in 3 days
    from services.db import get_db_connection
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Truncate and seed active exam
    cursor.execute("DELETE FROM exams")
    exam_date = date.today() + timedelta(days=3)
    cursor.execute("""
        INSERT INTO exams (id, name, date, daily_hours)
        VALUES (1, 'Test Exam', ?, 2.0)
    """, (exam_date.strftime("%Y-%m-%d"),))
    conn.commit()
    conn.close()
    
    # Schedule with confidence 5 (would ordinarily trigger 7 days ahead)
    revision_date_str = schedule_spaced_repetition(topic_id=1, confidence=5)
    revision_date = datetime.strptime(revision_date_str, "%Y-%m-%d").date()
    
    # Assert that the revision date was capped to be before the exam date
    assert revision_date < exam_date

def test_coach_message_uses_memory_signals():
    """Tests that the coaching advisor adapts recommendations based on user confidence levels."""
    # Log a session complete with confidence 2 (low confidence)
    run_session_complete_workflow(mission_id=101, topic_id=1, confidence=2, actual_hours=2.0)
    
    msg = generate_coaching_message(exam_id=1, user_id=1, last_completed_topic_id=1, last_confidence=2)
    assert "low" in msg.lower() or "confidence" in msg.lower()

def test_revision_scheduling_by_confidence():
    """Tests dynamic revision scheduling offsets based on confidence score values."""
    date_1 = schedule_spaced_repetition(topic_id=1, confidence=1)
    date_3 = schedule_spaced_repetition(topic_id=2, confidence=3)
    date_5 = schedule_spaced_repetition(topic_id=3, confidence=5)
    
    assert date_1 != date_3
    assert date_3 != date_5

def test_motivation_rewards_updating():
    """Tests XP and level upgrades upon session completions."""
    res = award_rewards(user_id=1, xp_amount=120, coin_amount=15)
    assert res["xp"] == 500
    assert res["coins"] == 55
    assert res["daily_streak"] == 5
    assert res["level_up"] is True

def test_coordinator_workflow_and_traces():
    """Tests the full multi-agent completion execution flow and trace logging outputs."""
    run_session_complete_workflow(mission_id=101, topic_id=1, confidence=3, actual_hours=2.0)
    
    traces = get_recent_traces(10)
    agent_names = [t["agent_name"] for t in traces]
    
    assert any("Execution Agent" in name for name in agent_names)
    assert any("Revision Agent" in name for name in agent_names)
    assert any("Motivation Agent" in name for name in agent_names)
    assert any("Planner Agent" in name for name in agent_names)
    assert any("Coach Agent" in name for name in agent_names)
