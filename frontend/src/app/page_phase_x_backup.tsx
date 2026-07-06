"use client";

import React, { useState, useEffect } from "react";

// Standard unified inline SVG Icon set for consistent UI aesthetics
const Icons = {
  Sparkles: () => (
    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l-.813-5.096L3 15l5.096-.813L9 9l.813 5.096L15 15l-5.187.904zM18 10.5l-.5 3-.5-3-3-.5 3-.5.5-3 .5 3 3 .5-3 .5z" />
    </svg>
  ),
  Coins: () => (
    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-2.5-6h5a1.5 1.5 0 010 3h-5a1.5 1.5 0 000 3h5" />
    </svg>
  ),
  Flame: () => (
    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Trophy: () => (
    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a7 7 0 100-14 7 7 0 000 14zm0 0v3m0 0H8m4 0h4m-9-8h1a2 2 0 012 2v1m9-3h-1a2 2 0 00-2 2v1" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  BookOpen: () => (
    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
    </svg>
  ),
  CoachBubble: () => (
    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
};

const API_BASE = "http://localhost:8000";

export default function StudyQuestDashboard() {
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(true);
  
  // Wizard Setup Form state
  const [examName, setExamName] = useState("Biology");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2.0);
  const [syllabus, setSyllabus] = useState("Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology");

  // Ingestion File Uploader state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [candidateTopics, setCandidateTopics] = useState<string[]>([]);

  // Dashboard state parameters
  const [user, setUser] = useState({ level: 1, xp: 0, coins: 0, daily_streak: 0, weekly_streak: 0, last_active: "" });
  const [activeExam, setActiveExam] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [todayMission, setTodayMission] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [progress, setProgress] = useState(0.0);
  const [readiness, setReadiness] = useState(0.0);
  const [coachMessage, setCoachMessage] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [agentTraces, setAgentTraces] = useState<any[]>([]);
  const [fallbackMode, setFallbackMode] = useState(true);

  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "coach"; text: string }[]>([]);

  // Preferred reminder alarm state
  const [reminderTime, setReminderTime] = useState("19:00");
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [alarmDismissed, setAlarmDismissed] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState<Date | null>(null);

  // Collapsible Developer Reasoning View
  const [showReasoning, setShowReasoning] = useState(false);

  // Rewards Congratulations Modal State
  const [rewardsModalOpen, setRewardsModalOpen] = useState(false);
  const [earnedXP, setEarnedXP] = useState(120);
  const [earnedCoins, setEarnedCoins] = useState(15);

  // Completion modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [confidence, setConfidence] = useState(3); // Default 3 matching user request
  const [actualHours, setActualHours] = useState(2.0);

  // Pomodoro timer state
  const [pomoMinutes, setPomoMinutes] = useState(25);
  const [pomoSeconds, setPomoSeconds] = useState(0);
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoCount, setPomoCount] = useState(0);

  // Seed default date (30 days from now)
  useEffect(() => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    setExamDate(futureDate.toISOString().split("T")[0]);
  }, []);

  // Fetch data on startup
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Pomodoro countdown clock loop
  useEffect(() => {
    let interval: any = null;
    if (pomoActive) {
      interval = setInterval(() => {
        if (pomoSeconds > 0) {
          setPomoSeconds(pomoSeconds - 1);
        } else if (pomoMinutes > 0) {
          setPomoMinutes(pomoMinutes - 1);
          setPomoSeconds(59);
        } else {
          // Timer finished
          setPomoActive(false);
          setPomoMinutes(25);
          setPomoSeconds(0);
          setPomoCount((prev) => prev + 1);
          handlePomodoroComplete();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [pomoActive, pomoMinutes, pomoSeconds]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard`);
      if (!res.ok) throw new Error("Backend offline");
      const data = await res.json();
      updateStateFromDashboard(data);
    } catch (err) {
      console.log("CORS/Connection error: loading mock state.");
      loadMockInitialState();
    } finally {
      setLoading(false);
    }
  };

  const updateStateFromDashboard = (data: any) => {
    setUser(data.user);
    setActiveExam(data.active_exam);
    setTopics(data.topics || []);
    setTodayMission(data.today_mission);
    setRevisions(data.upcoming_revisions || []);
    setProgress(data.progress_percentage);
    setReadiness(data.overall_readiness);
    setCoachMessage(data.coach_message);
    setAchievements(data.achievements || []);
    setAgentTraces(data.agent_traces || []);
    setFallbackMode(data.fallback_mode);
    
    if (data.preferred_reminder_time) {
      setReminderTime(data.preferred_reminder_time);
    }
    
    if (data.active_exam) {
      setSetupMode(false);
    } else {
      setSetupMode(true);
    }
  };

  const loadMockInitialState = () => {
    setUser({ level: 1, xp: 380, coins: 40, daily_streak: 4, weekly_streak: 1, last_active: "Yesterday" });
    setAchievements([
      { id: 1, slug: "first_session", name: "First Study Session", description: "Complete your first study session of any topic.", is_unlocked: false },
      { id: 2, slug: "streak_7", name: "7-Day Streak", description: "Maintain a daily study streak for 7 consecutive days.", is_unlocked: false },
      { id: 3, slug: "revision_master", name: "Revision Master", description: "Complete your first spaced repetition revision mission.", is_unlocked: false },
      { id: 4, slug: "finished_subject", name: "Finished Subject", description: "Complete all study topics for a given exam.", is_unlocked: false },
      { id: 5, slug: "exam_ready", name: "Exam Ready", description: "Maintain an overall study readiness score above 80% leading to exam day.", is_unlocked: false }
    ]);
    setAgentTraces([]);
    setFallbackMode(true);
    setActiveExam(null);
    setSetupMode(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File validation
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      setUploadError("Invalid file type. Only PDF and TXT files are allowed.");
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File size exceeds 2MB limit.");
      return;
    }
    
    setUploadError("");
    setUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch(`${API_BASE}/api/syllabus/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Upload failed");
      }
      
      const data = await res.json();
      setCandidateTopics(data.topic_candidates || []);
      setSyllabus((data.topic_candidates || []).join(", "));
    } catch (err: any) {
      setUploadError(err.message || "Failed to extract syllabus");
    } finally {
      setUploading(false);
    }
  };

  const handleSetupRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: examName,
          date: examDate,
          daily_hours: dailyHours,
          syllabus: syllabus,
          reminder_time: reminderTime
        })
      });
      if (res.ok) {
        const data = await res.json();
        updateStateFromDashboard(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Setup local fallback trigger.");
    }

    // Client-side mock setup for offline testing
    const parsedTopics = syllabus.split(",").map(t => t.trim());
    const mockTopics = parsedTopics.map((name, i) => ({
      id: i + 1,
      name,
      status: "pending",
      confidence_score: 0
    }));

    setTopics(mockTopics);
    setActiveExam({
      id: 1,
      name: examName,
      date: examDate,
      daily_hours: dailyHours,
      countdown_days: 30
    });
    setTodayMission({
      id: 101,
      title: `Study ${parsedTopics[0]}`,
      date: new Date().toISOString().split("T")[0],
      duration_hours: dailyHours,
      is_completed: false,
      topic_id: 1
    });
    setRevisions([]);
    setProgress(0.0);
    setReadiness(0.0);
    setUser(prev => ({ ...prev, daily_streak: 4 })); // Seeding 4 days so next completion makes it 5
    setSetupMode(false);
    setLoading(false);
  };

  // Alarm clock checker
  useEffect(() => {
    if (setupMode || !activeExam || !todayMission || todayMission.is_completed) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }

    const interval = setInterval(() => {
      if (snoozeUntil && new Date() < snoozeUntil) return;

      const now = new Date();
      const currentHHMM = now.toTimeString().split(" ")[0].slice(0, 5); // "HH:MM"

      if (currentHHMM === reminderTime && !alarmDismissed) {
        setAlarmOpen(true);
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification("🎯 StudyQuest AI Alert!", {
            body: `It is time to study! Today's mission: ${todayMission.title}`,
            icon: "/favicon.ico"
          });
        }
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [setupMode, activeExam, todayMission, reminderTime, alarmDismissed, snoozeUntil]);

  const handleSnoozeAlarm = () => {
    const newSnooze = new Date();
    newSnooze.setMinutes(newSnooze.getMinutes() + 10);
    setSnoozeUntil(newSnooze);
    setAlarmOpen(false);
  };

  const handleStartStudyFromAlarm = () => {
    setAlarmOpen(false);
    setPomoActive(true);
  };

  const handleRescheduleMission = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Reschedule today's mission" })
      });
      if (res.ok) {
        const data = await res.json();
        updateStateFromDashboard(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Reschedule local mock trigger.");
    }
    // Fallback offline reschedule
    if (todayMission) {
      setCoachMessage({
        id: 99,
        content: `Pushed today's mission '${todayMission.title}' to tomorrow. Buffer adjusted to keep tomorrow's study time balanced.`,
        type: "info",
        timestamp: new Date().toLocaleTimeString()
      });
      setTodayMission(null);
    }
    setLoading(false);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput.trim();
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        updateStateFromDashboard(data);
        if (data.coach_chat_reply) {
          setChatHistory(prev => [...prev, { sender: "coach", text: data.coach_chat_reply }]);
        }
        return;
      }
    } catch (err) {
      console.log("Chat offline fallback execution.");
    }
    
    // Client-side local chat mock fallback (Phase 5 offline presentations)
    let coachReply = "";
    const activeTopic = todayMission?.title.replace("Study ", "") || "Cell Division";
    const msgLower = userMsg.toLowerCase();
    
    if (msgLower.includes("study next") || msgLower.includes("what should i study")) {
      coachReply = todayMission 
        ? `The Planner Agent scheduled '${todayMission.title}' for today. Please allocate ${todayMission.duration_hours} hours to complete it.`
        : "You have completed all missions for today. Check your revision queue for spaced repetition recap sessions!";
    } else if (msgLower.includes("finished") || msgLower.includes("complete") || msgLower.includes("done")) {
      if (todayMission) {
        coachReply = `Great job! I instructed the Execution Agent to mark '${activeTopic}' as complete. The Revision Agent scheduled next review, and Motivation Agent added +120 XP. Keep up the streak!`;
        setTimeout(() => {
          handleCompleteMission();
        }, 1000);
      } else {
        coachReply = "You don't have a pending study mission right now. Click 'Load Biology Demo' to start one!";
      }
    } else if (msgLower.includes("reschedule") || msgLower.includes("postpone")) {
      if (todayMission) {
        coachReply = `Pushed today's mission '${todayMission.title}' to tomorrow. The Planner Agent adjusted study buffers to preserve daily limits.`;
        setTodayMission(null);
      } else {
        coachReply = "No active mission is currently scheduled today to reschedule.";
      }
    } else if (msgLower.includes("explain")) {
      coachReply = `Here is a coaching explanation of '${activeTopic}': It is a core pillar of your syllabus. Focus on its definitions, diagrams, and past papers.`;
    } else {
      coachReply = "I am your Study Coach. Type 'What should I study next?', 'I finished [topic]', or 'Reschedule today's mission' to control your StudyQuest!";
    }
    
    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: "coach", text: coachReply }]);
    }, 500);
  };

  const handleCompleteMission = async () => {
    setLoading(true);
    setCompleteModalOpen(false);
    setAlarmDismissed(true); // Silence alarm on complete

    try {
      const res = await fetch(`${API_BASE}/api/sessions/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mission_id: todayMission?.id,
          topic_id: todayMission?.topic_id || 1,
          confidence: confidence,
          actual_hours: actualHours
        })
      });
      if (res.ok) {
        const data = await res.json();
        updateStateFromDashboard(data);
        setEarnedXP(120);
        setEarnedCoins(15);
        setRewardsModalOpen(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Completion offline fallback.");
    }

    // Mock completion updates for Biology demo scenario
    const updatedTopics = topics.map(t => {
      if (t.id === todayMission?.topic_id) {
        return { ...t, status: "completed", confidence_score: confidence };
      }
      return t;
    });

    setTopics(updatedTopics);

    // Compute progress & readiness
    const completedCount = updatedTopics.filter(t => t.status === "completed").length;
    const mockProgress = (completedCount / updatedTopics.length) * 100;
    
    // Readiness: 60% completion rate + 40% average confidence
    const avgConfidence = (confidence / 5.0) * 100;
    const mockReadiness = (completedCount / updatedTopics.length * 60) + (avgConfidence / updatedTopics.length * 40);

    // Award +120 XP & +15 Coins, Streak increments to 5
    const newXp = user.xp + 120;
    const newLevel = 1 + Math.floor(newXp / 500);
    setUser(prev => ({
      ...prev,
      xp: newXp,
      level: newLevel,
      coins: prev.coins + 15,
      daily_streak: 5
    }));

    // Unlock "First Session" achievement
    setAchievements(prev =>
      prev.map(a => (a.slug === "first_session" ? { ...a, is_unlocked: true, unlocked_at: "Just Now" } : a))
    );

    const currentTopicName = todayMission?.title.replace("Study ", "") || activeExam?.name || "Current Topic";

    // Dynamic spaced repetition offsets (Phase 2):
    // Confidence 1: 1 day, 2: 2 days, 3: 3 days, 4: 5 days, 5: 7 days
    let revOffset = 7;
    if (confidence === 1) revOffset = 1;
    else if (confidence === 2) revOffset = 2;
    else if (confidence === 3) revOffset = 3;
    else if (confidence === 4) revOffset = 5;
    
    const revDate = new Date();
    revDate.setDate(revDate.getDate() + revOffset);

    // Schedule standard 5 Spaced Repetition reviews offline (Day 1, 3, 7, 14, 30)
    const offsets = [1, 3, 7, 14, 30];
    const newRevs = offsets.map((off, index) => {
      const d = new Date();
      d.setDate(d.getDate() + off);
      return {
        id: Date.now() + index,
        topic_id: todayMission?.topic_id || 1,
        topic_name: currentTopicName,
        scheduled_date: d.toISOString().split("T")[0],
        confidence_score: confidence,
        is_completed: false
      };
    });

    setRevisions(prev => [...prev, ...newRevs]);
    setProgress(roundValue(mockProgress));
    setReadiness(roundValue(mockReadiness));
    setTodayMission(null); // Cleared today's task

    // Update Coach recommendation text & Tomorrow workload adjusted
    setCoachMessage({
      id: 100,
      content: confidence <= 2
        ? `Your confidence for '${currentTopicName}' was low (${confidence}/5), so I scheduled the next review earlier and kept tomorrow's workload under ${activeExam?.daily_hours || 2} hours.`
        : `${currentTopicName} is now complete with confidence ${confidence}/5. I scheduled your next review in ${revOffset} days. Tomorrow's workload has been adjusted to protect your ${activeExam?.daily_hours || 2}-hour study limit.`,
      type: "success",
      timestamp: new Date().toLocaleTimeString()
    });

    // Populate mock collaboration logs
    const mockTraces = [
      {
        agent_name: "Coach Agent",
        action: "Generated coaching insight",
        output_summary: confidence <= 2 
          ? `Your confidence for '${currentTopicName}' was low (${confidence}/5), so I scheduled the next review earlier and kept tomorrow's workload under ${activeExam?.daily_hours || 2} hours.`
          : `${currentTopicName} is now complete. I scheduled your next review in ${revOffset} days...`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent_name: "Planner Agent",
        action: confidence >= 4 ? "Trimming tomorrow's mission" : confidence <= 2 ? "Reinforcing tomorrow's workload" : "Maintaining schedule",
        output_summary: confidence >= 4 
          ? "Reduced tomorrow's study load by 30 mins because of student mastery."
          : confidence <= 2
            ? "Increased tomorrow's study load by 30 mins to reinforce low confidence topics."
            : "Tomorrow's workload kept at standard duration (protected study limit).",
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent_name: "Motivation Agent",
        action: "Awarded rewards",
        output_summary: `Awarded +120 XP, +15 Coins. Streak: 5 days.${newLevel > 1 ? " LEVEL UP to Level 2!" : ""}`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent_name: "Revision Agent",
        action: "Scheduled spaced repetition",
        output_summary: `Next review of '${currentTopicName}' scheduled in ${revOffset} days (${revDate.toISOString().split("T")[0]}) based on confidence ${confidence}/5.`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent_name: "Execution Agent",
        action: "Marked session complete",
        output_summary: `Completed '${currentTopicName}' session. Time spent: ${actualHours} hours, Confidence: ${confidence}/5.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ];

    setAgentTraces(mockTraces);
    setEarnedXP(120);
    setEarnedCoins(15);
    setRewardsModalOpen(true);
    setLoading(false);
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/demo/reset`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        updateStateFromDashboard(data);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Demo reset local fallback trigger.");
      loadMockSeededDemoState();
    } finally {
      setLoading(false);
    }
  };

  const loadMockSeededDemoState = () => {
    setUser({ level: 1, xp: 380, coins: 40, daily_streak: 4, weekly_streak: 1, last_active: "Yesterday" });
    setAchievements([
      { id: 1, slug: "first_session", name: "First Study Session", description: "Complete your first study session of any topic.", is_unlocked: false },
      { id: 2, slug: "streak_7", name: "7-Day Streak", description: "Maintain a daily study streak for 7 consecutive days.", is_unlocked: false },
      { id: 3, slug: "revision_master", name: "Revision Master", description: "Complete your first spaced repetition revision mission.", is_unlocked: false },
      { id: 4, slug: "finished_subject", name: "Finished Subject", description: "Complete all study topics for a given exam.", is_unlocked: false },
      { id: 5, slug: "exam_ready", name: "Exam Ready", description: "Maintain an overall study readiness score above 80% leading to exam day.", is_unlocked: false }
    ]);
    const demoTopics = ["Cell Division", "Genetics", "Human Reproduction", "Evolution", "Ecology", "Biotechnology"];
    setTopics(demoTopics.map((name, i) => ({
      id: i + 1,
      name,
      status: "pending",
      confidence_score: 0
    })));
    setActiveExam({
      id: 1,
      name: "Biology",
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daily_hours: 2.0,
      countdown_days: 30
    });
    setTodayMission({
      id: 101,
      title: "Study Cell Division",
      date: new Date().toISOString().split("T")[0],
      duration_hours: 2.0,
      is_completed: false,
      topic_id: 1
    });
    setRevisions([]);
    setProgress(0.0);
    setReadiness(0.0);
    setCoachMessage({
      id: 99,
      content: "Welcome to the Biology Study Quest! Your 30-day roadmap is set. Today's primary mission: 'Study Cell Division'. Your current pace predicts completion before the exam.",
      type: "general",
      timestamp: new Date().toLocaleTimeString()
    });
    setAgentTraces([
      {
        agent_name: "Planner Agent",
        action: "Initialized biology study roadmap",
        output_summary: "Divided Biology syllabus into 6 topics over 30 days.",
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setFallbackMode(true);
    setSetupMode(false);
  };

  const handlePomodoroComplete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pomodoro/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_minutes: 25 })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => ({ ...prev, xp: prev.xp + data.xp_earned }));
        return;
      }
    } catch (e) {
      console.log("Mocking Pomodoro rewards.");
    }
    setUser(prev => ({ ...prev, xp: prev.xp + 15 }));
  };

  const roundValue = (val: number) => Math.round(val * 10) / 10;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-base text-gray-400">
        <div className="w-12 h-12 border-2 border-brand-mint border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-mono text-sm tracking-wider">CONNECTING STUDYQUEST INTERFACE...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-base text-gray-100 min-h-screen">
      {/* Top Navigation Control bar */}
      <header className="h-16 px-6 border-b border-border-subtle flex items-center justify-between glass-panel sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-brand-mint to-brand-cobalt flex items-center justify-center font-bold text-bg-base">S</div>
          <div>
            <h1 className="text-lg font-bold tracking-tight font-sans">StudyQuest AI</h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Multi-Agent Study Command</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {!setupMode && (
            <>
              {/* Gamified counters: Level & XP */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-border-subtle">
                {Icons.Sparkles()}
                <div className="text-xs font-mono">
                  <span className="text-gray-400 uppercase">Lv.{user.level}</span>
                  <span className="ml-2 font-bold">{user.xp} XP</span>
                </div>
              </div>

              {/* Gamified counters: Coins */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-border-subtle">
                {Icons.Coins()}
                <div className="text-xs font-mono">
                  <span className="font-bold">{user.coins}</span>
                  <span className="ml-1 text-gray-400 uppercase">Coins</span>
                </div>
              </div>

              {/* Streak Counter */}
              <div className="flex items-center gap-2 px-3 py-1 bg-orange-500/10 rounded border border-orange-500/20">
                {Icons.Flame()}
                <div className="text-xs font-mono text-orange-400 font-bold">
                  {user.daily_streak} Day Streak
                </div>
              </div>
            </>
          )}

          {/* Load Biology Demo Button */}
          <button 
            onClick={handleResetDemo}
            className="text-xs px-3 py-1.5 rounded bg-gradient-to-r from-brand-mint/20 to-brand-cobalt/20 border border-brand-mint/30 hover:border-brand-mint/60 hover:from-brand-mint/35 hover:to-brand-cobalt/35 text-brand-mint font-bold transition-all cursor-pointer font-sans"
          >
            Load Biology Demo
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-[1400px] w-full mx-auto gap-6">
        {setupMode ? (
          /* SETUP WIZARD VIEW */
          <div className="max-w-2xl w-full mx-auto glass-panel p-8 rounded-xl border-border-subtle">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-brand-mint to-brand-cobalt bg-clip-text text-transparent">
                Embark on Your Study Quest
              </h2>
              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                Define your academic goal. The Planner Agent will dissect your syllabus and distribute daily missions.
              </p>
            </div>

            <form onSubmit={handleSetupRoadmap} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Subject / Exam Name</label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. Biology, Calculus, SAT"
                    className="w-full bg-black/40 border border-border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-mint transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Exam Date</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-black/40 border border-border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-mint transition-colors text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Daily Study Allocation (Hours)</label>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.5"
                    required
                    value={isNaN(dailyHours) ? "" : dailyHours}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      setDailyHours(isNaN(parsed) ? 0.0 : parsed);
                    }}
                    className="w-full bg-black/40 border border-border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-mint transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">Preferred Study Reminder Time</label>
                  <input
                    type="time"
                    required
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full bg-black/40 border border-border-subtle rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-brand-mint transition-colors text-white"
                  />
                </div>
              </div>

              {/* Optional PDF / Text Syllabus Ingestion */}
              <div className="border border-border-subtle/40 p-4 rounded-lg bg-black/20">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                  Optional: Upload Syllabus (.pdf, .txt)
                </label>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-mono file:bg-brand-mint/10 file:text-brand-mint hover:file:bg-brand-mint/20 cursor-pointer"
                />
                {uploading && <p className="text-xs text-brand-mint mt-2 font-mono animate-pulse">Extracting topics from syllabus...</p>}
                {uploadError && <p className="text-xs text-red-400 mt-2 font-mono">⚠️ {uploadError}</p>}
                
                {candidateTopics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">Extracted Topics ({candidateTopics.length}):</p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-black/40 rounded border border-border-subtle/30">
                      {candidateTopics.map((topic, i) => (
                        <span key={i} className="text-[10px] font-mono bg-brand-mint/10 text-brand-mint px-2 py-0.5 rounded border border-brand-mint/20">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-brand-mint to-brand-cobalt text-bg-base font-bold text-sm py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-transform cursor-pointer font-sans"
              >
                Compile Study Roadmap
              </button>
            </form>
          </div>
        ) : (
          /* PRIMARY DASHBOARD COMMAND CENTER */
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Top Row: Today's Mission full-width card */}
            <div className="glass-panel-glow p-6 rounded-xl border-border-subtle relative overflow-hidden bg-gradient-to-b from-brand-mint/5 to-transparent animate-fade-in">
              <div className="absolute top-0 right-0 bg-brand-mint/15 text-brand-mint font-mono text-[9px] uppercase px-4 py-1.5 rounded-bl font-bold tracking-widest border-l border-b border-brand-mint/20">
                Primary Mission
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🎯</span>
                    <h2 className="text-sm font-mono text-brand-mint uppercase tracking-widest font-bold">Today's Study Quest Mission</h2>
                  </div>
                  
                  {todayMission ? (
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-white mb-3">{todayMission.title}</h3>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="bg-white/5 border border-border-subtle/40 rounded-lg p-3">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Subject Name</span>
                          <span className="text-xs font-bold text-gray-200 mt-1 block">{activeExam?.name || "Subject"}</span>
                        </div>
                        <div className="bg-white/5 border border-border-subtle/40 rounded-lg p-3">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Estimated Time</span>
                          <span className="text-xs font-bold text-gray-200 mt-1 block">{Math.round((todayMission.duration_hours || 2.0) * 60)} minutes</span>
                        </div>
                        <div className="bg-white/5 border border-border-subtle/40 rounded-lg p-3">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Pomodoro Set</span>
                          <span className="text-xs font-bold text-gray-200 mt-1 block">{Math.max(1, Math.round((todayMission.duration_hours || 2.0) * 2))} sessions</span>
                        </div>
                        <div className="bg-white/5 border border-border-subtle/40 rounded-lg p-3">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Quest Rewards</span>
                          <span className="text-xs font-bold text-amber-400 mt-1 block">+120 XP / +15 Coins</span>
                        </div>
                        <div className="bg-white/5 border border-border-subtle/40 rounded-lg p-3">
                          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Next Revision</span>
                          <span className="text-xs font-bold text-brand-mint mt-1 block">Tomorrow (Day 1)</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold text-gray-400">All Missions Completed! 🎉</h3>
                      <p className="text-xs text-gray-500 mt-1">Excellent work! Check your upcoming spaced repetition queues for reviews or check with the Study Coach.</p>
                    </div>
                  )}
                </div>

                {todayMission && (
                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-[200px] justify-center">
                    <button
                      onClick={() => setPomoActive(true)}
                      className="bg-brand-cobalt text-white font-mono text-xs py-3 rounded-lg border border-brand-cobalt/40 hover:bg-brand-cobalt/40 transition-colors font-bold uppercase tracking-wider cursor-pointer text-center font-sans"
                    >
                      🚀 Start Mission
                    </button>
                    <button
                      onClick={handleRescheduleMission}
                      className="font-mono text-xs py-3 rounded-lg border border-border-subtle text-gray-400 hover:bg-white/5 transition-colors font-bold uppercase tracking-wider cursor-pointer text-center font-sans"
                    >
                      📅 Reschedule
                    </button>
                    <button
                      onClick={() => {
                        setConfidence(3);
                        setActualHours(todayMission.duration_hours);
                        setCompleteModalOpen(true);
                      }}
                      className="bg-brand-mint text-bg-base font-sans text-xs py-3 rounded-lg hover:opacity-90 transition-opacity font-extrabold uppercase tracking-wider cursor-pointer text-center font-sans"
                    >
                      ✓ Mark Complete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Section: Progress + Revisions + Pomodoro + Study Coach */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Progress Panel (Span 3) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl border-border-subtle flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Study Quest Progress</h4>
                    
                    <div className="flex flex-col items-center py-4">
                      {/* Circular Progress Ring */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                          <circle 
                            cx="50" cy="50" r="40" 
                            stroke="#00E676" strokeWidth="6" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - progress / 100)}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black text-white">{progress}%</span>
                          <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">Progress</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 text-center mt-3 font-sans">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Countdown to Exam</p>
                    <h3 className="text-xl font-bold tracking-tight text-white mt-1">{activeExam?.countdown_days} Days Remaining</h3>
                    <p className="text-[10px] text-brand-mint font-mono mt-1">Readiness Index: {readiness}%</p>
                  </div>
                </div>
              </div>

              {/* Spaced repetition (Span 3) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl border-border-subtle flex-1 flex flex-col">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">Upcoming Revisions</h4>
                  {revisions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-xs text-gray-500 font-mono">
                      <span>No upcoming revisions.</span>
                      <span className="text-[10px] text-gray-600 mt-1">Complete your first study quest to schedule spacing milestones!</span>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-2 overflow-y-auto max-h-[220px] pr-1">
                      {revisions.map((rev) => (
                        <div key={rev.id} className="p-2.5 bg-white/5 border border-border-subtle/50 rounded-lg text-xs hover:border-brand-mint/30 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="font-bold text-gray-200 truncate font-sans">{rev.topic_name}</h5>
                            <span className="text-[8px] font-mono font-bold text-brand-mint bg-brand-mint/10 border border-brand-mint/20 px-1 rounded uppercase">
                              Due
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-mono">
                            <span>📅 {rev.scheduled_date}</span>
                            <span>Confidence: {rev.confidence_score}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Pomodoro Focus Timer (Span 3) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl border-border-subtle flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">Pomodoro Focus Timer</h4>
                    
                    <div className="text-center py-4">
                      <span className="text-4xl font-extrabold font-mono tracking-widest text-white block">
                        {pomoMinutes.toString().padStart(2, "0")}:{pomoSeconds.toString().padStart(2, "0")}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-wider">Focus Period #{pomoCount + 1}</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 mt-4">
                    <button
                      onClick={() => setPomoActive(!pomoActive)}
                      className={`flex-1 font-mono text-xs py-2 rounded-lg border cursor-pointer font-bold transition-all ${
                        pomoActive 
                          ? "border-red-500/30 text-red-400 bg-red-500/5 hover:bg-red-500/10" 
                          : "border-brand-mint/30 text-brand-mint bg-brand-mint/5 hover:bg-brand-mint/10"
                      }`}
                    >
                      {pomoActive ? "PAUSE" : "START"}
                    </button>
                    <button
                      onClick={() => {
                        setPomoActive(false);
                        setPomoMinutes(25);
                        setPomoSeconds(0);
                      }}
                      className="px-3.5 font-mono text-xs py-2 rounded-lg border border-border-subtle text-gray-400 hover:bg-white/5 cursor-pointer font-sans"
                    >
                      RESET
                    </button>
                  </div>
                </div>
              </div>

              {/* Study Coach Assistant (Span 3) */}
              <div className="lg:col-span-3 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl border-border-subtle flex-1 flex flex-col h-[280px]">
                  <div className="flex items-center gap-2.5 border-b border-border-subtle pb-2 mb-2.5">
                    {Icons.CoachBubble()}
                    <div>
                      <h4 className="text-xs font-bold">Study Coach</h4>
                      <p className="text-[9px] text-brand-mint font-mono uppercase tracking-wider">Agent Network Director</p>
                    </div>
                  </div>
                  
                  {/* Chat Message History */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px] leading-relaxed">
                    {chatHistory.length === 0 ? (
                      <div className="text-gray-400 space-y-2 py-1 font-sans">
                        <p className="leading-relaxed">
                          "Good evening! I'm your Study Coach. Ask me:"
                        </p>
                        <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px] text-brand-mint">
                          <li>"What should I study next?"</li>
                          <li>"I finished today's topic"</li>
                          <li>"Reschedule today's mission"</li>
                          <li>"Show my revision schedule"</li>
                        </ul>
                      </div>
                    ) : (
                      chatHistory.map((chat, idx) => (
                        <div key={idx} className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[90%] rounded-lg p-2 leading-relaxed ${
                            chat.sender === "user" 
                              ? "bg-brand-cobalt/25 text-white border border-brand-cobalt/40 font-sans" 
                              : "bg-white/5 text-gray-200 border border-border-subtle font-sans"
                          }`}>
                            {chat.text}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Message Input Form */}
                  <form onSubmit={handleSendChatMessage} className="mt-2.5 flex gap-2 pt-2 border-t border-border-subtle">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask the coach..."
                      className="flex-1 bg-black/40 border border-border-subtle rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-brand-mint text-white"
                    />
                    <button
                      type="submit"
                      className="bg-brand-mint text-bg-base font-bold px-3 py-1.5 rounded-lg text-[11px] hover:opacity-90 transition-opacity cursor-pointer font-sans"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>

            </div>

            {/* Bottom Section: Achievements + Agent traces */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Unlocked Badges (Span 6) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl border-border-subtle">
                  <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-4">Achievements & Consistency Badges</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans">
                    {achievements.map((ach) => (
                      <div 
                        key={ach.id} 
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                          ach.is_unlocked 
                            ? "bg-amber-500/5 border-amber-500/20" 
                            : "bg-white/5 border-border-subtle opacity-50"
                        }`}
                      >
                        <div className={`p-1.5 rounded ${ach.is_unlocked ? "bg-amber-500/10 text-amber-500" : "bg-white/10 text-gray-500"}`}>
                          {Icons.Trophy()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold truncate">{ach.name}</h5>
                          <p className="text-[10px] text-gray-400 truncate">{ach.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Collaboration traces (Span 6) */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-xl border-border-subtle">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-3 mb-4">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-sans">Agent Collaboration System</h4>
                    <button 
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="text-[10px] font-mono text-brand-mint border border-brand-mint/20 hover:border-brand-mint/50 px-2.5 py-1 rounded bg-brand-mint/5 hover:bg-brand-mint/15 transition-all cursor-pointer uppercase tracking-wider font-bold"
                    >
                      {showReasoning ? "Hide AI Reasoning" : "Show AI Reasoning"}
                    </button>
                  </div>

                  {showReasoning ? (
                    agentTraces.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-500 font-mono">
                        No agent collaboration traces captured yet.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {agentTraces.map((trace, idx) => {
                          let agentColor = "text-blue-400 border-blue-500/20 bg-blue-500/5";
                          if (trace.agent_name.includes("Execution")) agentColor = "text-teal-400 border-teal-500/20 bg-teal-500/5";
                          else if (trace.agent_name.includes("Revision")) agentColor = "text-purple-400 border-purple-500/20 bg-purple-500/5";
                          else if (trace.agent_name.includes("Motivation")) agentColor = "text-amber-400 border-amber-500/20 bg-amber-500/5";
                          else if (trace.agent_name.includes("Coach")) agentColor = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";

                          return (
                            <div key={idx} className="p-3 bg-white/5 border border-border-subtle rounded-lg flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase ${agentColor}`}>
                                  {trace.agent_name}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">{trace.timestamp}</span>
                              </div>
                              <p className="text-xs font-bold text-gray-200 mt-1 font-sans">{trace.action}</p>
                              <p className="text-[11px] text-gray-400 font-mono leading-relaxed">{trace.output_summary}</p>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="py-6 text-center text-xs text-gray-500 font-sans">
                      "Click Show AI Reasoning to inspect the multi-agent coordination traces, decision weights, and reward calculations."
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Complete Session Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-xl border-border-subtle">
            <h3 className="text-lg font-bold tracking-tight mb-4 border-b border-border-subtle pb-3 text-white font-sans">Complete Study Session</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Subject Topic</label>
                <p className="text-sm font-bold bg-white/5 p-2.5 rounded border border-border-subtle text-white font-sans">
                  {todayMission?.title.replace("Study ", "")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Study Duration Spent (Hours)</label>
                <input
                  type="number"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={isNaN(actualHours) ? "" : actualHours}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setActualHours(isNaN(parsed) ? 0.0 : parsed);
                  }}
                  className="w-full bg-black/40 border border-border-subtle rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-mint text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Confidence Level (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfidence(num)}
                      className={`flex-1 py-2 rounded font-mono font-bold text-sm border cursor-pointer transition-all ${
                        confidence === num 
                          ? "bg-brand-mint text-bg-base border-brand-mint" 
                          : "bg-white/5 border-border-subtle text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1 px-1">
                  <span>Lowest</span>
                  <span>Highest</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                className="flex-1 font-mono text-xs py-2 rounded border border-border-subtle text-gray-400 hover:bg-white/5 cursor-pointer font-sans"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCompleteMission}
                className="flex-1 bg-brand-mint text-bg-base font-bold text-xs py-2 rounded hover:opacity-90 cursor-pointer font-sans"
              >
                RECORD SUCCESS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Congratulations Modal */}
      {rewardsModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-xl border-amber-500/40 relative overflow-hidden text-center animate-fade-in">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500"></div>
            
            <span className="text-5xl block animate-bounce">🏆</span>
            <h3 className="text-2xl font-black tracking-tight text-white mt-4 font-sans">Mission Accomplished!</h3>
            <p className="text-xs text-brand-mint font-mono uppercase tracking-widest mt-1">Rewards Dispatched by Motivation Agent</p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/5 border border-border-subtle p-3 rounded-lg animate-fade-in">
                <span className="text-2xl font-extrabold text-amber-400">+{earnedXP} XP</span>
                <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Study Level Up</p>
              </div>
              <div className="bg-white/5 border border-border-subtle p-3 rounded-lg animate-fade-in">
                <span className="text-2xl font-extrabold text-brand-mint">+{earnedCoins} Coins</span>
                <p className="text-[10px] text-gray-400 font-mono uppercase mt-1">Consistency Store</p>
              </div>
            </div>

            <div className="bg-white/5 border border-border-subtle p-4 rounded-lg mt-4 text-left text-xs text-gray-400 space-y-2 font-sans">
              <p>🎯 <strong className="text-gray-200">What do these mean?</strong></p>
              <p>• <strong className="text-amber-400">XP</strong> increases your global Study Level and unlocked tier status.</p>
              <p>• <strong className="text-brand-mint">Coins</strong> track daily consistency, unlocking special achievement medals.</p>
              <p>• <strong className="text-orange-400">Spaced Revisions</strong> have been scheduled on Day 1, Day 3, Day 7, Day 14, and Day 30 to lock this knowledge in long-term memory!</p>
            </div>

            <button
              onClick={() => setRewardsModalOpen(false)}
              className="mt-6 w-full bg-brand-mint text-bg-base font-extrabold text-xs py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-transform cursor-pointer uppercase tracking-wider font-sans"
            >
              Continue Quest
            </button>
          </div>
        </div>
      )}

      {/* Visual Study Alarm Modal */}
      {alarmOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-xl border-brand-mint/40 relative overflow-hidden animate-pulse">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-mint to-brand-cobalt"></div>
            
            <div className="text-center">
              <span className="text-4xl block">🔔</span>
              <h3 className="text-xl font-extrabold tracking-tight text-white mt-4 font-sans">Time to Study!</h3>
              <p className="text-xs text-brand-mint font-mono mt-1 uppercase tracking-wider">Scheduled Alarm Triggered</p>
              
              <div className="bg-white/5 border border-border-subtle p-4 rounded-lg mt-5 text-left font-sans">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Active Mission</p>
                <h4 className="text-sm font-bold text-gray-200 mt-1">{todayMission?.title}</h4>
                <p className="text-xs text-gray-400 mt-1 font-sans">Recommended Pomodoro: {Math.max(1, Math.round((todayMission?.duration_hours || 2.0) * 2))} sessions</p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSnoozeAlarm}
                  className="flex-1 font-mono text-xs py-3 rounded-lg border border-border-subtle text-gray-400 hover:bg-white/5 cursor-pointer font-bold uppercase tracking-wider"
                >
                  Snooze (10m)
                </button>
                <button
                  onClick={handleStartStudyFromAlarm}
                  className="flex-1 bg-gradient-to-r from-brand-mint to-brand-cobalt text-bg-base font-extrabold text-xs py-3 rounded-lg hover:opacity-90 active:scale-[0.98] transition-transform cursor-pointer uppercase tracking-wider font-sans"
                >
                  Start Focus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
