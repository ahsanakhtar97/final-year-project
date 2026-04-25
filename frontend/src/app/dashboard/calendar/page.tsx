"use client";

/**
 * Calendar view.
 *
 * A month grid showing a heat-map of activity (habit completions + journal
 * entries) per day. Clicking a day pops out that day's detail: which habits
 * were ticked, the journal entry preview, any goal deadlines.
 */

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Target, CheckCircle2, Flame } from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { fetchDailyCompleted, getHabitsByUserId } from "@/app/actions/user-habits";
import { getJournalEntriesByUser } from "@/app/actions/journal";
import { getGoalsByUser } from "@/app/actions/goals";
import { Habit } from "@/types/habits";
import { Goal } from "@/types/goals";
import { JournalEntry } from "@/types/journal";

const WEEK_START_KEY = "gf_week_start_v1";

interface DayCell {
  date: Date;
  inMonth: boolean;
  iso: string; // YYYY-MM-DD
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildGrid(month: Date, weekStart: 0 | 1): DayCell[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  // Day index: 0 = Sun, 1 = Mon, ...
  const firstDay = first.getDay();
  const offset = (firstDay - weekStart + 7) % 7;
  const cells: DayCell[] = [];
  for (let i = 0; i < offset; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() - (offset - i));
    cells.push({ date: d, inMonth: false, iso: isoLocal(d) });
  }
  for (let day = 1; day <= last.getDate(); day++) {
    const d = new Date(month.getFullYear(), month.getMonth(), day);
    cells.push({ date: d, inMonth: true, iso: isoLocal(d) });
  }
  // Pad to multiple of 7.
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(last.getDate() + 1);
    cells.push({ date: d, inMonth: false, iso: isoLocal(d) });
  }
  return cells;
}

