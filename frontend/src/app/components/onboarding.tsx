"use client";

/**
 * First-run onboarding wizard.
 *
 * Renders inside the dashboard layout the first time a logged-in user lands
 * after the flag is missing from localStorage. Three quick steps -- pick a
 * focus area, choose 1-3 starter habits, set a Pomodoro length. The wizard
 * does not block the rest of the dashboard from rendering; it overlays.
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Sparkles,
  Target,
  Heart,
  BookOpen,
  Timer,
  Activity,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { getHabits } from "@/app/actions/habits";
import { assignHabit } from "@/app/actions/user-habits";
import { Habit } from "@/types/habits";

const FLAG_KEY = "gf_onboarding_done_v1";
const POMODORO_PREFS = "gf_pomodoro_prefs_v1";

const FOCUS_AREAS = [
  { id: "health", label: "Health", icon: Heart, hint: "Sleep, exercise, hydration" },
  { id: "productivity", label: "Productivity", icon: Activity, hint: "Deep work, planning" },
  { id: "learning", label: "Learning", icon: BookOpen, hint: "Reading, courses, practice" },
  { id: "balance", label: "Balance", icon: Sparkles, hint: "Mood, mindfulness, rest" },
];

interface PomodoroPrefs {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
}

export default function Onboarding() {
  const { primaryAccent, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [focusArea, setFocusArea] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [pomodoroLen, setPomodoroLen] = useState(25);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(FLAG_KEY)) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const all = await getHabits().catch(() => []);
      setHabits(all);
    })();
  }, [open]);

  const userId = useMemo(() => getUserId(), []);

  const filteredHabits = useMemo(() => {
    if (!focusArea) return habits.slice(0, 8);
    const map: Record<string, RegExp> = {
      health: /(water|sleep|exercise|workout|run|walk|stretch|meditat)/i,
      productivity: /(deep|focus|plan|review|email|inbox|deep work|prioriti)/i,
      learning: /(read|book|course|study|language|practice|learn)/i,
      balance: /(journal|gratitude|breath|meditat|nature|rest|reflect)/i,
    };
    const re = map[focusArea];
    if (!re) return habits.slice(0, 8);
    const matched = habits.filter((h) => re.test(h.habitName));
    return [...matched, ...habits.filter((h) => !matched.includes(h))].slice(0, 8);
  }, [focusArea, habits]);

  function togglePick(id: number) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  }

  async function finish() {
    setBusy(true);
    try {
      // Persist Pomodoro length.
      const prefs: PomodoroPrefs = {
        focusMin: pomodoroLen,
        shortBreakMin: 5,
        longBreakMin: 15,
      };
      localStorage.setItem(POMODORO_PREFS, JSON.stringify(prefs));

      // Add picked habits.
      if (userId && picked.size > 0) {
        await Promise.all(
          Array.from(picked).map((id) =>
            assignHabit({ userId, habitId: id }).catch(() => null),
          ),
        );
      }

      localStorage.setItem(FLAG_KEY, "true");
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    localStorage.setItem(FLAG_KEY, "true");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
    >
      <div className="gf-card w-full max-w-lg p-5 sm:p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-colors"
              style={{
                background: i <= step
                  ? primaryAccent
                  : isDark
                    ? "rgba(174,240,201,0.15)"
                    : "rgba(22,59,37,0.10)",
              }}
            />
          ))}
        </div>

        {step === 0 ? (
          <>
            <h2 className="gf-h1 mb-1" style={{ fontFamily: "'Lora', serif" }}>
              Welcome to GrowFlow.
            </h2>
            <p className="gf-muted text-sm mb-5">
              Two minutes to set things up. Pick the area you most want to grow in.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FOCUS_AREAS.map((a) => {
                const Icon = a.icon;
                const isSel = focusArea === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setFocusArea(a.id)}
                    className="text-left p-3 rounded-lg transition-all"
                    style={{
                      background: isSel
                        ? primaryAccent
                        : isDark
                          ? "rgba(174,240,201,0.06)"
                          : "rgba(22,59,37,0.04)",
                      color: isSel ? (isDark ? "#06130f" : "#ffffff") : undefined,
                    }}
                  >
                    <Icon size={18} />
                    <div className="font-semibold mt-1.5 text-sm">{a.label}</div>
                    <div className="text-[11px] mt-0.5 opacity-80">{a.hint}</div>
                  </button>
                );
              })}
            </div>
          </>
        ) : step === 1 ? (
          <>
            <h2 className="gf-h1 mb-1" style={{ fontFamily: "'Lora', serif" }}>
              Pick 1–3 starter habits.
            </h2>
            <p className="gf-muted text-sm mb-4">
              You can change these any time on the habit tracker.
            </p>
            <ul className="space-y-1.5 max-h-72 overflow-y-auto gf-scroll pr-1">
              {filteredHabits.length === 0 ? (
                <li className="text-sm gf-muted">
                  No habits available yet. You can create your own later.
                </li>
              ) : (
                filteredHabits.map((h) => {
                  const isSel = picked.has(h.habitId);
                  return (
                    <li key={h.habitId}>
                      <button
                        type="button"
                        onClick={() => togglePick(h.habitId)}
                        className="w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all"
                        style={{
                          background: isSel
                            ? primaryAccent
                            : isDark
                              ? "rgba(174,240,201,0.06)"
                              : "rgba(22,59,37,0.04)",
                          color: isSel ? (isDark ? "#06130f" : "#ffffff") : undefined,
                        }}
                      >
                        <div
                          className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                          style={{
                            background: isSel ? "rgba(255,255,255,0.25)" : "transparent",
                            border: isSel ? "none" : "1px solid currentColor",
                          }}
                        >
                          {isSel ? <Check size={12} /> : null}
                        </div>
                        <span className="font-semibold text-sm">{h.habitName}</span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <p className="gf-muted text-xs mt-2">
              {picked.size}/3 picked
            </p>
          </>
        ) : (
          <>
            <h2 className="gf-h1 mb-1" style={{ fontFamily: "'Lora', serif" }}>
              How long are your focus blocks?
            </h2>
            <p className="gf-muted text-sm mb-5">
              Used as the default on the focus timer. You can override it any time.
            </p>
            <div className="flex gap-2 flex-wrap">
              {[15, 25, 45, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPomodoroLen(n)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: pomodoroLen === n
                      ? primaryAccent
                      : isDark
                        ? "rgba(174,240,201,0.06)"
                        : "rgba(22,59,37,0.04)",
                    color: pomodoroLen === n
                      ? (isDark ? "#06130f" : "#ffffff")
                      : undefined,
                  }}
                >
                  <Timer size={14} className="inline mr-1.5" />
                  {n} min
                </button>
              ))}
            </div>
            <p className="gf-muted text-xs mt-3">
              Tip: try 25-minute blocks if you&apos;re new to focused work.
            </p>
          </>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="text-xs gf-muted underline"
            onClick={skip}
          >
            Skip for now
          </button>
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                className="gf-btn gf-btn-ghost"
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </button>
            ) : null}
            {step < 2 ? (
              <button
                type="button"
                className="gf-btn gf-btn-primary"
                disabled={step === 0 && !focusArea}
                onClick={() => setStep((s) => s + 1)}
              >
                Next <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="gf-btn gf-btn-primary"
                disabled={busy}
                onClick={finish}
              >
                {busy ? "Saving…" : "Let's go"} <Target size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
