"use client";

/**
 * Insights page.
 *
 * Read-only analytics over the user's existing data. Pulls from the same
 * endpoints the home dashboard uses but presents them in deeper views:
 *  - 30-day mood timeline from journal entries
 *  - 14-day habit completion bar chart
 *  - per-habit streak board
 *  - quick stats strip
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { TrendingUp, Flame, BookOpen, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { getJournalEntriesByUser } from "@/app/actions/journal";
import {
  fetchDailyCompleted,
  getHabitsByUserId,
  getUserStreaks,
} from "@/app/actions/user-habits";
import { getTasks } from "@/app/actions/tasks";
import { TaskStatus } from "@/types/tasks";
import { HabitStreak, Habit } from "@/types/habits";

interface MoodPoint {
  date: string;
  label: string;
  score: number | null;
}

interface CompletionPoint {
  date: string;
  label: string;
  completed: number;
}

// Normalize backend sentiment which may be in either [-1,1] or [0,100].
function normalizeMood(raw: number | null): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  if (raw >= -1 && raw <= 1) return Math.round(((raw + 1) / 2) * 10);
  if (raw >= 0 && raw <= 100) return Math.round((raw / 100) * 10);
  return Math.max(0, Math.min(10, raw));
}

function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function InsightsPage() {
  const { primaryAccent, isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  const [moodSeries, setMoodSeries] = useState<MoodPoint[]>([]);
  const [completionSeries, setCompletionSeries] = useState<CompletionPoint[]>([]);
  const [streaks, setStreaks] = useState<HabitStreak[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const uid = getUserId();
        if (!uid) return;

        const [journal, daily, str, userHabits, allTasks] = await Promise.all([
          getJournalEntriesByUser(uid).catch(() => []),
          fetchDailyCompleted(uid, 14).catch(() => []),
          getUserStreaks(uid).catch(() => []),
          getHabitsByUserId(uid).catch(() => []),
          getTasks().catch(() => []),
        ]);

        // Build 30-day mood series with gaps backfilled.
        const byDay = new Map<string, number[]>();
        journal.forEach((e) => {
          const key = new Date(e.createdAt).toDateString();
          const m = normalizeMood(e.sentimentScore);
          if (m === null) return;
          const arr = byDay.get(key) ?? [];
          arr.push(m);
          byDay.set(key, arr);
        });
        const today = new Date();
        const mood: MoodPoint[] = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          const key = d.toDateString();
          const arr = byDay.get(key);
          mood.push({
            date: key,
            label: shortDate(d),
            score: arr && arr.length
              ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length)
              : null,
          });
        }
        setMoodSeries(mood);

        // Completion series.
        setCompletionSeries(
          daily.map((row) => ({
            date: row.date,
            label: shortDate(new Date(row.date)),
            completed: row.completed,
          })),
        );

        setStreaks(
          [...str].sort((a, b) => b.currentStreak - a.currentStreak),
        );
        setHabits(userHabits);
        setTasksTotal(allTasks.length);
        setTasksCompleted(
          allTasks.filter((t) => t.taskStatus === TaskStatus.COMPLETED).length,
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const moodAvg = useMemo(() => {
    const values = moodSeries
      .map((p) => p.score)
      .filter((v): v is number => v !== null);
    if (!values.length) return null;
    return Math.round(
      (values.reduce((s, x) => s + x, 0) / values.length) * 10,
    ) / 10;
  }, [moodSeries]);

  const totalThis2Wk = completionSeries.reduce((s, p) => s + p.completed, 0);
  const completionPct = tasksTotal === 0
    ? 0
    : Math.round((tasksCompleted / tasksTotal) * 100);
  const bestStreak = streaks.reduce(
    (m, s) => Math.max(m, s.longestStreak ?? 0),
    0,
  );

  const gridColor = isDark ? "rgba(174,240,201,0.10)" : "rgba(22,59,37,0.10)";
  const axisColor = isDark ? "#9ed8bb" : "#5d7a66";

  return (
    <div className="mx-auto max-w-6xl gf-fade-up">
      <div className="mb-6">
        <h1
          className="gf-h1"
          style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
        >
          Insights
        </h1>
        <p className="gf-muted mt-1 text-sm">
          Patterns the eye misses — habits, mood, momentum.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat
          icon={<TrendingUp size={16} />}
          label="Avg mood (30d)"
          value={moodAvg !== null ? `${moodAvg}/10` : "—"}
          accent={primaryAccent}
        />
        <Stat
          icon={<Flame size={16} />}
          label="Best streak"
          value={bestStreak}
          accent={primaryAccent}
        />
        <Stat
          icon={<CheckCircle2 size={16} />}
          label="Task completion"
          value={`${completionPct}%`}
          accent={primaryAccent}
        />
        <Stat
          icon={<BookOpen size={16} />}
          label="Habits last 14d"
          value={totalThis2Wk}
          accent={primaryAccent}
        />
      </div>

      {/* Mood timeline */}
      <div className="gf-card p-4 sm:p-5 mb-5">
        <h3 className="gf-h2 mb-3">Mood — last 30 days</h3>
        {loading ? (
          <div className="gf-skeleton h-56 w-full" />
        ) : moodSeries.every((p) => p.score === null) ? (
          <p className="gf-muted text-sm text-center py-10">
            No journal entries yet. Write one to start your mood timeline.
          </p>
        ) : (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <LineChart
                data={moodSeries.map((p) => ({
                  ...p,
                  // recharts skips null gracefully when connectNulls is false
                }))}
              >
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke={axisColor}
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 10]}
                  stroke={axisColor}
                  fontSize={11}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#0f2a21" : "#ffffff",
                    border: `1px solid ${gridColor}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={primaryAccent}
                  strokeWidth={2}
                  dot={{ r: 3, fill: primaryAccent }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Habit completion */}
      <div className="gf-card p-4 sm:p-5 mb-5">
        <h3 className="gf-h2 mb-3">Habits completed — last 14 days</h3>
        {loading ? (
          <div className="gf-skeleton h-56 w-full" />
        ) : completionSeries.length === 0 ? (
          <p className="gf-muted text-sm text-center py-10">
            No completion data yet. Mark a habit done to start tracking.
          </p>
        ) : (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={completionSeries}>
                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke={axisColor}
                  fontSize={11}
                  interval="preserveStartEnd"
                />
                <YAxis stroke={axisColor} fontSize={11} width={28} />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#0f2a21" : "#ffffff",
                    border: `1px solid ${gridColor}`,
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="completed"
                  fill={primaryAccent}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Streak board */}
      <div className="gf-card p-4 sm:p-5">
        <h3 className="gf-h2 mb-3">Streak board</h3>
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="gf-skeleton h-10 w-full" />
            ))}
          </div>
        ) : streaks.length === 0 ? (
          <p className="gf-muted text-sm">
            Add a habit and complete it daily to start a streak.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--gf-border)]">
            {streaks.map((s) => {
              const habit = habits.find((h) => h.habitId === s.habitId);
              const max = Math.max(
                ...streaks.map((x) => x.longestStreak || 1),
                1,
              );
              const pct = Math.min(100, (s.currentStreak / max) * 100);
              return (
                <li
                  key={s.habitId}
                  className="py-3 flex items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold truncate">
                        {habit?.habitName ?? s.habitName ?? `#${s.habitId}`}
                      </span>
                      <span className="gf-muted text-xs shrink-0">
                        current {s.currentStreak} · best {s.longestStreak}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden"
                      style={{ background: gridColor }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background: primaryAccent,
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="gf-card p-4">
      <div
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
        style={{ color: accent }}
      >
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold">{value}</div>
    </div>
  );
}
