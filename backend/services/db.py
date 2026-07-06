import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.getenv("DATABASE_PATH") or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "studyquest.db")

def get_db_connection():
    """Returns a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema and seeds initial achievements if they don't exist."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users / Profile Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            level INTEGER DEFAULT 1,
            xp INTEGER DEFAULT 0,
            coins INTEGER DEFAULT 0,
            daily_streak INTEGER DEFAULT 0,
            weekly_streak INTEGER DEFAULT 0,
            last_active TEXT
        )
    """)

    # Exams Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS exams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            date TEXT NOT NULL, -- ISO Format: YYYY-MM-DD
            daily_hours REAL DEFAULT 2.0,
            syllabus TEXT
        )
    """)

    # Syllabus Topics Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS syllabus_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            status TEXT DEFAULT 'pending', -- pending, in_progress, completed
            confidence_score INTEGER DEFAULT 0, -- 0 to 5
            order_index INTEGER DEFAULT 0,
            FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
        )
    """)

    # Daily Missions Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            exam_id INTEGER NOT NULL,
            topic_id INTEGER,
            title TEXT NOT NULL,
            date TEXT NOT NULL, -- YYYY-MM-DD
            duration_hours REAL NOT NULL,
            is_completed INTEGER DEFAULT 0, -- 0 = False, 1 = True
            FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,
            FOREIGN KEY(topic_id) REFERENCES syllabus_topics(id) ON DELETE SET NULL
        )
    """)

    # Revisions Table (Spaced Repetition)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS revisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER NOT NULL,
            scheduled_date TEXT NOT NULL, -- YYYY-MM-DD
            confidence_score INTEGER DEFAULT 0,
            is_completed INTEGER DEFAULT 0,
            FOREIGN KEY(topic_id) REFERENCES syllabus_topics(id) ON DELETE CASCADE
        )
    """)

    # Achievements Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            is_unlocked INTEGER DEFAULT 0,
            unlocked_at TEXT
        )
    """)

    # Coaching Messages Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS coaching_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            type TEXT DEFAULT 'general', -- general, warning, success, planner
            timestamp TEXT NOT NULL
        )
    """)

    # Agent Traces Table for multi-agent logging
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_traces (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            agent_name TEXT NOT NULL,
            action TEXT NOT NULL,
            output_summary TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)

    # Study Memory Table (Key-Value)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS study_memory (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)

    # Seed Achievements if empty
    cursor.execute("SELECT COUNT(*) FROM achievements")
    if cursor.fetchone()[0] == 0:
        achievements_data = [
            ("first_session", "First Study Session", "Complete your first study session of any topic."),
            ("streak_7", "7-Day Streak", "Maintain a daily study streak for 7 consecutive days."),
            ("revision_master", "Revision Master", "Complete your first spaced repetition revision mission."),
            ("finished_subject", "Finished Subject", "Complete all study topics for a given exam."),
            ("exam_ready", "Exam Ready", "Maintain an overall study readiness score above 80% leading to exam day.")
        ]
        cursor.executemany(
            "INSERT INTO achievements (slug, name, description) VALUES (?, ?, ?)",
            achievements_data
        )

    # Initialize a default user profile if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO users (level, xp, coins, daily_streak, weekly_streak, last_active)
            VALUES (1, 0, 0, 0, 0, NULL)
        """)

    # Add new columns to exams if they don't exist
    columns_to_add = [
        ("xp", "INTEGER DEFAULT 0"),
        ("coins", "INTEGER DEFAULT 0"),
        ("daily_streak", "INTEGER DEFAULT 0"),
        ("level", "INTEGER DEFAULT 1"),
        ("status", "TEXT DEFAULT 'Active'"),
        ("last_opened", "TEXT"),
        ("grade", "TEXT"),
        ("session_duration", "INTEGER DEFAULT 45"),
        ("break_duration", "INTEGER DEFAULT 10"),
        ("score_target", "INTEGER"),
        ("rank_target", "TEXT"),
        ("daily_goal", "TEXT"),
        ("weekly_goal", "TEXT"),
        ("student_name", "TEXT")
    ]
    for col_name, col_type in columns_to_add:
        try:
            cursor.execute(f"ALTER TABLE exams ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            # Column already exists (OperationalError is raised if column exists)
            pass

    conn.commit()
    conn.close()

def add_agent_trace(agent_name: str, action: str, output_summary: str):
    """Logs an agent collaboration event in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO agent_traces (agent_name, action, output_summary, timestamp)
        VALUES (?, ?, ?, ?)
    """, (agent_name, action, output_summary, now_str))
    conn.commit()
    conn.close()

def get_recent_traces(limit: int = 10) -> list:
    """Retrieves the most recent agent collaboration traces."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT agent_name, action, output_summary, timestamp 
        FROM agent_traces 
        ORDER BY id DESC LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def set_memory_value(key: str, value: str):
    """Saves or updates a study memory parameter key-value pair."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO study_memory (key, value)
        VALUES (?, ?)
    """, (key, value))
    conn.commit()
    conn.close()

def get_memory_value(key: str) -> Optional[str]:
    """Fetches a saved study memory parameter value by its key."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM study_memory WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else None

def list_all_memories() -> List[Dict[str, str]]:
    """Retrieves all saved key-value metrics from study memory."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM study_memory")
    rows = cursor.fetchall()
    conn.close()
    return [{"key": row["key"], "value": row["value"]} for row in rows]

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully at:", DB_PATH)
