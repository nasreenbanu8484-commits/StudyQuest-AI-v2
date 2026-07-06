from pydantic import BaseModel, Field
from typing import List, Optional

class SetupExamRequest(BaseModel):
    name: str = Field(..., description="Name of the exam (e.g. Biology)")
    date: str = Field(..., description="Date of the exam (YYYY-MM-DD)")
    daily_hours: float = Field(2.0, description="Available daily study hours")
    syllabus: Optional[str] = Field(None, description="Optional text representing the syllabus")
    reminder_time: str = Field("19:00", description="Preferred study reminder time (HH:MM)")
    student_name: Optional[str] = Field(None, description="Optional student name")
    grade: Optional[str] = Field(None, description="Optional class/grade")
    session_duration: Optional[int] = Field(45, description="Focus session duration in minutes")
    break_duration: Optional[int] = Field(10, description="Break duration in minutes")
    score_target: Optional[int] = Field(None, description="Optional score target %")
    rank_target: Optional[str] = Field(None, description="Optional rank target")
    daily_goal: Optional[str] = Field(None, description="Optional daily goal")
    weekly_goal: Optional[str] = Field(None, description="Optional weekly goal")
    edit_exam_id: Optional[int] = Field(None, description="Optional ID of exam being edited to preserve progress")

class SwitchPlanRequest(BaseModel):
    exam_id: int

class DuplicatePlanRequest(BaseModel):
    exam_id: int

class ArchivePlanRequest(BaseModel):
    exam_id: int

class DeletePlanRequest(BaseModel):
    exam_id: int

class CompleteSessionRequest(BaseModel):
    mission_id: Optional[int] = Field(None, description="Optional ID of the completed daily mission")
    revision_id: Optional[int] = Field(None, description="Optional ID of the completed revision")
    topic_id: int = Field(..., description="ID of the related topic")
    confidence: int = Field(..., description="User confidence score from 1 (lowest) to 5 (highest)")
    actual_hours: float = Field(..., description="Actual study time spent in hours")

class PomodoroLogRequest(BaseModel):
    mission_id: Optional[int] = None
    duration_minutes: int = 25

class UserProfile(BaseModel):
    level: int
    xp: int
    coins: int
    daily_streak: int
    weekly_streak: int
    last_active: Optional[str]

class ExamInfo(BaseModel):
    id: int
    name: str
    date: str
    daily_hours: float
    countdown_days: int

class TopicInfo(BaseModel):
    id: int
    name: str
    status: str
    confidence_score: int

class DailyMissionInfo(BaseModel):
    id: int
    title: str
    date: str
    duration_hours: float
    is_completed: bool
    topic_id: Optional[int]

class RevisionInfo(BaseModel):
    id: int
    topic_id: int
    topic_name: str
    scheduled_date: str
    confidence_score: int
    is_completed: bool

class AchievementInfo(BaseModel):
    id: int
    slug: str
    name: str
    description: str
    is_unlocked: bool
    unlocked_at: Optional[str]

class CoachingMessageInfo(BaseModel):
    id: int
    content: str
    type: str
    timestamp: str

class DashboardData(BaseModel):
    user: UserProfile
    active_exam: Optional[ExamInfo] = None
    today_mission: Optional[DailyMissionInfo] = None
    upcoming_revisions: List[RevisionInfo] = []
    progress_percentage: float = 0.0
    overall_readiness: float = 0.0
    coach_message: Optional[CoachingMessageInfo] = None
    achievements: List[AchievementInfo] = []


class ChatRequest(BaseModel):
    message: str
