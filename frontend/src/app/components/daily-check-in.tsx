"use client";

/**
 * Daily check-in widget.
 *
 * Renders on the dashboard home, once per day. Two questions:
 *  1) How are you, on a 1-5 scale (turned into a 0-10 mood)
 *  2) What's the one thing you want to ship today (turned into a task)
 *
 * Once submitted for the day we hide the card and show a tiny banner. The
 * mood + intention are stored in localStorage and the task is created via
 * the existing /tasks endpoint.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { createTask } from "@/app/actions/tasks";
import { TaskStatus } from "@/types/tasks";

const KEY = "gf_checkin_v1";

interface CheckInState {
  date: string; // YYYY-MM-DD
  mood: number; // 0-10
  intention: string;
}

const SCORE_LABELS = ["Rough", "Low", "OK", "Good", "Great"];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export default function DailyCheckIn() {
  const { primaryAccent, isDark } = useTheme();
  const [done, setDone] = useState<CheckInState | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [intent, setIntent] = useState("");
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: CheckInState = JSON.parse(raw);
        if (parsed.date === todayIso()) setDone(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const userId = useMemo(() => getUserId(), []);

  async function submit() {
    if (score === null) return;
    setBusy(true);
    try {
      const mood = (score - 1) * 2.5; // 1-5 => 0-10
      const state: CheckInState = {
        date: todayIso(),
        mood,
        intention: intent.trim(),
      };

      // Create the intention as a TODO task.
      if (userId && state.intention) {
        try {
          await createTask({
            userId,
            title: state.intention.slice(0, 120),
            description: "Today's one thing",
            taskStatus: TaskStatus.TO_DO,
          });
        } catch {
          /* non-fatal */
        }
      }

      localStorage.setItem(KEY, JSON.stringify(state));
      setDone(state);
    } finally {
      setBusy(false);
    }
  }

  if (!hydrated) return null;

  if (done) {
    return (
      <div
        className="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
        style={{
          background: isDark ? "rgba(143,232,178,0.10)" : "rgba(22,59,37,0.06)",
        }}
      >
        <Check size={12} style={{ color: primaryAccent }} />
        <span>
          Check-in done for today
          {done.intention ? (
            <>
              <span className="gf-muted"> · today&apos;s one thing: </span>
              <span className="font-semibold">{done.intention}</span>
            </>
          ) : null}
        </span>
      </div>
    );
  }

  return (
    <div className="gf-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} style={{ color: primaryAccent }} />
        <h3 className="font-semibold text-sm">Daily check-in</h3>
      </div>
      <p className="gf-muted text-xs mb-3">
        Two questions, ten seconds. Sets the tone for the day.
      </p>

      <div className="text-xs gf-muted mb-1.5">How are you today?</div>
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((n) => {
          const isSel = score === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: isSel
                  ? primaryAccent
                  : isDark
                    ? "rgba(174,240,201,0.06)"
                    : "rgba(22,59,37,0.04)",
                color: isSel ? (isDark ? "#06130f" : "#ffffff") : undefined,
              }}
            >
              {n}
              <div className="text-[10px] mt-0.5 opacity-80">
                {SCORE_LABELS[n - 1]}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-xs gf-muted mb-1.5">
        One thing you want to ship today
      </div>
      <input
        className="gf-input"
        placeholder="e.g. Finish the proposal draft"
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        maxLength={120}
      />

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          className="gf-btn gf-btn-primary"
          disabled={busy || score === null}
          onClick={submit}
        >
          {busy ? "Saving…" : "Submit"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
