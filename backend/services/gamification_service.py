from datetime import datetime, date, timedelta
from typing import Dict, Any, List
from services.db import get_db_connection

def award_rewards(user_id: int, xp_amount: int, coin_amount: int) -> Dict[str, Any]:
    """Awards XP and coins to the user, checks for level ups, and updates last active date."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT level, xp, coins, daily_streak, last_active FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return {}

    current_level = row["level"]
    current_xp = row["xp"]
    current_coins = row["coins"]
    streak = row["daily_streak"]
    last_active_str = row["last_active"]

    new_xp = current_xp + xp_amount
    new_coins = current_coins + coin_amount

    # Level up calculation (e.g. 500 XP per level)
    new_level = 1 + (new_xp // 500)
    level_up = new_level > current_level

    # Streak calculation
    today = date.today()
    today_str = today.strftime("%Y-%m-%d")
    
    if last_active_str:
        last_active = datetime.strptime(last_active_str, "%Y-%m-%d").date()
        if last_active == today:
            # Already active today, maintain streak
            pass
        elif last_active == today - timedelta(days=1):
            # Consecutive day active
            streak += 1
        else:
            # Streak broken, reset to 1
            streak = 1
    else:
        # First active day
        streak = 1

    cursor.execute("""
        UPDATE users 
        SET level = ?, xp = ?, coins = ?, daily_streak = ?, last_active = ?
        WHERE id = ?
    """, (new_level, new_xp, new_coins, streak, today_str, user_id))

    conn.commit()
    conn.close()

    # Automatically check first_session achievement
    unlock_achievement(user_id, "first_session")
    if streak >= 7:
        unlock_achievement(user_id, "streak_7")

    return {
        "level": new_level,
        "xp": new_xp,
        "coins": new_coins,
        "daily_streak": streak,
        "level_up": level_up
    }

def unlock_achievement(user_id: int, slug: str) -> bool:
    """Unlocks a specific achievement by slug if not already unlocked."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT is_unlocked FROM achievements WHERE slug = ?", (slug,))
    row = cursor.fetchone()
    if not row or row["is_unlocked"] == 1:
        conn.close()
        return False

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        UPDATE achievements 
        SET is_unlocked = 1, unlocked_at = ?
        WHERE slug = ?
    """, (now_str, slug))

    conn.commit()
    conn.close()
    return True

def get_gamification_stats(user_id: int) -> Dict[str, Any]:
    """Retrieves current user rewards level, streaks, and unlocked achievements."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT level, xp, coins, daily_streak, weekly_streak, last_active FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()

    cursor.execute("SELECT id, slug, name, description, is_unlocked, unlocked_at FROM achievements")
    achievements = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "user": dict(user) if user else {},
        "achievements": achievements
    }
