"use client";

/**
 * Goals page.
 *
 * High-level objectives the user is chasing. Each goal has a target value, a
 * current value, an optional deadline, and an optional link to one of the
 * user's habits. When linked, completing the habit can later be wired to
 * auto-increment the goal -- for now the user increments manually with the
 * "+1" button.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Target,
  Trash2,
  Calendar,
  Link2,
  CheckCircle2,
  Archive,
  Trophy,
} from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import {
  createGoal,
  deleteGoal,
  getGoalsByUser,
  incrementGoal,
  updateGoal,
} from "@/app/actions/goals";
import { getHabitsByUserId } from "@/app/actions/user-habits";
import { Goal, GoalStatus } from "@/types/goals";
import { Habit } from "@/types/habits";

interface NewGoalDraft {
  title: string;
  description: string;
  targetValue: string;
  unit: string;
  deadline: string;
  linkedHabitId: string;
}

const EMPTY_DRAFT: NewGoalDraft = {
  title: "",
  description: "",
  targetValue: "1",
  unit: "",
  deadline: "",
  linkedHabitId: "",
};

export default function GoalsPage() {
  const { primaryAccent, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState<NewGoalDraft>(EMPTY_DRAFT);
  const [filter, setFilter] = useState<"all" | GoalStatus>("active");
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const userId = useMemo(() => getUserId(), []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [g, h] = await Promise.all([
          getGoalsByUser(userId).catch(() => []),
          getHabitsByUserId(userId).catch(() => []),
        ]);
        setGoals(g);
        setHabits(h);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    if (filter === "all") return goals;
    return goals.filter((g) => g.status === filter);
  }, [goals, filter]);

  const counts = useMemo(() => {
    const active = goals.filter((g) => g.status === "active").length;
    const completed = goals.filter((g) => g.status === "completed").length;
    return { active, completed, total: goals.length };
  }, [goals]);

  async function submitNew() {
    setErr(null);
    if (!userId) return;
    if (!draft.title.trim()) {
      setErr("Give it a title.");
      return;
    }
    const target = parseInt(draft.targetValue, 10);
    if (isNaN(target) || target < 1) {
      setErr("Target must be at least 1.");
      return;
    }
    try {
      const created = await createGoal({
        userId,
        title: draft.title.trim(),
        description: draft.description.trim() || undefined,
        targetValue: target,
        unit: draft.unit.trim() || undefined,
        deadline: draft.deadline || undefined,
        linkedHabitId: draft.linkedHabitId
          ? parseInt(draft.linkedHabitId, 10)
          : undefined,
      });
      setGoals((prev) => [created, ...prev]);
      setDraft(EMPTY_DRAFT);
      setShowNew(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create goal.");
    }
  }

  async function bumpProgress(g: Goal) {
    setBusy(g.goalId);
    try {
      const updated = await incrementGoal(g.goalId);
      setGoals((prev) =>
        prev.map((x) => (x.goalId === updated.goalId ? updated : x)),
      );
    } finally {
      setBusy(null);
    }
  }

  async function setStatus(g: Goal, status: GoalStatus) {
    setBusy(g.goalId);
    try {
      const updated = await updateGoal(g.goalId, { status });
      setGoals((prev) =>
        prev.map((x) => (x.goalId === updated.goalId ? updated : x)),
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove(g: Goal) {
    if (!confirm(`Delete "${g.title}"?`)) return;
    setBusy(g.goalId);
    try {
      await deleteGoal(g.goalId);
      setGoals((prev) => prev.filter((x) => x.goalId !== g.goalId));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl gf-fade-up">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="gf-h1"
            style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
          >
            Goals
          </h1>
          <p className="gf-muted mt-1 text-sm">
            The big rocks. Break them down, then chip away.
          </p>
        </div>
        <button
          type="button"
          className="gf-btn gf-btn-primary"
          onClick={() => setShowNew(true)}
        >
          <Plus size={16} /> New goal
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Stat icon={<Target size={16} />} label="Active" value={counts.active} accent={primaryAccent} />
        <Stat icon={<Trophy size={16} />} label="Completed" value={counts.completed} accent={primaryAccent} />
        <Stat icon={<CheckCircle2 size={16} />} label="Total" value={counts.total} accent={primaryAccent} />
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(["active", "completed", "archived", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all"
            style={{
              background:
                filter === f
                  ? primaryAccent
                  : isDark
                    ? "rgba(174,240,201,0.08)"
                    : "rgba(22,59,37,0.06)",
              color: filter === f ? (isDark ? "#06130f" : "#ffffff") : "inherit",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="gf-skeleton h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="gf-card p-10 text-center">
          <Target
            size={28}
            style={{ color: primaryAccent }}
            className="mx-auto mb-2 opacity-70"
          />
          <p className="gf-muted text-sm">
            {filter === "active"
              ? "No active goals yet. Set one and start chipping."
              : `No ${filter} goals.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((g) => {
            const pct = Math.min(
              100,
              Math.round((g.currentValue / Math.max(1, g.targetValue)) * 100),
            );
            const linked = habits.find((h) => h.habitId === g.linkedHabitId);
            const isDone = g.status === "completed";
            const isArchived = g.status === "archived";
            const dueSoon =
              g.deadline &&
              new Date(g.deadline).getTime() - Date.now() <
                14 * 24 * 60 * 60 * 1000 &&
              g.status === "active";
            return (
              <li
                key={g.goalId}
                className="gf-card p-4 sm:p-5"
                style={{ opacity: isArchived ? 0.6 : 1 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1 h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: isDone
                        ? primaryAccent
                        : isDark
                          ? "rgba(174,240,201,0.08)"
                          : "rgba(22,59,37,0.06)",
                      color: isDone ? (isDark ? "#06130f" : "#ffffff") : primaryAccent,
                    }}
                  >
                    {isDone ? <Trophy size={18} /> : <Target size={18} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">
                          {g.title}
                        </h3>
                        {g.description ? (
                          <p className="gf-muted text-xs sm:text-sm mt-0.5 line-clamp-2">
                            {g.description}
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(g)}
                        className="gf-btn gf-btn-ghost !p-1.5 shrink-0"
                        aria-label="Delete goal"
                        disabled={busy === g.goalId}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="font-mono">
                        {g.currentValue}/{g.targetValue}
                        {g.unit ? ` ${g.unit}` : ""}
                      </span>
                      <span className="gf-muted">·</span>
                      <span className="gf-muted">{pct}%</span>
                    </div>
                    <div
                      className="mt-1.5 h-2 w-full rounded-full overflow-hidden"
                      style={{
                        background: isDark
                          ? "rgba(174,240,201,0.10)"
                          : "rgba(22,59,37,0.10)",
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: primaryAccent }}
                      />
                    </div>

                    {/* Meta row */}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs gf-muted">
                      {g.deadline ? (
                        <span
                          className="inline-flex items-center gap-1"
                          style={dueSoon ? { color: "#d97706", fontWeight: 600 } : undefined}
                        >
                          <Calendar size={12} />
                          {new Date(g.deadline).toLocaleDateString()}
                          {dueSoon ? " · soon" : ""}
                        </span>
                      ) : null}
                      {linked ? (
                        <span className="inline-flex items-center gap-1">
                          <Link2 size={12} />
                          {linked.habitName}
                        </span>
                      ) : null}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex gap-2 flex-wrap">
                      {!isDone && !isArchived ? (
                        <button
                          type="button"
                          className="gf-btn gf-btn-primary !py-1.5 !px-3 text-xs"
                          onClick={() => bumpProgress(g)}
                          disabled={busy === g.goalId}
                        >
                          +1 progress
                        </button>
                      ) : null}
                      {!isDone ? (
                        <button
                          type="button"
                          className="gf-btn gf-btn-ghost !py-1.5 !px-3 text-xs"
                          onClick={() => setStatus(g, "completed")}
                          disabled={busy === g.goalId}
                        >
                          <CheckCircle2 size={12} /> Mark done
                        </button>
                      ) : null}
                      {!isArchived ? (
                        <button
                          type="button"
                          className="gf-btn gf-btn-ghost !py-1.5 !px-3 text-xs"
                          onClick={() => setStatus(g, "archived")}
                          disabled={busy === g.goalId}
                        >
                          <Archive size={12} /> Archive
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="gf-btn gf-btn-ghost !py-1.5 !px-3 text-xs"
                          onClick={() => setStatus(g, "active")}
                          disabled={busy === g.goalId}
                        >
                          Re-activate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* New goal modal */}
      {showNew ? (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowNew(false)}
        >
          <div
            className="gf-card w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="gf-h2 mb-3">New goal</h3>
            <div className="space-y-3">
              <input
                className="gf-input"
                placeholder="What are you chasing?"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                maxLength={120}
                autoFocus
              />
              <textarea
                className="gf-input"
                rows={2}
                placeholder="Why does it matter? (optional)"
                value={draft.description}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
                maxLength={500}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="gf-input"
                  type="number"
                  min={1}
                  placeholder="Target"
                  value={draft.targetValue}
                  onChange={(e) =>
                    setDraft({ ...draft, targetValue: e.target.value })
                  }
                />
                <input
                  className="gf-input"
                  placeholder="Unit (e.g. days)"
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  maxLength={30}
                />
              </div>
              <input
                className="gf-input"
                type="date"
                value={draft.deadline}
                onChange={(e) =>
                  setDraft({ ...draft, deadline: e.target.value })
                }
              />
              <select
                className="gf-input"
                value={draft.linkedHabitId}
                onChange={(e) =>
                  setDraft({ ...draft, linkedHabitId: e.target.value })
                }
              >
                <option value="">Link to a habit (optional)</option>
                {habits.map((h) => (
                  <option key={h.habitId} value={h.habitId}>
                    {h.habitName}
                  </option>
                ))}
              </select>
              {err ? (
                <p className="text-xs" style={{ color: "#dc2626" }}>
                  {err}
                </p>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="gf-btn gf-btn-ghost"
                onClick={() => setShowNew(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="gf-btn gf-btn-primary"
                onClick={submitNew}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
  value: number | string;
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
