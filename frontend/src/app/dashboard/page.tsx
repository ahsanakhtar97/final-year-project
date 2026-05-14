"use client";

import DailyCheckIn from "@/app/components/daily-check-in";
import React, { useEffect, useMemo, useState } from "react";
import CorrelationChart from "../components/charts/CorrelationChart";
import Link from "next/link";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RCPieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { fetchDailyCompleted, getBestWorstHabit, getHabitsByUserId, getUserStreaks } from "../actions/user-habits";
import { toast } from "react-toastify";
import { getUserId } from "@/lib/utils";
import { getTasksByUserId, getUser } from "../actions/getUsers";
import { Task } from "@/types/tasks";
import { User } from "@/types/users";
import { HabitStat, HabitStreak } from "@/types/habits";
import { getJournalEntriesByUser } from "../actions/journal";
import { JournalEntry } from "@/types/journal";
import { useTheme } from "@/app/dashboard/theme-context";
import { getMyAppointments, type Appointment } from "@/app/actions/appointments";
import { getTodayMoodLog, type MoodLog } from "@/app/actions/mood";
import {
  Smile, BookOpen, Timer, Calendar, Stethoscope,
  TrendingUp, CheckSquare, Video, ChevronRight, Flame,
} from "lucide-react";

const DATE_KEY = (d = new Date()) => d.toISOString().slice(0, 10);

interface UserHabit {
  habitId?: number;
  records?: Record<string, boolean>;
  [key: string]: unknown;
}

