from typing import Dict, Any, Optional
import sys
import os

# Add parent directory to system path to allow local imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services import study_service, spaced_rep_service, gamification_service, db

def create_study_roadmap_tool(
    name: str, 
    exam_date: str, 
    daily_hours: float, 
    syllabus: Optional[str] = None, 
    reminder_time: str = "19:00", 
    student_name: Optional[str] = None,
    grade: Optional[str] = None,
    session_duration: Optional[int] = 45,
    break_duration: Optional[int] = 10,
    score_target: Optional[int] = None,
    rank_target: Optional[str] = None,
    daily_goal: Optional[str] = None,
    weekly_goal: Optional[str] = None,
    edit_exam_id: Optional[int] = None
) -> Dict[str, Any]:
    """Compiles a study plan and divides the syllabus topics across available days.
    
    Args:
        name: Name of the exam (e.g. 'Biology').
        exam_date: Exam target date in ISO YYYY-MM-DD format.
        daily_hours: Daily study time allocation in hours.
        syllabus: List of syllabus topics as comma-separated text.
        reminder_time: Preferred study reminder time.
        student_name: Optional student name.
        grade: Optional grade.
        session_duration: Focus duration.
        break_duration: Break duration.
        score_target: Target score.
        rank_target: Target rank.
        daily_goal: Daily goal.
        weekly_goal: Weekly goal.
        edit_exam_id: Exam being edited.
        
    Returns:
        A dict with status, exam_id, and topics_created counts.
    """
    result = study_service.create_study_roadmap(
        name, exam_date, daily_hours, syllabus, reminder_time, student_name,
        grade, session_duration, break_duration, score_target, rank_target,
        daily_goal, weekly_goal, edit_exam_id
    )
    return {"status": "success", "exam_id": result["exam_id"], "topics_created": result["topics_created"]}

def mark_session_complete_tool(mission_id: Optional[int], topic_id: int, confidence: int, actual_hours: float) -> Dict[str, Any]:
    """Marks a daily study mission as completed and updates topic status.
    
    Args:
        mission_id: ID of the daily mission database row.
        topic_id: ID of the topic.
        confidence: Student comprehension score (1 to 5).
        actual_hours: Hours spent on study.
        
    Returns:
        A dict confirming success.
    """
    if mission_id:
        conn = db.get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE daily_missions SET is_completed = 1 WHERE id = ?", (mission_id,))
        conn.commit()
        conn.close()
        
    conn = db.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE syllabus_topics SET status = 'completed', confidence_score = ? WHERE id = ?", (confidence, topic_id))
    conn.commit()
    conn.close()
    
    return {"status": "success", "topic_id": topic_id, "confidence": confidence}

def schedule_spaced_revisions_tool(topic_id: int, confidence: int) -> Dict[str, Any]:
    """Schedules upcoming review intervals for a completed topic.
    
    Args:
        topic_id: Topic ID.
        confidence: Student confidence score (1 to 5).
        
    Returns:
        Scheduled review date.
    """
    scheduled_date = spaced_rep_service.schedule_spaced_repetition(topic_id, confidence)
    return {"status": "success", "scheduled_date": scheduled_date}

def update_gamification_tool(user_id: int, xp_amount: int, coin_amount: int) -> Dict[str, Any]:
    """Awards XP, coins, and updates streak indicators.
    
    Args:
        user_id: User ID.
        xp_amount: Amount of XP to award.
        coin_amount: Amount of coins to award.
        
    Returns:
        Dict showing updated XP, level, coins, and streaks.
    """
    result = gamification_service.award_rewards(user_id, xp_amount, coin_amount)
    return {"status": "success", "rewards": result}

def replan_future_missions_tool(confidence: int) -> Dict[str, Any]:
    """Adjusts tomorrow's workload duration based on today's confidence rating.
    
    Args:
        confidence: Today's confidence level.
        
    Returns:
        Status message.
    """
    study_service.adjust_tomorrow_workload(confidence)
    return {"status": "success", "workload_adjusted": True}

def generate_coach_insight_tool(exam_id: int, user_id: int, last_topic_id: Optional[int] = None, last_confidence: Optional[int] = None) -> Dict[str, Any]:
    """Composes a progress-aware coaching log entry.
    
    Args:
        exam_id: ID of active exam.
        user_id: ID of user.
        last_topic_id: Optional completed topic ID.
        last_confidence: Optional completed confidence.
        
    Returns:
        Coaching message content.
    """
    message = study_service.generate_coaching_message(exam_id, user_id, last_topic_id, last_confidence)
    return {"status": "success", "message": message}
