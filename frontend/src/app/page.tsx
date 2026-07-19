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
  ),
  Gear: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function StudyQuestDashboard() {
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(true);
  
  // Wizard Setup Form state
  const [examName, setExamName] = useState("Biology, Chemistry");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState(2.0);
  const [syllabus, setSyllabus] = useState("");
  const [studentName, setStudentName] = useState("");
  const [reminderTime, setReminderTime] = useState("19:00");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Previous Study Plans state
  const [plans, setPlans] = useState<any[]>([]);
  const [plansModalOpen, setPlansModalOpen] = useState(false);

  const fetchPreviousPlans = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
        localStorage.setItem("studyquest_all_plans", JSON.stringify(data));
        return;
      }
    } catch (e) {
      console.log("Offline or error fetching plans, reading from localStorage.");
    }
    
    // Offline fallback
    const cachedPlans = localStorage.getItem("studyquest_all_plans");
    if (cachedPlans) {
      setPlans(JSON.parse(cachedPlans));
    }
  };

  const handleContinueStudy = async (planId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/plans/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: planId })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Synchronize local React states with switched plan
        const selectedPlan = plans.find(p => p.id === planId);
        if (selectedPlan) {
          setStudentName(selectedPlan.student_name || "");
          setClassGrade(selectedPlan.grade || "");
          setExamName(selectedPlan.name || "");
          setExamDate(selectedPlan.date || "");
          setDailyHours(selectedPlan.daily_hours || 2.0);
          setSessionDuration(selectedPlan.session_duration || 45);
          setBreakDuration(selectedPlan.break_duration || 10);
          setSelectedSubjects(selectedPlan.subjects || []);
          setScoreTarget(selectedPlan.score_target?.toString() || "");
          setRankTarget(selectedPlan.rank_target || "");
          setDailyGoal(selectedPlan.daily_goal || "");
          setWeeklyGoal(selectedPlan.weekly_goal || "");
          
          localStorage.setItem("studyquest_plan_active", "true");
          localStorage.setItem("studyquest_student_name", selectedPlan.student_name || "");
          localStorage.setItem("studyquest_class_grade", selectedPlan.grade || "");
          localStorage.setItem("studyquest_exam_name", selectedPlan.name || "");
          localStorage.setItem("studyquest_exam_date", selectedPlan.date || "");
          localStorage.setItem("studyquest_daily_hours", selectedPlan.daily_hours.toString());
          localStorage.setItem("studyquest_session_duration", selectedPlan.session_duration.toString());
          localStorage.setItem("studyquest_break_duration", selectedPlan.break_duration.toString());
          localStorage.setItem("studyquest_selected_subjects", JSON.stringify(selectedPlan.subjects || []));
          localStorage.setItem("studyquest_score_target", selectedPlan.score_target?.toString() || "");
          localStorage.setItem("studyquest_rank_target", selectedPlan.rank_target || "");
          localStorage.setItem("studyquest_daily_goal", selectedPlan.daily_goal || "");
          localStorage.setItem("studyquest_weekly_goal", selectedPlan.weekly_goal || "");
        }
        
        updateStateFromDashboard(data);
        setPlansModalOpen(false);
        setSetupMode(false);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Switch plan local fallback trigger.");
    }
    
    // Fallback switch logic
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      setStudentName(selectedPlan.student_name || "");
      setClassGrade(selectedPlan.grade || "");
      setExamName(selectedPlan.name || "");
      setExamDate(selectedPlan.date || "");
      setDailyHours(selectedPlan.daily_hours || 2.0);
      setSessionDuration(selectedPlan.session_duration || 45);
      setBreakDuration(selectedPlan.break_duration || 10);
      setSelectedSubjects(selectedPlan.subjects || []);
      setScoreTarget(selectedPlan.score_target?.toString() || "");
      setRankTarget(selectedPlan.rank_target || "");
      setDailyGoal(selectedPlan.daily_goal || "");
      setWeeklyGoal(selectedPlan.weekly_goal || "");
      setUser({
        level: selectedPlan.level || 1,
        xp: selectedPlan.xp || 0,
        coins: selectedPlan.coins || 0,
        daily_streak: selectedPlan.daily_streak || 0,
        weekly_streak: 0,
        last_active: ""
      });
      setActiveExam({
        id: selectedPlan.id,
        name: selectedPlan.name,
        date: selectedPlan.date,
        daily_hours: selectedPlan.daily_hours,
        countdown_days: selectedPlan.countdown_days
      });
      setProgress(selectedPlan.progress_percentage || 0);
      
      const updatedPlans = plans.map(p => {
        if (p.id === planId) return { ...p, status: "Active", last_opened: new Date().toISOString() };
        if (p.status === "Active") return { ...p, status: "Completed" };
        return p;
      });
      setPlans(updatedPlans);
      localStorage.setItem("studyquest_all_plans", JSON.stringify(updatedPlans));
    }
    setPlansModalOpen(false);
    setSetupMode(false);
    setLoading(false);
  };

  const handleDuplicatePlan = async (planId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/plans/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: planId })
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
        localStorage.setItem("studyquest_all_plans", JSON.stringify(data));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Duplicate local fallback.");
    }
    
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      const newPlan = {
        ...selectedPlan,
        id: Math.max(...plans.map(p => p.id), 0) + 1,
        name: `${selectedPlan.name} (Copy)`,
        last_opened: new Date().toISOString()
      };
      const updatedPlans = [newPlan, ...plans];
      setPlans(updatedPlans);
      localStorage.setItem("studyquest_all_plans", JSON.stringify(updatedPlans));
    }
    setLoading(false);
  };

  const handleArchivePlan = async (planId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/plans/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: planId })
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
        localStorage.setItem("studyquest_all_plans", JSON.stringify(data));
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Archive local fallback.");
    }
    
    const updatedPlans = plans.map(p => {
      if (p.id === planId) return { ...p, status: "Archived" };
      return p;
    });
    setPlans(updatedPlans);
    localStorage.setItem("studyquest_all_plans", JSON.stringify(updatedPlans));
    setLoading(false);
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this study plan? This will permanently delete all history and progress for this plan.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/plans/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: planId })
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(data);
        localStorage.setItem("studyquest_all_plans", JSON.stringify(data));
        
        if (activeExam?.id === planId) {
          setSetupMode(true);
          localStorage.removeItem("studyquest_plan_active");
        }
        await fetchDashboardData();
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Delete local fallback.");
    }
    
    const updatedPlans = plans.filter(p => p.id !== planId);
    setPlans(updatedPlans);
    localStorage.setItem("studyquest_all_plans", JSON.stringify(updatedPlans));
    
    if (activeExam?.id === planId) {
      setSetupMode(true);
      localStorage.removeItem("studyquest_plan_active");
    }
    await fetchDashboardData();
    setLoading(false);
  };

  const handleEditPlan = (planId: number) => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (selectedPlan) {
      setStudentName(selectedPlan.student_name || "");
      setClassGrade(selectedPlan.grade || "");
      setExamName(selectedPlan.name || "");
      setExamDate(selectedPlan.date || "");
      setDailyHours(selectedPlan.daily_hours || 2.0);
      setSessionDuration(selectedPlan.session_duration || 45);
      setBreakDuration(selectedPlan.break_duration || 10);
      setSelectedSubjects(selectedPlan.subjects || []);
      setScoreTarget(selectedPlan.score_target?.toString() || "");
      setRankTarget(selectedPlan.rank_target || "");
      setDailyGoal(selectedPlan.daily_goal || "");
      setWeeklyGoal(selectedPlan.weekly_goal || "");
      
      setIsEditing(true);
      setSetupMode(true);
      setPlansModalOpen(false);
    }
  };

  // New expanded setup states
  const [classGrade, setClassGrade] = useState("");
  const [sessionDuration, setSessionDuration] = useState(45); // default 45 mins
  const [breakDuration, setBreakDuration] = useState(10); // default 10 mins
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [subjectDetails, setSubjectDetails] = useState<Record<string, {
    syllabus: string;
    difficulty: "Easy" | "Medium" | "Hard";
    priority: "Low" | "Medium" | "High";
    completion?: string;
  }>>({});
  const [scoreTarget, setScoreTarget] = useState("");
  const [rankTarget, setRankTarget] = useState("");
  const [dailyGoal, setDailyGoal] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Load initial onboarding form data from localStorage on mount (SSR-safe)
  useEffect(() => {
    const storedName = localStorage.getItem("studyquest_student_name");
    if (storedName) setStudentName(storedName);

    const storedReminder = localStorage.getItem("studyquest_reminder_time");
    if (storedReminder) setReminderTime(storedReminder);

    const storedGrade = localStorage.getItem("studyquest_class_grade");
    if (storedGrade) setClassGrade(storedGrade);

    const storedExamName = localStorage.getItem("studyquest_exam_name");
    if (storedExamName) setExamName(storedExamName);

    const storedExamDate = localStorage.getItem("studyquest_exam_date");
    if (storedExamDate) setExamDate(storedExamDate);

    const storedHours = localStorage.getItem("studyquest_daily_hours");
    if (storedHours) setDailyHours(parseFloat(storedHours));

    const storedSession = localStorage.getItem("studyquest_session_duration");
    if (storedSession) setSessionDuration(parseInt(storedSession, 10));

    const storedBreak = localStorage.getItem("studyquest_break_duration");
    if (storedBreak) setBreakDuration(parseInt(storedBreak, 10));

    const storedSubjects = localStorage.getItem("studyquest_selected_subjects");
    if (storedSubjects) {
      try {
        setSelectedSubjects(JSON.parse(storedSubjects));
      } catch (e) {
        console.error("Error parsing subjects", e);
      }
    }

    const storedDetails = localStorage.getItem("studyquest_subject_details");
    if (storedDetails) {
      try {
        setSubjectDetails(JSON.parse(storedDetails));
      } catch (e) {
        console.error("Error parsing subject details", e);
      }
    }

    const storedScoreTarget = localStorage.getItem("studyquest_score_target");
    if (storedScoreTarget) setScoreTarget(storedScoreTarget);

    const storedRankTarget = localStorage.getItem("studyquest_rank_target");
    if (storedRankTarget) setRankTarget(storedRankTarget);

    const storedDailyGoal = localStorage.getItem("studyquest_daily_goal");
    if (storedDailyGoal) setDailyGoal(storedDailyGoal);

    const storedWeeklyGoal = localStorage.getItem("studyquest_weekly_goal");
    if (storedWeeklyGoal) setWeeklyGoal(storedWeeklyGoal);

    fetchPreviousPlans();
  }, []);

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

  // Chat board state
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    setChatLoading(true);
    const msg = chatInput;
    setChatInput("");
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        const data = await res.json();
        updateStateFromDashboard(data);
      }
    } catch (e) {
      console.log("Chat error:", e);
    } finally {
      setChatLoading(false);
    }
  };

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
      const planActive = localStorage.getItem("studyquest_plan_active");
      if (planActive === "true") {
        const storedName = localStorage.getItem("studyquest_student_name") || "";
        const storedReminder = localStorage.getItem("studyquest_reminder_time") || "19:00";
        setStudentName(storedName);
        setReminderTime(storedReminder);
        loadMockSeededDemoState();
        setSetupMode(false);
      } else {
        setSetupMode(true);
      }
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
    setStudentName(data.student_name || "");
    setReminderTime(data.preferred_reminder_time || "19:00");
    
    if (data.active_exam) {
      localStorage.setItem("studyquest_plan_active", "true");
      if (data.student_name) localStorage.setItem("studyquest_student_name", data.student_name);
      if (data.preferred_reminder_time) localStorage.setItem("studyquest_reminder_time", data.preferred_reminder_time);
      setSetupMode(false);
    } else {
      localStorage.removeItem("studyquest_plan_active");
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

    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject to generate your study plan.");
      setLoading(false);
      return;
    }

    // Construct dynamic combined syllabus from selected subjects and custom details
    let combinedSyllabusParts: string[] = [];
    selectedSubjects.forEach((sub) => {
      const details = subjectDetails[sub];
      if (details && details.syllabus && details.syllabus.trim() !== "") {
        const topicsList = details.syllabus
          .split(/[,\n]/)
          .map(t => t.trim())
          .filter(Boolean);
        topicsList.forEach((t) => {
          combinedSyllabusParts.push(`${sub}: ${t}`);
        });
      } else {
        // Generate default topics for this subject
        const subLower = sub.toLowerCase();
        let subTopics: string[] = [];
        if (subLower.includes("calculus") || subLower.includes("math")) {
          subTopics = ["Limits & Continuity", "Derivatives", "Applications of Derivatives", "Integrals", "Applications of Integrals", "Differential Equations"];
        } else if (subLower.includes("chemistry")) {
          subTopics = ["Atomic Structure", "Chemical Bonding", "Stoichiometry", "States of Matter", "Chemical Kinetics", "Organic Chemistry"];
        } else if (subLower.includes("physics")) {
          subTopics = ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Quantum Physics", "Nuclear Physics"];
        } else if (subLower.includes("biology")) {
          subTopics = ["Cell Division", "Genetics", "Human Reproduction", "Evolution", "Ecology", "Biotechnology"];
        } else {
          subTopics = [
            `Fundamentals of ${sub}`,
            `Core ${sub} Concepts`,
            `Advanced ${sub} Topics`,
            `${sub} Practice & Review`
          ];
        }
        subTopics.forEach((t) => {
          combinedSyllabusParts.push(`${sub}: ${t}`);
        });
      }
    });

    const combinedSyllabus = combinedSyllabusParts.join(", ");
    const examNameToUse = examName.trim() || selectedSubjects.join(", ");

    try {
      const res = await fetch(`${API_BASE}/api/plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: examNameToUse,
          date: examDate,
          daily_hours: dailyHours,
          syllabus: combinedSyllabus,
          reminder_time: reminderTime,
          student_name: studentName,
          grade: classGrade,
          session_duration: sessionDuration,
          break_duration: breakDuration,
          score_target: scoreTarget ? parseInt(scoreTarget) : null,
          rank_target: rankTarget,
          daily_goal: dailyGoal,
          weekly_goal: weeklyGoal,
          edit_exam_id: (isEditing && activeExam) ? activeExam.id : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        
        // Save additional details in localStorage
        localStorage.setItem("studyquest_plan_active", "true");
        localStorage.setItem("studyquest_student_name", studentName);
        localStorage.setItem("studyquest_class_grade", classGrade);
        localStorage.setItem("studyquest_exam_name", examName);
        localStorage.setItem("studyquest_exam_date", examDate);
        localStorage.setItem("studyquest_daily_hours", dailyHours.toString());
        localStorage.setItem("studyquest_session_duration", sessionDuration.toString());
        localStorage.setItem("studyquest_break_duration", breakDuration.toString());
        localStorage.setItem("studyquest_selected_subjects", JSON.stringify(selectedSubjects));
        localStorage.setItem("studyquest_subject_details", JSON.stringify(subjectDetails));
        localStorage.setItem("studyquest_score_target", scoreTarget);
        localStorage.setItem("studyquest_rank_target", rankTarget);
        localStorage.setItem("studyquest_daily_goal", dailyGoal);
        localStorage.setItem("studyquest_weekly_goal", weeklyGoal);
        localStorage.setItem("studyquest_reminder_time", reminderTime);

        updateStateFromDashboard(data);
        setIsEditing(false);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Setup local fallback trigger.");
    }

    // Client-side mock setup for offline testing
    localStorage.setItem("studyquest_plan_active", "true");
    localStorage.setItem("studyquest_student_name", studentName);
    localStorage.setItem("studyquest_class_grade", classGrade);
    localStorage.setItem("studyquest_exam_name", examName);
    localStorage.setItem("studyquest_exam_date", examDate);
    localStorage.setItem("studyquest_daily_hours", dailyHours.toString());
    localStorage.setItem("studyquest_session_duration", sessionDuration.toString());
    localStorage.setItem("studyquest_break_duration", breakDuration.toString());
    localStorage.setItem("studyquest_selected_subjects", JSON.stringify(selectedSubjects));
    localStorage.setItem("studyquest_subject_details", JSON.stringify(subjectDetails));
    localStorage.setItem("studyquest_score_target", scoreTarget);
    localStorage.setItem("studyquest_rank_target", rankTarget);
    localStorage.setItem("studyquest_daily_goal", dailyGoal);
    localStorage.setItem("studyquest_weekly_goal", weeklyGoal);
    localStorage.setItem("studyquest_reminder_time", reminderTime);

    let parsedTopics = combinedSyllabus.split(",").map(t => t.trim()).filter(Boolean);

    const mockTopics = parsedTopics.map((name, i) => ({
      id: i + 1,
      name,
      status: "pending",
      confidence_score: 0
    }));

    setTopics(mockTopics);
    setActiveExam({
      id: 1,
      name: examNameToUse,
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
    setCoachMessage({
      id: 99,
      content: `Your study roadmap has been successfully compiled by the Planner Agent! You have ${parsedTopics.length} topics scheduled over 30 days. Let's start with '${parsedTopics[0]}'.`,
      type: "planner",
      timestamp: new Date().toLocaleTimeString()
    });
    setAgentTraces([
      {
        agent_name: "Planner Agent",
        action: "Compiled study roadmap",
        output_summary: `Plan generated for '${examNameToUse}' exam. Seeded ${parsedTopics.length} syllabus topics with mock buffer intervals.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
    setFallbackMode(true);
    setSetupMode(false);
    setIsEditing(false);
    setLoading(false);
  };

  const handleCompleteMission = async () => {
    setLoading(true);
    setCompleteModalOpen(false);

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
        setLoading(false);
        return;
      }
    } catch (err) {
      console.log("Complete local fallback trigger.");
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

    // Dynamic spaced repetition offsets (Phase 2):
    // Confidence 1: 1 day, 2: 2 days, 3: 3 days, 4: 5 days, 5: 7 days
    let revOffset = 7;
    if (confidence === 1) revOffset = 1;
    else if (confidence === 2) revOffset = 2;
    else if (confidence === 3) revOffset = 3;
    else if (confidence === 4) revOffset = 5;
    
    const revDate = new Date();
    revDate.setDate(revDate.getDate() + revOffset);

    const activeTopicName = todayMission?.title.replace("Study ", "") || "Topic";

    const newRevision = {
      id: 201,
      topic_id: todayMission?.topic_id || 1,
      topic_name: activeTopicName,
      scheduled_date: revDate.toISOString().split("T")[0],
      confidence_score: confidence,
      is_completed: false
    };

    setRevisions([newRevision]);
    setProgress(roundValue(mockProgress));
    setReadiness(roundValue(mockReadiness));
    setTodayMission(null); // Cleared today's task

    // Update Coach recommendation text & Tomorrow workload adjusted
    setCoachMessage({
      id: 100,
      content: confidence <= 2
        ? `Your confidence for '${activeTopicName}' was low (${confidence}/5), so I scheduled the next review earlier and kept tomorrow's workload under ${activeExam?.daily_hours || 2} hours.`
        : `'${activeTopicName}' is now complete with confidence ${confidence}/5. I scheduled your next review in ${revOffset} days. Tomorrow's workload has been adjusted to protect your ${activeExam?.daily_hours || 2}-hour study limit.`,
      type: "success",
      timestamp: new Date().toLocaleTimeString()
    });

    // Populate mock collaboration logs
    const mockTraces = [
      {
        agent_name: "Coach Agent",
        action: "Generated coaching insight",
        output_summary: confidence <= 2 
          ? `Your confidence for '${activeTopicName}' was low (${confidence}/5), so I scheduled the next review earlier and kept tomorrow's workload under ${activeExam?.daily_hours || 2} hours.`
          : `'${activeTopicName}' is now complete. I scheduled your next review in ${revOffset} days...`,
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
        output_summary: `Next review of '${activeTopicName}' scheduled in ${revOffset} days (${revDate.toISOString().split("T")[0]}) based on confidence ${confidence}/5.`,
        timestamp: new Date().toLocaleTimeString()
      },
      {
        agent_name: "Execution Agent",
        action: "Marked session complete",
        output_summary: `Completed '${activeTopicName}' session. Time spent: ${actualHours} hours, Confidence: ${confidence}/5.`,
        timestamp: new Date().toLocaleTimeString()
      }
    ];

    setAgentTraces(mockTraces);
    setLoading(false);
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/demo/reset`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        
        // Populate local storage for editing
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const examDateStr = futureDate.toISOString().split("T")[0];
        
        localStorage.setItem("studyquest_plan_active", "true");
        localStorage.setItem("studyquest_student_name", "Alex");
        localStorage.setItem("studyquest_class_grade", "Grade 12");
        localStorage.setItem("studyquest_exam_name", "Biology");
        localStorage.setItem("studyquest_exam_date", examDateStr);
        localStorage.setItem("studyquest_daily_hours", "2.0");
        localStorage.setItem("studyquest_session_duration", "45");
        localStorage.setItem("studyquest_break_duration", "10");
        localStorage.setItem("studyquest_selected_subjects", JSON.stringify(["Biology"]));
        localStorage.setItem("studyquest_subject_details", JSON.stringify({
          "Biology": {
            syllabus: "Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology",
            difficulty: "Medium",
            priority: "High",
            completion: "0"
          }
        }));
        localStorage.setItem("studyquest_score_target", "85");
        localStorage.setItem("studyquest_rank_target", "Top 5%");
        localStorage.setItem("studyquest_daily_goal", "Study 2 hours");
        localStorage.setItem("studyquest_weekly_goal", "Study 12 hours");
        localStorage.setItem("studyquest_reminder_time", "19:00");

        setStudentName("Alex");
        setClassGrade("Grade 12");
        setExamName("Biology");
        setExamDate(examDateStr);
        setDailyHours(2.0);
        setSessionDuration(45);
        setBreakDuration(10);
        setSelectedSubjects(["Biology"]);
        setSubjectDetails({
          "Biology": {
            syllabus: "Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology",
            difficulty: "Medium",
            priority: "High",
            completion: "0"
          }
        });
        setScoreTarget("85");
        setRankTarget("Top 5%");
        setDailyGoal("Study 2 hours");
        setWeeklyGoal("Study 12 hours");
        setReminderTime("19:00");

        updateStateFromDashboard(data);
        setIsEditing(false);
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

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const examDateStr = futureDate.toISOString().split("T")[0];

    localStorage.setItem("studyquest_plan_active", "true");
    localStorage.setItem("studyquest_student_name", "Alex");
    localStorage.setItem("studyquest_class_grade", "Grade 12");
    localStorage.setItem("studyquest_exam_name", "Biology");
    localStorage.setItem("studyquest_exam_date", examDateStr);
    localStorage.setItem("studyquest_daily_hours", "2.0");
    localStorage.setItem("studyquest_session_duration", "45");
    localStorage.setItem("studyquest_break_duration", "10");
    localStorage.setItem("studyquest_selected_subjects", JSON.stringify(["Biology"]));
    localStorage.setItem("studyquest_subject_details", JSON.stringify({
      "Biology": {
        syllabus: "Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology",
        difficulty: "Medium",
        priority: "High",
        completion: "0"
      }
    }));
    localStorage.setItem("studyquest_score_target", "85");
    localStorage.setItem("studyquest_rank_target", "Top 5%");
    localStorage.setItem("studyquest_daily_goal", "Study 2 hours");
    localStorage.setItem("studyquest_weekly_goal", "Study 12 hours");
    localStorage.setItem("studyquest_reminder_time", "19:00");

    setStudentName("Alex");
    setClassGrade("Grade 12");
    setExamName("Biology");
    setExamDate(examDateStr);
    setDailyHours(2.0);
    setSessionDuration(45);
    setBreakDuration(10);
    setSelectedSubjects(["Biology"]);
    setSubjectDetails({
      "Biology": {
        syllabus: "Cell Division, Genetics, Human Reproduction, Evolution, Ecology, Biotechnology",
        difficulty: "Medium",
        priority: "High",
        completion: "0"
      }
    });
    setScoreTarget("85");
    setRankTarget("Top 5%");
    setDailyGoal("Study 2 hours");
    setWeeklyGoal("Study 12 hours");
    setReminderTime("19:00");

    setActiveExam({
      id: 1,
      name: "Biology",
      date: examDateStr,
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
    setIsEditing(false);
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

  const getSelectedSubjects = () => {
    if (selectedSubjects && selectedSubjects.length > 0) {
      return selectedSubjects;
    }
    // Fallback: extract from active topics list (e.g. "Physics: Mechanics" -> "Physics")
    const extracted = new Set<string>();
    topics.forEach((t) => {
      if (t.name && t.name.includes(":")) {
        extracted.add(t.name.split(":")[0].trim());
      }
    });
    if (extracted.size > 0) {
      return Array.from(extracted);
    }
    if (activeExam?.name) {
      return activeExam.name.split(",").map((s: string) => s.trim());
    }
    return [];
  };

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

          {/* Load Demo Button */}
          <button 
            onClick={handleResetDemo}
            className="text-xs px-3 py-1.5 rounded bg-gradient-to-r from-brand-mint/20 to-brand-cobalt/20 border border-brand-mint/30 hover:border-brand-mint/60 hover:from-brand-mint/35 hover:to-brand-cobalt/35 text-brand-mint font-bold transition-all cursor-pointer font-sans"
          >
            Load Demo
          </button>

          {/* Settings Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="text-xs px-3 py-1.5 rounded bg-white/5 border border-border-subtle hover:bg-white/10 hover:border-gray-400 text-gray-300 font-bold transition-all cursor-pointer font-sans flex items-center gap-1.5"
            >
              {Icons.Gear()} Settings
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg bg-bg-base border border-border-subtle shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    fetchPreviousPlans();
                    setPlansModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 font-sans font-semibold cursor-pointer transition-colors border-b border-white/5 flex items-center gap-1.5"
                >
                  📚 Previous Study Plans
                </button>
                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    setIsEditing(true);
                    setSetupMode(true);
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-white/5 font-sans font-semibold cursor-pointer transition-colors border-b border-white/5"
                >
                  Edit Study Plan
                </button>
                <button
                  onClick={async () => {
                    setSettingsOpen(false);
                    setLoading(true);
                    setIsEditing(false);
                    
                    // Clear localStorage setup values
                    localStorage.removeItem("studyquest_plan_active");
                    localStorage.removeItem("studyquest_student_name");
                    localStorage.removeItem("studyquest_class_grade");
                    localStorage.removeItem("studyquest_exam_name");
                    localStorage.removeItem("studyquest_exam_date");
                    localStorage.removeItem("studyquest_daily_hours");
                    localStorage.removeItem("studyquest_session_duration");
                    localStorage.removeItem("studyquest_break_duration");
                    localStorage.removeItem("studyquest_selected_subjects");
                    localStorage.removeItem("studyquest_subject_details");
                    localStorage.removeItem("studyquest_score_target");
                    localStorage.removeItem("studyquest_rank_target");
                    localStorage.removeItem("studyquest_daily_goal");
                    localStorage.removeItem("studyquest_weekly_goal");
                    localStorage.removeItem("studyquest_reminder_time");

                    // Clear states
                    setStudentName("");
                    setClassGrade("");
                    setExamName("");
                    setExamDate("");
                    setDailyHours(2.0);
                    setSessionDuration(45);
                    setBreakDuration(10);
                    setSelectedSubjects([]);
                    setSubjectDetails({});
                    setScoreTarget("");
                    setRankTarget("");
                    setDailyGoal("");
                    setWeeklyGoal("");

                    try {
                      const res = await fetch(`${API_BASE}/api/plans/reset`, { method: "POST" });
                      if (res.ok) {
                        setSetupMode(true);
                      }
                    } catch (e) {
                      console.log("Offline plan reset.");
                      setSetupMode(true);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-white/5 font-sans font-semibold cursor-pointer transition-colors"
                >
                  Create New Study Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-6 max-w-[1400px] w-full mx-auto gap-6 justify-center">
        {setupMode ? (
          /* SETUP WIZARD VIEW */
          <div className="max-w-5xl w-full mx-auto animate-fade-in space-y-6">
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-brand-mint via-brand-cobalt to-brand-amethyst bg-clip-text text-transparent">
                {isEditing ? "Modify Your Study Quest" : "Embark on Your Study Quest"}
              </h2>
              <p className="text-gray-400 text-sm mt-2 max-w-lg mx-auto font-sans">
                {isEditing 
                  ? "Adjust your academic path. The Planner Agent will re-generate your daily missions." 
                  : "Define your academic targets. The Planner Agent will dissect your syllabus and distribute daily missions."}
              </p>
            </div>

            <form onSubmit={handleSetupRoadmap} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Setup Configurations (Span 5) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Section 1: Student Information */}
                <div className="bg-[#1F2937] border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#06B6D4] font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
                    <span>👤</span> Student Profile
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Student Name</label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="e.g. Alex"
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Class / Grade (Optional)</label>
                      <input
                        type="text"
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        placeholder="e.g. Grade 12"
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Preferred Study Reminder Time</label>
                    <input
                      type="time"
                      required
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-brand-mint text-white font-mono"
                    />
                  </div>
                </div>

                {/* Section 2: Target Exam */}
                <div className="bg-[#1F2937] border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-brand-mint font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
                    <span>🎯</span> Exam & Timeline
                  </h3>
                  
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Target Exam Name</label>
                    <input
                      type="text"
                      required
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="e.g. Semester Finals, SAT Exam"
                      className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Exam Date</label>
                      <input
                        type="date"
                        required
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Study Hours per Day</label>
                      <input
                        type="number"
                        min="0.5"
                        max="12"
                        step="0.5"
                        required
                        value={Number.isNaN(dailyHours) ? "" : dailyHours}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDailyHours(val === "" ? "" as any : parseFloat(val));
                        }}
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Focus Session Duration</label>
                      <select
                        value={sessionDuration}
                        onChange={(e) => setSessionDuration(parseInt(e.target.value, 10))}
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                      >
                        <option value="25">25 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="90">90 minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Break Duration (Minutes)</label>
                      <input
                        type="number"
                        min="2"
                        max="30"
                        required
                        value={breakDuration}
                        onChange={(e) => setBreakDuration(parseInt(e.target.value, 10) || 5)}
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Study Goals */}
                <div className="bg-[#1F2937] border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
                    <span>🏆</span> Quest Targets
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Score Target (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={scoreTarget}
                        onChange={(e) => setScoreTarget(e.target.value)}
                        placeholder="e.g. 95"
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Rank Target (Optional)</label>
                      <input
                        type="text"
                        value={rankTarget}
                        onChange={(e) => setRankTarget(e.target.value)}
                        placeholder="e.g. Top 10"
                        className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Daily Study Goal</label>
                    <input
                      type="text"
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(e.target.value)}
                      placeholder="e.g. Complete 2 Focus sessions"
                      className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">Weekly Study Goal</label>
                    <input
                      type="text"
                      value={weeklyGoal}
                      onChange={(e) => setWeeklyGoal(e.target.value)}
                      placeholder="e.g. Complete 10 Focus sessions"
                      className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white font-sans"
                    />
                  </div>
                </div>

                {/* Section 4: Syllabus file uploader */}
                <div className="bg-[#1F2937] border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-amber-500 font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
                    <span>📄</span> Syllabus Ingestion
                  </h3>
                  
                  <div className="border border-dashed border-gray-700/60 p-4 rounded-xl bg-black/10">
                    <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-2">
                      Upload Syllabus (.pdf, .txt)
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
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider mb-1">Extracted Topics ({candidateTopics.length}):</p>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-black/40 rounded border border-border-subtle/30">
                          {candidateTopics.map((topic, i) => (
                            <span key={i} className="text-[9px] font-mono bg-brand-mint/10 text-brand-mint px-2 py-0.5 rounded border border-brand-mint/20">
                              {topic}
                            </span>
                          ))}
                        </div>
                        
                        {selectedSubjects.length > 0 && (
                          <div className="flex items-center gap-2 pt-1.5">
                            <span className="text-[10px] text-gray-400 font-sans">Apply topics to:</span>
                            <div className="flex flex-wrap gap-2 flex-1">
                              {selectedSubjects.map((sub) => (
                                <button
                                  key={sub}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setSubjectDetails(prev => ({
                                      ...prev,
                                      [sub]: {
                                        ...prev[sub],
                                        syllabus: (prev[sub]?.syllabus ? prev[sub].syllabus + ", " : "") + candidateTopics.join(", ")
                                      }
                                    }));
                                    alert(`Successfully appended extracted topics to ${sub}!`);
                                  }}
                                  className="text-[9px] font-mono bg-brand-cobalt/10 text-brand-cobalt hover:bg-brand-cobalt/25 px-2 py-1 rounded border border-brand-cobalt/35 font-bold transition-all"
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Subjects Selection & Details (Span 7) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Section 5: Subjects Selector grid */}
                <div className="bg-[#1F2937] border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-[#06B6D4] font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
                    <span>📚</span> Select Study Subjects
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {["Physics", "Chemistry", "Biology", "Mathematics", "English", "Computer Science", "History", "Geography", "Economics"].map((sub) => {
                      const isSelected = selectedSubjects.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                            } else {
                              setSelectedSubjects([...selectedSubjects, sub]);
                              if (!subjectDetails[sub]) {
                                setSubjectDetails(prev => ({
                                  ...prev,
                                  [sub]: {
                                    syllabus: "",
                                    difficulty: "Medium",
                                    priority: "Medium",
                                    completion: "0"
                                  }
                                }));
                              }
                            }
                          }}
                          className={`text-xs font-sans px-3.5 py-2 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected 
                              ? "bg-brand-mint/15 text-brand-mint border-brand-mint/40 font-bold" 
                              : "bg-white/5 text-gray-400 border-border-subtle hover:bg-white/10 hover:border-gray-500"
                          }`}
                        >
                          {isSelected && <span>✓</span>}
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Custom subject block */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter custom subject..."
                      className="flex-1 bg-black/40 border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        const sub = customSubject.trim();
                        if (sub) {
                          if (!selectedSubjects.includes(sub)) {
                            setSelectedSubjects([...selectedSubjects, sub]);
                            setSubjectDetails(prev => ({
                              ...prev,
                              [sub]: {
                                syllabus: "",
                                difficulty: "Medium",
                                priority: "Medium",
                                completion: "0"
                              }
                            }));
                          }
                          setCustomSubject("");
                        }
                      }}
                      className="bg-brand-cobalt text-bg-base hover:opacity-90 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer font-sans"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Section 6: Dynamic Subject Details list */}
                {selectedSubjects.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 px-1">Subject Configurations</h4>
                    
                    {selectedSubjects.map((sub) => {
                      const details = subjectDetails[sub] || { syllabus: "", difficulty: "Medium", priority: "Medium", completion: "0" };
                      return (
                        <div key={sub} className="bg-[#1F2937] border border-gray-800 p-5 rounded-xl shadow-md space-y-4">
                          <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-brand-mint inline-block"></span>
                              {sub}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
                              }}
                              className="text-[10px] font-mono text-red-400 hover:text-red-300 font-bold"
                            >
                              Remove Subject
                            </button>
                          </div>
                          
                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Chapters / Syllabus (Optional, comma-separated)</label>
                              <textarea
                                value={details.syllabus || ""}
                                onChange={(e) => setSubjectDetails(prev => ({
                                  ...prev,
                                  [sub]: { ...details, syllabus: e.target.value }
                                }))}
                                rows={2}
                                placeholder="e.g. Genetics, Photosynthesis, Human Anatomy"
                                className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-mint text-white resize-none"
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Difficulty</label>
                                <div className="flex gap-1 bg-black/20 p-0.5 rounded border border-border-subtle/50">
                                  {["Easy", "Medium", "Hard"].map((lvl) => (
                                    <button
                                      key={lvl}
                                      type="button"
                                      onClick={() => setSubjectDetails(prev => ({
                                        ...prev,
                                        [sub]: { ...details, difficulty: lvl as any }
                                      }))}
                                      className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                                        details.difficulty === lvl 
                                          ? "bg-brand-mint text-bg-base font-bold shadow" 
                                          : "text-gray-400 hover:bg-white/5"
                                      }`}
                                    >
                                      {lvl}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Priority</label>
                                <div className="flex gap-1 bg-black/20 p-0.5 rounded border border-border-subtle/50">
                                  {["Low", "Medium", "High"].map((pri) => (
                                    <button
                                      key={pri}
                                      type="button"
                                      onClick={() => setSubjectDetails(prev => ({
                                        ...prev,
                                        [sub]: { ...details, priority: pri as any }
                                      }))}
                                      className={`flex-1 py-1 rounded text-[10px] font-mono transition-all ${
                                        details.priority === pri 
                                          ? "bg-[#06B6D4] text-bg-base font-bold shadow" 
                                          : "text-gray-400 hover:bg-white/5"
                                      }`}
                                    >
                                      {pri}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">Estimated Completion %</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={details.completion || ""}
                                  onChange={(e) => setSubjectDetails(prev => ({
                                    ...prev,
                                    [sub]: { ...details, completion: e.target.value }
                                  }))}
                                  placeholder="0"
                                  className="w-full bg-black/40 border border-border-subtle rounded-lg px-3 py-1 text-xs focus:outline-none focus:border-brand-mint text-white text-center font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-brand-mint via-brand-cobalt to-brand-amethyst text-bg-base font-black text-sm py-4 rounded-xl hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer font-sans uppercase tracking-wider shadow-lg shadow-cyan-500/10"
                >
                  {isEditing ? "Save & Re-generate Quest" : "Generate My Study Quest"}
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* PRIMARY DASHBOARD COMMAND CENTER */
          <div className="flex-1 flex flex-col gap-6 animate-fade-in">
            
            {/* Hero Mission Card */}
            <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
              <div className="absolute top-0 right-0 bg-[#06B6D4]/10 text-[#06B6D4] font-mono text-[9px] uppercase px-3 py-1.5 rounded-bl font-bold tracking-wider">
                Active Study Mission
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#06B6D4] uppercase tracking-widest font-bold">Today's Study Mission</span>
                    <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white mt-1">
                      {todayMission ? todayMission.title : "All Missions Complete!"}
                    </h2>
                    <div className="flex flex-col gap-2 mt-2">
                      {activeExam && (
                        <p className="text-xs text-gray-400 flex items-center gap-1.5 font-mono">
                          Target Exam: <span className="text-[#06B6D4] font-bold">{activeExam.name}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {getSelectedSubjects().map((sub: string, i: number) => (
                          <span key={i} className="text-[9px] font-mono bg-brand-mint/15 text-brand-mint px-2 py-0.5 rounded border border-brand-mint/20 font-bold uppercase tracking-wider">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {todayMission ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                      <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                        <p className="text-[10px] font-mono text-gray-400 uppercase">Duration</p>
                        <p className="text-sm font-bold text-white mt-0.5">{todayMission.duration_hours} hrs</p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                        <p className="text-[10px] font-mono text-gray-400 uppercase">Focus Intervals</p>
                        <p className="text-sm font-bold text-white mt-0.5">{Math.ceil(todayMission.duration_hours * 2)} Sessions</p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                        <p className="text-[10px] font-mono text-gray-400 uppercase">XP Reward</p>
                        <p className="text-sm font-bold text-white mt-0.5">+120 XP</p>
                      </div>
                      <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                        <p className="text-[10px] font-mono text-gray-400 uppercase">Coins Reward</p>
                        <p className="text-sm font-bold text-white mt-0.5">+15 Coins</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Excellent job! You have cleared all planned roadmap missions for today. Check your revision queue for spaced review sessions.</p>
                  )}

                  {todayMission && (
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono text-gray-400">
                      <span className="flex items-center gap-1">
                        🗓️ Exam Countdown: <strong className="text-[#F59E0B]">{activeExam?.countdown_days} days left</strong>
                      </span>
                      <span>
                        🔄 Next Spaced Repetition: <strong>{revisions.length > 0 ? revisions[0].scheduled_date : "No reviews due"}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {todayMission && (
                  <div className="flex flex-row md:flex-col lg:flex-row gap-4 lg:self-center">
                    <button
                      onClick={() => setPomoActive(true)}
                      className="flex-1 md:flex-initial bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer font-sans"
                    >
                      Start Mission
                    </button>
                    <button
                      onClick={() => {
                        setConfidence(3);
                        setActualHours(todayMission.duration_hours);
                        setCompleteModalOpen(true);
                      }}
                      className="flex-1 md:flex-initial bg-gradient-to-r from-[#10B981] to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-bg-base font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer font-sans"
                    >
                      Mark Complete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3-Column Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Card 1 – Study Progress */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Study Progress</h4>
                  <div className="flex items-center justify-center py-4">
                    <div className="relative w-36 h-36">
                      {/* Circular Progress Ring */}
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="58" strokeWidth="8" stroke="#111827" fill="transparent" />
                        <circle cx="72" cy="72" r="58" strokeWidth="8" stroke="#06B6D4" fill="transparent"
                                strokeDasharray={364.4}
                                strokeDashoffset={364.4 - (364.4 * progress) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-500 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-white">{progress}%</span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">Readiness</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 mt-2 space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Countdown:</span>
                    <span className="text-[#F59E0B] font-bold">{activeExam?.countdown_days} Days Left</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-gray-400">Readiness Index:</span>
                    <span className="text-[#10B981] font-bold">{readiness}% Mastery</span>
                  </div>
                </div>
              </div>

              {/* Card 2 – Upcoming Revisions */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div className="flex-1">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Upcoming Revisions</h4>
                  {revisions.length === 0 ? (
                    <div className="h-44 flex items-center justify-center text-xs text-gray-500 font-mono text-center">
                      <div>
                        <p className="text-lg mb-1">📅</p>
                        <p>No upcoming revisions.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {revisions.map((rev) => (
                        <div key={rev.id} className="p-3 bg-black/20 border border-gray-800 rounded-xl text-xs hover:border-purple-500/40 transition-colors">
                          <h5 className="font-bold text-white">{rev.topic_name}</h5>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
                            <span>Due: {rev.scheduled_date}</span>
                            <span className="text-purple-400">Confidence: {rev.confidence_score}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-800 pt-3 mt-4 text-[10px] font-mono text-gray-500 text-center uppercase">
                  Spaced repetition tracker active
                </div>
              </div>

              {/* Card 3 – Pomodoro Timer */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div className="text-center">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Pomodoro Focus Timer</h4>
                  
                  <div className="py-6 flex flex-col items-center">
                    <span className={`text-5xl font-extrabold font-mono tracking-wider text-white ${pomoActive ? "animate-pulse" : ""}`}>
                      {pomoMinutes.toString().padStart(2, "0")}:{pomoSeconds.toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-[#06B6D4] mt-2 font-mono uppercase tracking-wider bg-[#06B6D4]/10 px-3 py-1 rounded-full font-bold">
                      Focus Interval #{pomoCount + 1}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setPomoActive(!pomoActive)}
                    className={`flex-1 font-mono text-xs py-2.5 rounded-lg border font-bold cursor-pointer transition-all ${
                      pomoActive 
                        ? "border-[#EF4444]/30 text-[#EF4444] bg-[#EF4444]/5 hover:bg-[#EF4444]/10" 
                        : "border-[#06B6D4]/30 text-[#06B6D4] bg-[#06B6D4]/5 hover:bg-[#06B6D4]/10"
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
                    className="px-4 font-mono text-xs py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-white/5 cursor-pointer"
                  >
                    RESET
                  </button>
                </div>
              </div>

              {/* Card 4 – AI Coach */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div>
                  <div className="flex items-center gap-3 border-b border-gray-800 pb-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#06B6D4] to-blue-500 flex items-center justify-center text-white font-bold font-mono">
                      🤖
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">AI Coach Advisor {studentName ? `for ${studentName}` : ""}</h4>
                      <p className="text-[10px] text-gray-400 font-mono">{coachMessage?.timestamp || "Active"}</p>
                    </div>
                  </div>
                  <div className="bg-black/20 border border-gray-800 p-3 rounded-xl min-h-[96px] text-xs text-gray-200 leading-relaxed font-sans flex flex-col justify-between">
                    {chatLoading ? (
                      <div className="flex items-center gap-1.5 text-gray-400 font-mono italic animate-pulse py-4">
                        <span>🤖 Coach Agent is analyzing...</span>
                      </div>
                    ) : (
                      <div>
                        {studentName && !coachMessage?.content?.includes(studentName) ? `Hi ${studentName}! ` : ""}"{coachMessage?.content}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Ask study coach (e.g., 'What should I study next?', 'show plan', 'show revisions')..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSendChat();
                      }}
                      disabled={chatLoading}
                      className="flex-1 bg-black/40 border border-gray-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#06B6D4] text-white font-sans disabled:opacity-55"
                    />
                    <button 
                      onClick={handleSendChat}
                      disabled={chatLoading}
                      className="bg-[#06B6D4] hover:bg-[#0891B2] disabled:bg-gray-800 disabled:text-gray-500 text-bg-base px-3 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer disabled:cursor-not-allowed border border-cyan-500/20 disabled:border-gray-700"
                    >
                      {chatLoading ? "..." : "SEND"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 5 – Agent Activity Log */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3 mb-3">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-gray-400">Agent Activity Log</h4>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${
                      fallbackMode 
                        ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" 
                        : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                    }`}>
                      {fallbackMode ? "Fallback active" : "ADK Live"}
                    </span>
                  </div>

                  <div className="space-y-3.5 max-h-[160px] overflow-y-auto pr-1 font-mono">
                    {agentTraces.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-500">
                        No traces captured.
                      </div>
                    ) : (
                      agentTraces.map((trace, idx) => {
                        let agentBadge = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                        if (trace.agent_name.includes("Execution")) agentBadge = "bg-teal-500/10 text-teal-400 border-teal-500/20";
                        else if (trace.agent_name.includes("Revision")) agentBadge = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                        else if (trace.agent_name.includes("Motivation")) agentBadge = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        else if (trace.agent_name.includes("Coach")) agentBadge = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";

                        return (
                          <div key={idx} className="text-[11px] leading-relaxed border-l-2 border-gray-800 pl-2 py-0.5">
                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                              <span className={`px-1.5 py-0.2 rounded border uppercase font-bold text-[9px] ${agentBadge}`}>
                                {trace.agent_name}
                              </span>
                              <span>{trace.timestamp}</span>
                            </div>
                            <p className="text-gray-300 font-bold mt-1 text-[11px]">{trace.action}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5">{trace.output_summary}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-3 mt-4 text-[10px] font-mono text-gray-500 text-center uppercase">
                  Multi-Agent Coordinator Active
                </div>
              </div>

              {/* Card 6 – Syllabus Overview */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400">Syllabus Overview</h4>
                    <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded-full font-bold">
                      {topics.filter(t => t.status === "completed").length}/{topics.length} Done
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {topics.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-800/40 last:border-0">
                        <span className="text-gray-200 truncate pr-2 font-medium">{t.name}</span>
                        {t.status === "completed" ? (
                          <span className="text-[#10B981] font-mono font-bold text-[10px] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/20">
                            Completed
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-gray-800">
                            Pending
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 mt-4 flex justify-between text-[10px] font-mono text-gray-500 uppercase">
                  <span>Completed: {topics.filter(t => t.status === "completed").length}</span>
                  <span>Remaining: {topics.filter(t => t.status !== "completed").length}</span>
                </div>
              </div>

              {/* Card 7 – Study Statistics */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Study Statistics</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                      <p className="text-[10px] font-mono text-gray-400 uppercase">Total XP</p>
                      <p className="text-base font-bold text-white mt-0.5">{user.xp} XP</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                      <p className="text-[10px] font-mono text-gray-400 uppercase">Streak</p>
                      <p className="text-base font-bold text-[#F59E0B] mt-0.5">{user.daily_streak} Days</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                      <p className="text-[10px] font-mono text-gray-400 uppercase">Coins</p>
                      <p className="text-base font-bold text-white mt-0.5">{user.coins} Coins</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3 border border-gray-800">
                      <p className="text-[10px] font-mono text-gray-400 uppercase">Hours</p>
                      <p className="text-base font-bold text-white mt-0.5">{(progress * 0.15).toFixed(1)} hrs</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-mono">Rank Level:</span>
                  <span className="text-[#06B6D4] font-bold">LV.{user.level} Quest Elite</span>
                </div>
              </div>

              {/* Card 8 – Unlocked Badges */}
              <div className="bg-[#1F2937] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 hover:shadow-cyan-500/5 hover:-translate-y-0.5">
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-4">Unlocked Badges</h4>
                  <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                    {achievements.map((ach) => (
                      <div 
                        key={ach.id} 
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                          ach.is_unlocked 
                            ? "bg-amber-500/5 border-amber-500/20" 
                            : "bg-white/5 border-gray-800/40 opacity-50"
                        }`}
                      >
                        <div className={`p-1.5 rounded ${ach.is_unlocked ? "bg-amber-500/10 text-amber-500" : "bg-white/10 text-gray-500"}`}>
                          {Icons.Trophy()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold truncate text-white">{ach.name}</h5>
                          <p className="text-[10px] text-gray-400 truncate">{ach.description}</p>
                        </div>
                        {ach.is_unlocked && (
                          <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold uppercase">
                            UNLOCKED
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-3 mt-4 text-[10px] font-mono text-gray-500 text-center uppercase">
                  Quest Achievements Active
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
            <h3 className="text-lg font-bold tracking-tight mb-4 border-b border-border-subtle pb-3 text-white">Complete Study Session</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-2">Subject Topic</label>
                <p className="text-sm font-bold bg-white/5 p-2.5 rounded border border-border-subtle text-white">
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
                  value={Number.isNaN(actualHours) ? "" : actualHours}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActualHours(val === "" ? "" as any : parseFloat(val));
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
                className="flex-1 font-mono text-xs py-2 rounded border border-border-subtle text-gray-400 hover:bg-white/5 cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCompleteMission}
                className="flex-1 bg-brand-mint text-bg-base font-bold text-xs py-2 rounded hover:opacity-90 cursor-pointer"
              >
                RECORD SUCCESS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Study Plans Modal */}
      {plansModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto flex flex-col p-6 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setPlansModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-mono focus:outline-none transition-colors cursor-pointer"
            >
              &times;
            </button>

            <div>
              <span className="text-[10px] font-mono text-brand-mint uppercase tracking-widest font-bold">Manage Quests</span>
              <h2 className="text-2xl font-extrabold text-white mt-1">📚 Previous Study Plans</h2>
              <p className="text-xs text-gray-400 mt-1 font-sans">
                Review, duplicate, edit, switch, or manage your active and archived study plan roadmaps.
              </p>
            </div>

            {plans.length === 0 ? (
              <div className="bg-black/20 border border-gray-800 rounded-xl p-8 text-center text-gray-500 font-mono text-sm uppercase">
                No study plans found. Close this modal and create a new quest to begin!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan: any) => {
                  const isActive = activeExam && activeExam.id === plan.id;
                  return (
                    <div 
                      key={plan.id}
                      className={`bg-white/5 border rounded-xl p-5 relative flex flex-col justify-between space-y-4 hover:border-brand-mint/40 transition-all duration-300 ${
                        isActive ? "border-brand-mint/60 shadow-lg shadow-brand-mint/5" : "border-gray-800"
                      }`}
                    >
                      {/* Top metadata */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            isActive 
                              ? "bg-brand-mint/15 text-brand-mint border-brand-mint/30"
                              : plan.status === "Archived"
                              ? "bg-white/5 text-gray-400 border-white/10"
                              : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                          }`}>
                            {isActive ? "Active Study Plan" : plan.status || "Completed"}
                          </span>
                          <span className="text-[10px] font-mono text-[#F59E0B] font-bold">
                            ⏳ {plan.countdown_days} days remaining
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-extrabold text-white font-sans">{plan.name}</h4>
                          {plan.grade && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              Grade: <span className="text-brand-cobalt font-bold">{plan.grade}</span>
                            </p>
                          )}
                          <p className="text-[10px] text-gray-500 font-mono mt-1">
                            Target Date: {plan.date} | Allocation: {plan.daily_hours} hrs/day
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>Syllabus Completion</span>
                            <span className="text-brand-mint font-bold">{plan.progress_percentage}%</span>
                          </div>
                          <div className="w-full bg-black/30 rounded-full h-1.5 overflow-hidden border border-white/5">
                            <div 
                              className="bg-gradient-to-r from-brand-mint to-brand-cobalt h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${plan.progress_percentage}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Subjects Badge list */}
                        <div className="flex flex-wrap gap-1">
                          {plan.subjects && plan.subjects.map((sub: string, i: number) => (
                            <span key={i} className="text-[8px] font-mono bg-brand-mint/10 text-brand-mint px-2 py-0.5 rounded border border-brand-mint/20 font-bold uppercase tracking-wider">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bottom actions */}
                      <div className="space-y-3 pt-2 border-t border-white/5">
                        <div className="flex flex-wrap gap-2 justify-between items-center text-[10px] font-mono text-gray-400">
                          <span>
                            Level: <strong className="text-white">{plan.level || 1}</strong> | XP: <strong className="text-white">{plan.xp || 0}</strong>
                          </span>
                          <span>
                            Last Opened: {plan.last_opened ? new Date(plan.last_opened).toLocaleDateString() : "Never"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {!isActive && (
                            <button
                              onClick={() => handleContinueStudy(plan.id)}
                              className="flex-1 bg-brand-mint text-bg-base font-bold text-xs py-1.5 rounded hover:opacity-90 cursor-pointer font-sans"
                            >
                              Continue Study
                            </button>
                          )}
                          <button
                            onClick={() => handleEditPlan(plan.id)}
                            className="text-xs px-2.5 py-1.5 rounded bg-white/5 border border-border-subtle hover:bg-white/10 hover:border-gray-400 text-gray-300 font-semibold cursor-pointer font-sans transition-all"
                            title="Edit study targets and configuration"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicatePlan(plan.id)}
                            className="text-xs px-2.5 py-1.5 rounded bg-white/5 border border-border-subtle hover:bg-white/10 hover:border-gray-400 text-gray-300 font-semibold cursor-pointer font-sans transition-all"
                            title="Duplicate this study plan"
                          >
                            Duplicate
                          </button>
                          {plan.status !== "Archived" && (
                            <button
                              onClick={() => handleArchivePlan(plan.id)}
                              className="text-xs px-2.5 py-1.5 rounded bg-white/5 border border-border-subtle hover:bg-white/10 hover:border-gray-400 text-gray-300 font-semibold cursor-pointer font-sans transition-all"
                              title="Archive study plan"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePlan(plan.id)}
                            className="text-xs px-2.5 py-1.5 rounded bg-red-950/20 border border-red-900/40 hover:bg-red-900/20 hover:border-red-500 text-red-400 font-semibold cursor-pointer font-sans transition-all"
                            title="Permanently delete this plan"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="flex justify-end pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setPlansModalOpen(false)}
                className="px-5 py-2 rounded-lg font-mono text-xs border border-border-subtle text-gray-400 hover:bg-white/5 cursor-pointer font-bold uppercase transition-colors"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