export default function CalendarPage() {
  const { primaryAccent, isDark } = useTheme();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [weekStart, setWeekStart] = useState<0 | 1>(1);
  const [selected, setSelected] = useState<string | null>(null);

  const [completions, setCompletions] = useState<Map<string, number>>(new Map());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => getUserId(), []);

  useEffect(() => {
    const ws = typeof window !== "undefined" ? localStorage.getItem(WEEK_START_KEY) : null;
    if (ws === "sunday") setWeekStart(0);
    else setWeekStart(1);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [daily, journal, h, g] = await Promise.all([
          fetchDailyCompleted(userId, 90).catch(() => []),
          getJournalEntriesByUser(userId).catch(() => []),
          getHabitsByUserId(userId).catch(() => []),
          getGoalsByUser(userId).catch(() => []),
        ]);
        const map = new Map<string, number>();
        daily.forEach((row) => {
          // row.date is YYYY-MM-DD already.
          map.set(row.date, row.completed);
        });
        setCompletions(map);
        setEntries(journal);
        setHabits(h);
        setGoals(g);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const grid = useMemo(() => buildGrid(month, weekStart), [month, weekStart]);

  const journalByDay = useMemo(() => {
    const m = new Map<string, JournalEntry>();
    entries.forEach((e) => {
      const iso = isoLocal(new Date(e.createdAt));
      // Keep latest entry per day.
      const existing = m.get(iso);
      if (!existing || new Date(e.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
        m.set(iso, e);
      }
    });
    return m;
  }, [entries]);

  const goalsByDeadline = useMemo(() => {
    const m = new Map<string, Goal[]>();
    goals.forEach((g) => {
      if (!g.deadline) return;
      const iso = g.deadline.slice(0, 10);
      const arr = m.get(iso) ?? [];
      arr.push(g);
      m.set(iso, arr);
    });
    return m;
  }, [goals]);

  const dayLabels = useMemo(() => {
    const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (weekStart === 1) return [...base.slice(1), "Sun"];
    return base;
  }, [weekStart]);

  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const todayIso = isoLocal(new Date());

  // For heat-map intensity scaling.
  const maxCompletions = useMemo(() => {
    let max = 0;
    completions.forEach((v) => {
      if (v > max) max = v;
    });
    return Math.max(1, max);
  }, [completions]);

  const detail = selected
    ? {
        completed: completions.get(selected) ?? 0,
        entry: journalByDay.get(selected) ?? null,
        deadlines: goalsByDeadline.get(selected) ?? [],
      }
    : null;

  return (
    <div className="mx-auto max-w-5xl gf-fade-up">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="gf-h1"
            style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
          >
            Calendar
          </h1>
          <p className="gf-muted mt-1 text-sm">
            A monthly view of habits, journal, and deadlines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="gf-btn gf-btn-ghost !p-2"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-sm w-32 text-center">
            {monthLabel}
          </span>
          <button
            type="button"
            className="gf-btn gf-btn-ghost !p-2"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            className="gf-btn gf-btn-ghost text-xs"
            onClick={() => setMonth(startOfMonth(new Date()))}
          >
            Today
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-semibold uppercase tracking-wider gf-muted">
        {dayLabels.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((cell) => {
          const completed = completions.get(cell.iso) ?? 0;
          const intensity = Math.min(1, completed / maxCompletions);
          const hasJournal = journalByDay.has(cell.iso);
          const hasDeadline = goalsByDeadline.has(cell.iso);
          const isToday = cell.iso === todayIso;
          const isSelected = selected === cell.iso;
          return (
            <button
              key={cell.iso + (cell.inMonth ? "" : "-out")}
              type="button"
              onClick={() => setSelected(cell.iso)}
              className="aspect-square rounded-lg p-1.5 text-left flex flex-col justify-between transition-all"
              style={{
                background: completed
                  ? `${primaryAccent}${Math.round(20 + intensity * 60)
                      .toString(16)
                      .padStart(2, "0")}`
                  : isDark
                    ? "rgba(174,240,201,0.04)"
                    : "rgba(22,59,37,0.04)",
                opacity: cell.inMonth ? 1 : 0.35,
                border: isSelected
                  ? `2px solid ${primaryAccent}`
                  : isToday
                    ? `1px dashed ${primaryAccent}`
                    : "1px solid transparent",
              }}
            >
              <span className="text-xs font-semibold">{cell.date.getDate()}</span>
              <div className="flex items-center gap-0.5 flex-wrap">
                {completed > 0 ? (
                  <span
                    className="text-[9px] inline-flex items-center gap-0.5"
                    style={{ color: primaryAccent }}
                  >
                    <Flame size={9} />
                    {completed}
                  </span>
                ) : null}
                {hasJournal ? (
                  <BookOpen size={9} style={{ color: primaryAccent }} />
                ) : null}
                {hasDeadline ? (
                  <Target size={9} style={{ color: "#d97706" }} />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="gf-muted text-xs mt-3">Loading…</p>
      ) : null}

      {/* Detail card */}
      {selected && detail ? (
        <div className="gf-card p-4 sm:p-5 mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="gf-h2">
              {new Date(selected + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h3>
            <button
              type="button"
              className="gf-btn gf-btn-ghost !p-1.5"
              onClick={() => setSelected(null)}
              aria-label="Close detail"
            >
              ×
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: primaryAccent }} />
              <span>
                <span className="font-semibold">{detail.completed}</span>{" "}
                <span className="gf-muted">
                  habit{detail.completed === 1 ? "" : "s"} completed
                  {habits.length > 0 ? ` of ${habits.length}` : ""}
                </span>
              </span>
            </div>

            {detail.entry ? (
              <div className="flex items-start gap-2">
                <BookOpen
                  size={14}
                  style={{ color: primaryAccent }}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <div className="font-semibold text-xs gf-muted">Journal</div>
                  <p className="text-sm line-clamp-3">
                    {detail.entry.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 gf-muted">
                <BookOpen size={14} />
                <span>No journal entry this day.</span>
              </div>
            )}

            {detail.deadlines.length > 0 ? (
              <div>
                <div className="flex items-center gap-2 font-semibold text-xs gf-muted mb-1">
                  <Target size={14} style={{ color: "#d97706" }} />
                  Goal deadlines
                </div>
                <ul className="text-sm space-y-1">
                  {detail.deadlines.map((g) => (
                    <li key={g.goalId}>
                      <span className="font-semibold">{g.title}</span>
                      <span className="gf-muted">
                        {" "}
                        — {g.currentValue}/{g.targetValue}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
