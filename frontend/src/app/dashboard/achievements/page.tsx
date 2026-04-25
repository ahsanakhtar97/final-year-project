"use client";

/**
 * Achievements page.
 *
 * Computes a fixed catalog of badges from the user's existing data
 * (tasks completed, habit streaks, journal entries, active habits).
 * Pure-derived: no separate persistence layer required.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Award,
  Flame,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Crown,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { getTasks } from "@/app/actions/tasks";
import { getHabitsByUserId, getUserStreaks } from "@/app/actions/user-habits";
import { getJournalEntriesByUser } from "@/app/actions/journal";
import { TaskStatus } from "@/types/tasks";

interface Stats {
  tasksCompleted: number;
  activeHabits: number;
  longestStreak: number;
  journalEntries: number;
}

interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  threshold: number;
  metric: keyof Stats;
  tier: "bronze" | "silver" | "gold";
}

const BADGES: BadgeDef[] = [
  // Tasks
  {
    id: "first-task",
    title: "First Step",
    description: "Complete your first task.",
    icon: CheckCircle2,
    threshold: 1,
    metric: "tasksCompleted",
    tier: "bronze",
  },
  {
    id: "ten-tasks",
    title: "Getting Stuff Done",
    description: "Complete 10 tasks.",
    icon: Target,
    threshold: 10,
    metric: "tasksCompleted",
    tier: "silver",
  },
  {
    id: "fifty-tasks",
    title: "Productivity Pro",
    description: "Complete 50 tasks.",
    icon: Trophy,
    threshold: 50,
    metric: "tasksCompleted",
    tier: "gold",
  },

  // Habits
  {
    id: "habit-starter",
    title: "Habit Starter",
    description: "Track your first habit.",
    icon: Sparkles,
    threshold: 1,
    metric: "activeHabits",
    tier: "bronze",
  },
  {
    id: "habit-portfolio",
    title: "Habit Portfolio",
    description: "Track 5 habits at once.",
    icon: Zap,
    threshold: 5,
    metric: "activeHabits",
    tier: "silver",
  },

  // Streaks
  {
    id: "streak-3",
    title: "Three in a Row",
    description: "Hit a 3-day habit streak.",
    icon: Flame,
    threshold: 3,
    metric: "longestStreak",
    tier: "bronze",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak.",
    icon: Flame,
    threshold: 7,
    metric: "longestStreak",
    tier: "silver",
  },
  {
    id: "streak-30",
    title: "Unstoppable",
    description: "Hit a 30-day habit streak.",
    icon: Crown,
    threshold: 30,
    metric: "longestStreak",
    tier: "gold",
  },

  // Journal
  {
    id: "journal-first",
    title: "Open Page",
    description: "Write your first journal entry.",
    icon: BookOpen,
    threshold: 1,
    metric: "journalEntries",
    tier: "bronze",
  },
  {
    id: "journal-ten",
    title: "Reflective",
    description: "Write 10 journal entries.",
    icon: BookOpen,
    threshold: 10,
    metric: "journalEntries",
    tier: "silver",
  },
  {
    id: "journal-thirty",
    title: "Self-Aware",
    description: "Write 30 journal entries.",
    icon: Award,
    threshold: 30,
    metric: "journalEntries",
    tier: "gold",
  },
];

const TIER_COLORS: Record<BadgeDef["tier"], string> = {
  bronze: "#cd7f32",
  silver: "#9aa0a6",
  gold: "#f4b400",
};

export default function AchievementsPage() {
  const { primaryAccent, isDark } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const uid = getUserId();
        if (!uid) return;
        const [tasks, userHabits, streaks, journal] = await Promise.all([
          getTasks().catch(() => []),
          getHabitsByUserId(uid).catch(() => []),
          getUserStreaks(uid).catch(() => []),
          getJournalEntriesByUser(uid).catch(() => []),
        ]);
        const longest = streaks.reduce(
          (max, s) => Math.max(max, s.longestStreak ?? 0),
          0,
        );
        setStats({
          tasksCompleted: tasks.filter(
            (t) => t.taskStatus === TaskStatus.COMPLETED,
          ).length,
          activeHabits: userHabits.length,
          longestStreak: longest,
          journalEntries: journal.length,
        });
      } catch {
        setStats({
          tasksCompleted: 0,
          activeHabits: 0,
          longestStreak: 0,
          journalEntries: 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const earnedCount = useMemo(() => {
    if (!stats) return 0;
    return BADGES.filter((b) => stats[b.metric] >= b.threshold).length;
  }, [stats]);

  return (
    <div className="mx-auto max-w-5xl gf-fade-up">
      <div className="mb-6">
        <h1
          className="gf-h1"
          style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
        >
          Achievements
        </h1>
        <p className="gf-muted mt-1 text-sm">
          Earn badges as you build momentum across tasks, habits, and
          reflection.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SummaryCard label="Earned" value={`${earnedCount}/${BADGES.length}`} accent={primaryAccent} />
        <SummaryCard label="Tasks" value={stats?.tasksCompleted ?? 0} accent={primaryAccent} />
        <SummaryCard label="Best streak" value={stats?.longestStreak ?? 0} accent={primaryAccent} />
        <SummaryCard label="Entries" value={stats?.journalEntries ?? 0} accent={primaryAccent} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="gf-skeleton h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BADGES.map((b) => {
            const value = stats?.[b.metric] ?? 0;
            const earned = value >= b.threshold;
            const progress = Math.min(100, (value / b.threshold) * 100);
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className="gf-card gf-card-hover p-4 flex flex-col gap-2"
                style={{ opacity: earned ? 1 : 0.7 }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: earned
                        ? TIER_COLORS[b.tier] + "33"
                        : isDark
                          ? "rgba(174,240,201,0.08)"
                          : "rgba(22,59,37,0.06)",
                      color: earned
                        ? TIER_COLORS[b.tier]
                        : isDark
                          ? "#aef0c9"
                          : "#163b25",
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{b.title}</p>
                      {earned && (
                        <span
                          className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: TIER_COLORS[b.tier] + "22",
                            color: TIER_COLORS[b.tier],
                          }}
                        >
                          {b.tier}
                        </span>
                      )}
                    </div>
                    <p className="gf-muted text-xs">{b.description}</p>
                  </div>
                </div>
                <div className="mt-1">
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden"
                    style={{
                      background: isDark
                        ? "rgba(174,240,201,0.10)"
                        : "rgba(22,59,37,0.08)",
                    }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        background: earned
                          ? TIER_COLORS[b.tier]
                          : primaryAccent,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] gf-muted mt-1">
                    <span>{value}</span>
                    <span>{b.threshold}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="gf-card p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: accent }}>
        {value}
      </div>
      <div className="gf-muted text-xs mt-0.5">{label}</div>
    </div>
  );
}