function greeting(name?: string) {
  const h = new Date().getHours();
  const salutation = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${salutation}, ${name.split(" ")[0]} 👋` : `${salutation} 👋`;
}

const SCORE_EMOJI = ["", "😞", "😕", "😐", "🙂", "😄"];

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isRevealed, setIsRevealed] = useState(false);
  const [bestWorstState, setBestWorstState] = useState<{ best: HabitStat | null; worst: HabitStat | null }>({ best: null, worst: null });
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [, setHabitStreaks] = useState<HabitStreak[]>([]);
  const [dailyCompleted, setDailyCompleted] = useState<{ date: string; completed: number }[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string>("Loading your wellness tip...");
  const [currentMood, setCurrentMood] = useState<number | null>(null);
  const [upcomingAppts, setUpcomingAppts] = useState<Appointment[]>([]);
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null);

  useEffect(() => {
    async function fetchData() {
      const userId = getUserId();
      if (userId) {
        const h = await getHabitsByUserId(userId);
        setHabits(h as unknown as UserHabit[]);
        const u = await getUser(userId);
        setUser(u);
        const t = await getTasksByUserId(userId);
        if (t) setTasks(t);
        try {
          const entries = await getJournalEntriesByUser(userId);
          setJournalEntries(entries);
        } catch { /* non-fatal */ }
      } else {
        toast.error("Token not found");
      }
    }
    fetchData();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const userId = getUserId();
    async function fetchBestWorst() {
      try {
        if (userId) {
          const bw = await getBestWorstHabit(userId, 30);
          setBestWorstState(bw);
        }
      } catch { setBestWorstState({ best: null, worst: null }); }
    }
    if (userId) fetchBestWorst();
  }, []);

  useEffect(() => {
    async function fetchAiSuggestion() {
      setAiRecommendation("Stay focused and keep growing!");
    }
    fetchAiSuggestion();
  }, []);

  useEffect(() => {
    async function fetchStreaks() {
      const userId = getUserId();
      if (!userId) return;
      try {
        const streaks = await getUserStreaks(userId);
        setHabitStreaks(streaks);
      } catch { /* non-fatal */ }
    }
    fetchStreaks();
  }, []);

  useEffect(() => {
    async function fetchDailyData() {
      try {
        const userId = getUserId();
        if (!userId) return;
        const data = await fetchDailyCompleted(userId, 30);
        setDailyCompleted(data);
      } catch { /* non-fatal */ }
    }
    fetchDailyData();
  }, []);

  // Fetch upcoming confirmed appointments
  useEffect(() => {
    async function fetchAppts() {
      try {
        const all = await getMyAppointments();
        const now = new Date();
        const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        const upcoming = all.filter((a) => {
          if (a.status !== "confirmed") return false;
          const t = new Date(a.proposedAt);
          return t >= now && t <= in48h;
        });
        setUpcomingAppts(upcoming);
      } catch { /* non-fatal */ }
    }
    fetchAppts();
  }, []);

  // Fetch today's mood
  useEffect(() => {
    async function fetchMood() {
      try {
        const m = await getTodayMoodLog();
        setTodayMood(m);
      } catch { /* non-fatal */ }
    }
    fetchMood();
  }, []);

  const today = DATE_KEY();

  // ---------- Derived analytics ----------
  const completedHabitsToday = habits.filter((h) => h.records?.[today]).length;
  const completedTasksTotal = tasks.filter((t) => t.taskStatus === "completed").length;
  const totalItems = habits.length + tasks.length;
  const totalCompleted = completedHabitsToday + completedTasksTotal;
  const productivityScore = totalItems ? Math.round((totalCompleted / totalItems) * 100) : 0;

  const tasksCompletedToday = tasks.filter((t) => {
    if (!t.completedAt || t.taskStatus !== "completed") return false;
    return DATE_KEY(new Date(t.completedAt)) === today;
  }).length;
  const focusMinutesToday = tasksCompletedToday * 25 + completedHabitsToday * 10;

  const dailyLast7 = dailyCompleted.slice(-7).map((d) => ({
    day: d.date.slice(5),
    completed: d.completed,
  }));
  const chartLabels = dailyLast7.map((d) => d.day);
  const habitValues = dailyLast7.map((d) => d.completed);

  const moodByDay = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    for (const e of journalEntries) {
      const key = new Date(e.createdAt).toISOString().slice(5, 10);
      if (e.sentimentScore === null || e.sentimentScore === undefined) continue;
      const raw = e.sentimentScore;
      const norm = raw >= -1 && raw <= 1 ? ((raw + 1) / 2) * 10 : (raw / 100) * 10;
      (buckets[key] ??= []).push(norm);
    }
    return buckets;
  }, [journalEntries]);

  const moodValues = dailyLast7.map((d) => {
    const samples = moodByDay[d.day];
    if (samples?.length) return Math.round(samples.reduce((s, n) => s + n, 0) / samples.length);
    return currentMood ?? 0;
  });

  const taskCounts = useMemo(() => ({
    todo: tasks.filter((t) => t.taskStatus === "to_do").length,
    inProg: tasks.filter((t) => t.taskStatus === "in_progress").length,
    done: tasks.filter((t) => t.taskStatus === "completed").length,
  }), [tasks]);

  const taskPieData = [
    { name: "To Do", value: taskCounts.todo },
    { name: "In Progress", value: taskCounts.inProg },
    { name: "Completed", value: taskCounts.done },
  ];

  const taskVelocityData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }, (_, i) => {
      const w = 3 - i;
      const start = new Date(now); start.setDate(now.getDate() - (w + 1) * 7 + 1);
      const end = new Date(now); end.setDate(now.getDate() - w * 7);
      const startKey = DATE_KEY(start), endKey = DATE_KEY(end);
      const count = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const k = DATE_KEY(new Date(t.completedAt));
        return k >= startKey && k <= endKey;
      }).length;
      return { week: `W${4 - w}`, completed: count };
    });
  }, [tasks]);

  const weeklySummary = useMemo(() => {
    const last7Keys = dailyLast7.map((d) => d.day);
    return {
      habitsCompletedUnique: habits.filter((h) => last7Keys.some((k) => h.records?.[k])).length,
      tasksCompletedWeek: tasks.filter((t) => {
        if (!t.completedAt) return false;
        const k = DATE_KEY(new Date(t.completedAt));
        return dailyLast7.some((d) => d.day === k.slice(5));
      }).length,
      journalCount: journalEntries.filter((e) => {
        const k = new Date(e.createdAt).toISOString().slice(5, 10);
        return dailyLast7.some((d) => d.day === k);
      }).length,
    };
  }, [habits, tasks, dailyLast7, journalEntries]);

  const greenAccent = isDark ? "#aef0c9" : "#163b25";
  const palette = {
    darkAccent: "#8fe8b2",
    lightAccent: "#163b25",
    darkCard: "#0f241f",
    lightCard: "#ffffff",
  };

  const wrapperStyle: React.CSSProperties = {
    transition: "transform 400ms ease",
    transform: mounted ? "translateY(0) scale(1)" : "translateY(6px) scale(0.995)",
  };

  const QUICK_ACTIONS = [
    { href: "/dashboard/mood", icon: Smile, label: "Log Mood", color: "rgba(110,255,196,0.15)" },
    { href: "/dashboard/journal", icon: BookOpen, label: "Journal", color: "rgba(160,180,255,0.15)" },
    { href: "/dashboard/focus", icon: Timer, label: "Focus", color: "rgba(255,200,80,0.15)" },
    { href: "/dashboard/appointments", icon: Calendar, label: "Appointments", color: "rgba(92,242,255,0.15)" },
    { href: "/dashboard/care", icon: Stethoscope, label: "Find a Doctor", color: "rgba(255,160,180,0.15)" },
    { href: "/dashboard/games", icon: TrendingUp, label: "Mind Games", color: "rgba(180,130,255,0.15)" },
  ];

  return (
    <div className="gf-fade-up mx-auto max-w-7xl" style={wrapperStyle}>

      {/* ── Greeting ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif", color: isDark ? palette.darkAccent : palette.lightAccent }}>
            {greeting(user?.name)}
          </h1>
          <div className="gf-muted text-sm">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        <span className="gf-chip">
          <span className="h-2 w-2 rounded-full bg-current animate-pulse" /> Live
        </span>
      </div>

      {/* ── XP bar ── */}
      {user && (
        <div className="mb-6 flex items-center gap-4 gf-card p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold text-xl shadow-lg"
            style={{ background: isDark ? "#1fbf75" : "#27ae60" }}>
            {user.level}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: greenAccent }}>
                Level {user.level}
              </span>
              <span className="text-xs gf-muted">{user.xp} / {user.level * 100} XP</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden"
              style={{ background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}>
              <div className="h-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (user.xp / (user.level * 100)) * 100)}%`, background: isDark ? "#8fe8b2" : "#2ecc71" }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Upcoming appointment banner ── */}
      {upcomingAppts.length > 0 && (
        <div className="mb-6 space-y-2">
          {upcomingAppts.map((a) => {
            const when = new Date(a.proposedAt);
            const diffH = Math.round((when.getTime() - Date.now()) / 3_600_000);
            return (
              <div key={a.appointmentId}
                className="gf-card p-4 flex items-center gap-4 flex-wrap"
                style={{ borderLeft: "3px solid #6effc4", background: "rgba(110,255,196,0.08)" }}>
                <Video size={18} style={{ color: "#6effc4" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">
                    Upcoming session with {a.professional?.name ?? "your doctor"}
                  </div>
                  <div className="text-xs gf-muted">
                    {when.toLocaleString()} · in {diffH < 1 ? "less than an hour" : `${diffH}h`}
                  </div>
                </div>
                <Link href={`/dashboard/appointments/${a.appointmentId}/call`}
                  className="gf-btn gf-btn-primary shrink-0">
                  <Video size={13} /> Join Call
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Today at a glance strip ── */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Habits today", value: `${completedHabitsToday}/${habits.length}`, icon: Flame, color: "#6effc4" },
          { label: "Tasks done", value: completedTasksTotal, icon: CheckSquare, color: "#5cf2ff" },
          { label: "Focus time", value: `${focusMinutesToday}m`, icon: Timer, color: "#fbbf24" },
          { label: "Productivity", value: `${productivityScore}%`, icon: TrendingUp, color: "#b3c6ff" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="gf-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}22` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">{value}</div>
              <div className="text-xs gf-muted mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick actions ── */}
      <div className="mb-6">
        <h2 className="gf-h2 mb-3">Quick actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUICK_ACTIONS.map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}
              className="gf-card gf-card-hover p-3 flex flex-col items-center gap-2 text-center"
              style={{ background: color }}>
              <Icon size={20} />
              <span className="text-xs font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Mood + AI tip row ── */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Today's mood */}
        <Link href="/dashboard/mood" className="gf-card gf-card-hover p-5 block">
          <div className="text-sm font-bold mb-3" style={{ color: greenAccent }}>
            Today&apos;s mood
          </div>
          {todayMood ? (
            <div className="flex items-center gap-4">
              <div className="text-5xl">{SCORE_EMOJI[todayMood.score]}</div>
              <div>
                <div className="font-semibold capitalize">
                  {["", "Very low", "Low", "Okay", "Good", "Excellent"][todayMood.score]}
                </div>
                {(todayMood.emotionTags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(todayMood.emotionTags ?? []).slice(0, 3).map((t) => (
                      <span key={t} className="gf-chip text-[11px] capitalize">{t}</span>
                    ))}
                  </div>
                )}
                {todayMood.note && (
                  <p className="text-xs gf-muted mt-1 line-clamp-2">{todayMood.note}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-4xl opacity-40">😐</div>
              <div>
                <div className="text-sm font-medium">Not logged yet</div>
                <div className="text-xs gf-muted mt-0.5">Tap to log how you&apos;re feeling</div>
              </div>
              <ChevronRight size={16} className="ml-auto opacity-50" />
            </div>
          )}
        </Link>

        {/* AI tip */}
        <div className="gf-card p-5 flex flex-col gap-3"
          style={{
            background: isDark
              ? "linear-gradient(135deg,#0f241f,#06130f)"
              : "linear-gradient(135deg,#ffffff,#f0fff4)",
            border: `2px solid ${isDark ? "#8fe8b2" : "#163b25"}`,
          }}>
          <div className="flex items-center gap-2">
            <div className="text-xl">💡</div>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: greenAccent }}>
              AI Wellness Tip
            </div>
          </div>
          <p className="text-sm leading-relaxed flex-1 transition-all duration-500"
            style={{
              color: isDark ? "#e6ffef" : "#123716",
              filter: isRevealed ? "none" : "blur(5px)",
              userSelect: isRevealed ? "auto" : "none",
            }}>
            {aiRecommendation}
          </p>
          {!isRevealed && (
            <button onClick={() => setIsRevealed(true)} className="gf-btn gf-btn-primary !py-1.5 !px-3 text-xs self-start">
              Reveal tip
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <DailyCheckIn />
      </div>

      {/* ── Weekly summary strip ── */}
      <div className="mb-6 gf-card p-5">
        <h2 className="gf-h2 mb-4">This week at a glance</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Habits", value: weeklySummary.habitsCompletedUnique, sub: "active this week" },
            { label: "Tasks", value: weeklySummary.tasksCompletedWeek, sub: "completed" },
            { label: "Journal", value: weeklySummary.journalCount, sub: "entries written" },
          ].map(({ label, value, sub }) => (
            <div key={label}>
              <div className="text-2xl font-bold" style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}>
                {value}
              </div>
              <div className="text-xs font-semibold mt-0.5">{label}</div>
              <div className="text-xs gf-muted">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <div className="gf-card p-5 lg:col-span-2 min-h-[380px] flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-base font-bold" style={{ color: greenAccent }}>Mood &amp; Productivity</div>
            <span className="gf-muted text-xs">Last 7 days</span>
          </div>
          <div className="flex-1 min-h-[280px]">
            <CorrelationChart labels={chartLabels} habitData={habitValues} moodData={moodValues} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="gf-card gf-card-hover p-5">
            <div className="text-sm font-bold mb-3" style={{ color: greenAccent }}>Best / worst habit (30d)</div>
            <div className="space-y-1.5 text-sm">
              <div className="gf-muted">
                🏆 Best: <span className="ml-1 font-bold" style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}>
                  {bestWorstState.best ? `${bestWorstState.best.habitName} (${Math.round(bestWorstState.best.percentage * 100)}%)` : "—"}
                </span>
              </div>
              <div className="gf-muted">
                📉 Worst: <span className="ml-1 font-bold" style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}>
                  {bestWorstState.worst ? `${bestWorstState.worst.habitName} (${Math.round(bestWorstState.worst.percentage * 100)}%)` : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="gf-card gf-card-hover p-5">
            <div className="text-sm font-bold mb-2" style={{ color: greenAccent }}>Lifestyle balance</div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <RCPieChart>
                  <Pie data={[{ name: "Health", value: 40 }, { name: "Work", value: 30 }, { name: "Mindfulness", value: 30 }]}
                    cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                    <Cell fill="#1fbf75" /><Cell fill="#60d394" /><Cell fill="#9b59b6" />
                  </Pie>
                  <Tooltip />
                </RCPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Task charts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="gf-card p-5">
          <div className="mb-3 text-sm font-bold" style={{ color: greenAccent }}>Task status</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RCPieChart>
                <Pie data={taskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label>
                  <Cell fill="#fbbf24" /><Cell fill="#3498db" /><Cell fill="#1fbf75" />
                </Pie>
                <Tooltip />
              </RCPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gf-card p-5">
          <div className="mb-3 text-sm font-bold" style={{ color: greenAccent }}>Task velocity (4 weeks)</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskVelocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1f4d33" : "#d2e8d9"} />
                <XAxis dataKey="week" stroke={isDark ? "#9ed8bb" : "#163b25"} />
                <YAxis stroke={isDark ? "#9ed8bb" : "#163b25"} />
                <Tooltip />
                <Bar dataKey="completed" fill="#1fbf75" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
