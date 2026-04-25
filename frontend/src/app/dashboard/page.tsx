"use client";

import DailyCheckIn from "@/app/components/daily-check-in";

import api from "@/lib/axios";
import React, { useEffect, useMemo, useState } from "react";
import CorrelationChart from "../components/charts/CorrelationChart";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RCPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { fetchDailyCompleted, getBestWorstHabit, getHabitsByUserId, getUserStreaks } from "../actions/user-habits";
import { toast } from 'react-toastify';
import { getUserId } from "@/lib/utils";
import { getTasksByUserId } from "../actions/getUsers";
import { Task } from "@/types/tasks";
import { HabitStat, HabitStreak } from "@/types/habits";
import { getJournalEntriesByUser } from "../actions/journal";
import { JournalEntry } from "@/types/journal";
import { useTheme } from "@/app/dashboard/theme-context";


const MOOD_KEY = "growflow_moods_v1";

const DATE_KEY = (d = new Date()) => d.toISOString().slice(0, 10);

interface UserHabit {
  habitId?: number;
  records?: Record<string, boolean>;
  [key: string]: unknown;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isRevealed, setIsRevealed] = useState(false);
  const [bestWorstState, setBestWorstState] = useState<{ best: HabitStat | null; worst: HabitStat | null }>({
    best: null,
    worst: null,
  });
  const [habits, setHabits] = useState<UserHabit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);
  const [, setHabitStreaks] = useState<HabitStreak[]>([]);
  const [dailyCompleted, setDailyCompleted] = useState<{ date: string; completed: number }[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<string>("Loading your wellness tip...");
  const [currentMood, setCurrentMood] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      const userId = getUserId();
      if (userId) {
        const h = await getHabitsByUserId(userId);
        setHabits(h as unknown as UserHabit[]);

        // Moods stored locally for the emoji selector legacy flow.
        try {
          localStorage.getItem(MOOD_KEY);
        } catch {}

        const t = await getTasksByUserId(userId);
        if (t) setTasks(t);

        try {
          const entries = await getJournalEntriesByUser(userId);
          setJournalEntries(entries);
        } catch {
          // non-fatal: chart falls back to a flat line.
        }
      } else {
        toast.error('Token not found');
      }
    }
    fetchData();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const userId = getUserId();
    const days = 30;
    async function fetchBestWorst() {
      try {
        if (userId) {
          const bw = await getBestWorstHabit(userId, days);
          setBestWorstState(bw);
        }
      } catch {
        toast.error("Failed to fetch best/worst habit");
        setBestWorstState({ best: null, worst: null });
      }
    }
    if (userId) fetchBestWorst();
  }, []);

  useEffect(() => {
    async function fetchAiSuggestion() {
      try {
        const response = await api.get('/dashboard/summary');
        const { recommendation, mood } = response.data;

        setAiRecommendation(recommendation);
        setCurrentMood(mood);
      } catch (err) {
        console.error("AI Fetch Error:", err);
        setAiRecommendation("Stay focused and keep growing!");
      }
    }
    fetchAiSuggestion();
  }, []);

  useEffect(() => {
    async function fetchStreaks() {
      const userId = getUserId();
      if (!userId) return toast.error("Token not found");

      try {
        const streaks = await getUserStreaks(userId);
        setHabitStreaks(streaks);
      } catch {
        toast.error("Failed to fetch habit streaks");
      }
    }
    fetchStreaks();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = getUserId();
        const days = 30;
        if (!userId) return toast.error("Token not found");
        const data = await fetchDailyCompleted(userId, days);
        setDailyCompleted(data);
      } catch {
        toast.error("Failed to fetch daily completed habits");
      }
    }
    fetchData();
  }, []);

  const today = DATE_KEY();

  // ---------- Derived analytics ----------
  const completedHabitsToday = habits.filter((h) => h.records?.[today]).length;
  const completedTasksTotal = tasks.filter((t) => t.taskStatus === "completed").length;
  const totalItems = habits.length + tasks.length;
  const totalCompleted = completedHabitsToday + completedTasksTotal;
  const productivityScore = totalItems ? Math.round((totalCompleted / totalItems) * 100) : 0;

  // Focus estimate: 25 min per task done today + 10 min per habit completion.
  const tasksCompletedToday = tasks.filter((t) => {
    if (!t.completedAt || t.taskStatus !== "completed") return false;
    return DATE_KEY(new Date(t.completedAt)) === today;
  }).length;
  const focusMinutesToday =
    tasksCompletedToday * 25 + completedHabitsToday * 10;

  const dailyLast7 = dailyCompleted.slice(-7).map(d => ({
    day: d.date.slice(5),
    completed: d.completed,
  }));
  const chartLabels = dailyLast7.map(d => d.day);
  const habitValues = dailyLast7.map(d => d.completed);

  // Per-day mood from journal entries: average sentiment per day, normalized 0-10.
  const moodByDay = useMemo(() => {
    const buckets: Record<string, number[]> = {};
    for (const e of journalEntries) {
      const key = new Date(e.createdAt).toISOString().slice(5, 10);
      if (e.sentimentScore === null || e.sentimentScore === undefined) continue;
      const raw = e.sentimentScore;
      const norm =
        raw >= -1 && raw <= 1 ? ((raw + 1) / 2) * 10 : (raw / 100) * 10;
      (buckets[key] ??= []).push(norm);
    }
    return buckets;
  }, [journalEntries]);
  const moodValues = dailyLast7.map((d) => {
    const samples = moodByDay[d.day];
    if (samples?.length) {
      return Math.round(samples.reduce((s, n) => s + n, 0) / samples.length);
    }
    return currentMood ?? 0;
  });

  const taskCounts = useMemo(() => {
    const todo = tasks.filter((t) => t.taskStatus === "to_do").length;
    const inProg = tasks.filter((t) => t.taskStatus === "in_progress").length;
    const done = tasks.filter((t) => t.taskStatus === "completed").length;
    return { todo, inProg, done };
  }, [tasks]);

  const taskPieData = [
    { name: "To Do", value: taskCounts.todo },
    { name: "In Progress", value: taskCounts.inProg },
    { name: "Completed", value: taskCounts.done },
  ];

  const taskVelocityData = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (w + 1) * 7 + 1);
      const end = new Date(now);
      end.setDate(now.getDate() - w * 7);
      const startKey = DATE_KEY(start);
      const endKey = DATE_KEY(end);
      const count = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        const k = DATE_KEY(d);
        return k >= startKey && k <= endKey;
      }).length;
      weeks.push({ week: `${startKey.slice(5)}→${endKey.slice(5)}`, completed: count });
    }
    return weeks;
  }, [tasks]);

  const weeklySummary = useMemo(() => {
    const last7Keys = dailyLast7.map((d) => d.day);
    const habitsCompletedUnique = habits.filter((h) => last7Keys.some((k) => h.records?.[k])).length;
    const tasksCompletedWeek = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const k = DATE_KEY(new Date(t.completedAt));
      return dailyLast7.some(d => d.day === k.slice(5));
    }).length;
    return { habitsCompletedUnique, tasksCompletedWeek };
  }, [habits, tasks, dailyLast7]);

  const palette = {
    lightBg: "linear-gradient(180deg,#dff8e3,#bfe7c5)",
    lightCard: "#ffffff",
    lightAccent: "#163b25",
    darkBg: "linear-gradient(180deg,#06130f,#0f2a21)",
    darkCard: "#0f241f",
    darkAccent: "#8fe8b2",
  };

  const greenAccent = isDark ? "#aef0c9" : "#163b25";

  const productivityCircleStyle: React.CSSProperties = {
    margin: "12px auto",
    width: 128,
    height: 128,
    borderRadius: "50%",
    border: `10px solid ${greenAccent}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    color: isDark ? palette.darkAccent : palette.lightAccent,
    background: isDark ? "rgba(20,70,50,0.06)" : palette.lightCard,
    boxShadow: isDark ? `0 0 30px rgba(174,240,201,0.06)` : `0 6px 20px rgba(22,59,34,0.08)`,
    transition: "box-shadow 300ms ease, transform 200ms ease",
  };

  const wrapperStyle: React.CSSProperties = {
    transition: "transform 400ms ease",
    transform: mounted ? "translateY(0) scale(1)" : "translateY(6px) scale(0.995)",
  };

  return (
    <div className="gf-fade-up mx-auto max-w-7xl" style={wrapperStyle}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif", color: isDark ? palette.darkAccent : palette.lightAccent }}>
            Dashboard
          </h1>
          <div className="gf-muted text-sm">
            Overview — {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        <span className="gf-chip">
          <span className="h-2 w-2 rounded-full bg-current" />
          Live
        </span>
      </div>

      <div className="mb-6">
        <DailyCheckIn />
      </div>

      <div
        className="gf-card gf-fade-up mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5"
        style={{
          background: isDark
            ? "linear-gradient(135deg,#0f241f 0%, #06130f 100%)"
            : "linear-gradient(135deg,#ffffff 0%, #f0fff4 100%)",
          border: `2px solid ${isDark ? "#8fe8b2" : "#163b25"}`,
        }}
      >
        <div className="text-4xl shrink-0">💡</div>
        <div className="min-w-0 flex-1">
          <div
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: greenAccent }}
          >
            GrowFlow AI Recommendation
          </div>
          <p
            className="mt-1 text-base sm:text-lg font-medium leading-relaxed transition-all duration-500"
            style={{
              color: isDark ? "#e6ffef" : "#123716",
              filter: isRevealed ? "none" : "blur(6px)",
              userSelect: isRevealed ? "auto" : "none",
            }}
          >
            {aiRecommendation}
          </p>
          {!isRevealed && (
            <button
              onClick={() => setIsRevealed(true)}
              className="gf-btn gf-btn-primary mt-3 !py-1.5 !px-3 text-xs"
            >
              Reveal daily tip
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="gf-card gf-card-hover gf-fade-up p-5">
          <div className="text-sm font-bold" style={{ color: isDark ? "#cfeed8" : "#2f6b45" }}>
            Productivity
          </div>
          <div className="gf-muted mt-1 text-xs">Combined habits + tasks</div>
          <div className="mt-4 flex justify-center">
            <div style={productivityCircleStyle}>
              <div className="text-center leading-none">
                <div className="text-2xl sm:text-3xl font-bold">{productivityScore}%</div>
                <div className="mt-1 text-xs opacity-80">
                  {totalItems ? `${totalCompleted}/${totalItems}` : "0/0"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="gf-card gf-card-hover gf-fade-up p-5">
          <div className="text-sm font-bold" style={{ color: isDark ? "#cfeed8" : "#2f6b45" }}>
            How are you feeling?
          </div>
          <div className="mt-5 flex justify-between px-1">
            {["\u{1F622}", "\u{1F610}", "\u{1F642}", "\u{1F60A}", "\u{1F929}"].map((emoji, index) => {
              return (
                <button
                  key={index}
                  onClick={() => {
                    toast.success("Mood recorded!", { icon: () => <span>{emoji}</span> });
                  }}
                  aria-label={`Set mood ${index + 1} of 5`}
                  className="text-2xl sm:text-3xl transition-transform hover:scale-125 focus:outline-none focus:scale-125"
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          <div
            className="mt-4 text-center text-xs"
            style={{ color: isDark ? "#9fdab0" : "#3e6f4a" }}
          >
            Tap an emoji to update your wellness profile.
          </div>
        </div>

        <div className="gf-card gf-card-hover gf-fade-up p-5 sm:col-span-2 lg:col-span-1">
          <div className="text-sm font-bold" style={{ color: isDark ? "#cfeed8" : "#2f6b45" }}>
            Focus
          </div>
          <div
            className="mt-3 text-center text-4xl sm:text-5xl font-bold"
            style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}
          >
            {focusMinutesToday}m
          </div>
          <div
            className="mt-2 text-center text-xs"
            style={{ color: isDark ? "#9fdab0" : "#3e6f4a" }}
          >
            Estimated focus today
            <br />
            <span className="opacity-70">
              {tasksCompletedToday} task{tasksCompletedToday === 1 ? "" : "s"}
              {" · "}
              {completedHabitsToday} habit{completedHabitsToday === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="gf-card gf-fade-up p-5 lg:col-span-2 min-h-[420px] flex flex-col">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-base font-bold" style={{ color: greenAccent }}>
              Mood &amp; Productivity
            </div>
            <span className="gf-muted text-xs">Last 7 days</span>
          </div>
          <div className="flex-1 min-h-[320px]">
            <CorrelationChart
              labels={chartLabels}
              habitData={habitValues}
              moodData={moodValues}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="gf-card gf-card-hover gf-fade-up p-5">
            <div className="text-sm font-bold" style={{ color: greenAccent }}>
              Weekly summary
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="gf-muted text-xs">Habits touched</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}
                >
                  {weeklySummary.habitsCompletedUnique}
                </div>
              </div>
              <div className="text-right">
                <div className="gf-muted text-xs">Tasks done</div>
                <div
                  className="text-xl font-bold"
                  style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}
                >
                  {weeklySummary.tasksCompletedWeek}
                </div>
              </div>
            </div>
          </div>

          <div className="gf-card gf-card-hover gf-fade-up p-5">
            <div className="text-sm font-bold" style={{ color: greenAccent }}>
              Lifestyle balance
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RCPieChart>
                  <Pie
                    data={[
                      { name: "Health", value: 40 },
                      { name: "Work", value: 30 },
                      { name: "Mindfulness", value: 30 },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#1fbf75" />
                    <Cell fill="#60d394" />
                    <Cell fill="#9b59b6" />
                  </Pie>
                  <Tooltip />
                </RCPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="gf-card gf-card-hover gf-fade-up p-5">
            <div className="text-sm font-bold" style={{ color: greenAccent }}>
              Best / worst habit (30d)
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="text-sm gf-muted">
                Best:{" "}
                <span
                  className="ml-1 font-bold"
                  style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}
                >
                  {bestWorstState.best
                    ? `${bestWorstState.best.habitName} (${Math.round(
                        bestWorstState.best.percentage * 100
                      )}%)`
                    : "—"}
                </span>
              </div>
              <div className="text-sm gf-muted">
                Worst:{" "}
                <span
                  className="ml-1 font-bold"
                  style={{ color: isDark ? palette.darkAccent : palette.lightAccent }}
                >
                  {bestWorstState.worst
                    ? `${bestWorstState.worst.habitName} (${Math.round(
                        bestWorstState.worst.percentage * 100
                      )}%)`
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="gf-card gf-fade-up p-5">
          <div className="mb-3 text-sm font-bold" style={{ color: greenAccent }}>
            Task status
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <RCPieChart>
                <Pie
                  data={taskPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label
                >
                  <Cell fill="#fbbf24" />
                  <Cell fill="#3498db" />
                  <Cell fill="#1fbf75" />
                </Pie>
                <Tooltip />
              </RCPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gf-card gf-fade-up p-5">
          <div className="mb-3 text-sm font-bold" style={{ color: greenAccent }}>
            Task velocity (4 weeks)
          </div>
          <div className="h-[240px]">
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
