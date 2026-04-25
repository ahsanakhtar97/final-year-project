"use client";

/**
 * AI Coach.
 *
 * A chat-style page where the user can ask for a nudge. Each message we send
 * is enriched with a context snapshot pulled from the user's existing data
 * (tasks, journal sentiment, streaks, focus log) so the backend can reply
 * with something concrete instead of generic.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Send, Sparkles, RefreshCw, Trophy, Coffee, Compass } from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { askCoach, CoachContext, CoachReply } from "@/app/actions/ai";
import { getTasks } from "@/app/actions/tasks";
import { TaskStatus } from "@/types/tasks";
import { getJournalEntriesByUser } from "@/app/actions/journal";
import { getUserStreaks } from "@/app/actions/user-habits";

interface ChatMsg {
  id: string;
  who: "user" | "coach";
  text: string;
  suggestions?: string[];
  tone?: CoachReply["tone"];
  ts: number;
}

const FOCUS_LOG_KEY = "gf_focus_log_v1";

function normalizeMood(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  if (raw >= -1 && raw <= 1) return ((raw + 1) / 2) * 10;
  if (raw >= 0 && raw <= 100) return (raw / 100) * 10;
  return Math.max(0, Math.min(10, raw));
}

function readFocusToday(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(FOCUS_LOG_KEY);
    if (!raw) return 0;
    const parsed: { date: string; minutes: number }[] = JSON.parse(raw);
    const today = new Date().toDateString();
    return parsed
      .filter((e) => new Date(e.date).toDateString() === today)
      .reduce((s, e) => s + (e.minutes ?? 0), 0);
  } catch {
    return 0;
  }
}

const STARTERS = [
  { icon: <Coffee size={14} />, text: "I'm feeling stuck today" },
  { icon: <Trophy size={14} />, text: "I'm on a roll, what's next?" },
  { icon: <Compass size={14} />, text: "Help me pick where to start" },
];

export default function CoachPage() {
  const { primaryAccent, isDark } = useTheme();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [context, setContext] = useState<CoachContext>({});
  const [contextReady, setContextReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const userId = useMemo(() => getUserId(), []);

  // Build the context snapshot once on mount.
  useEffect(() => {
    (async () => {
      try {
        if (!userId) return;
        const [tasks, journal, streaks] = await Promise.all([
          getTasks().catch(() => []),
          getJournalEntriesByUser(userId).catch(() => []),
          getUserStreaks(userId).catch(() => []),
        ]);

        const open = tasks.filter(
          (t) => t.taskStatus !== TaskStatus.COMPLETED,
        ).length;

        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const tasksCompleted7d = tasks.filter(
          (t) =>
            t.taskStatus === TaskStatus.COMPLETED &&
            (t as { updatedAt?: string }).updatedAt &&
            new Date((t as { updatedAt?: string }).updatedAt!).getTime() >= weekAgo,
        ).length;

        const recent = journal.filter(
          (e) => new Date(e.createdAt).getTime() >= weekAgo,
        );
        const moodScores = recent
          .map((e) => normalizeMood(e.sentimentScore))
          .filter((v): v is number => v !== null);
        const recentMoodAvg = moodScores.length
          ? Number(
              (
                moodScores.reduce((s, x) => s + x, 0) / moodScores.length
              ).toFixed(2),
            )
          : undefined;

        const bestStreak = streaks.reduce(
          (m, s) => Math.max(m, s.currentStreak ?? 0),
          0,
        );

        setContext({
          openTasks: open,
          tasksCompleted7d,
          recentMoodAvg,
          bestStreak,
          focusMinutesToday: readFocusToday(),
        });
      } finally {
        setContextReady(true);
      }
    })();
  }, [userId]);

  // Auto-scroll on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const userMsg: ChatMsg = {
      id: `${Date.now()}-u`,
      who: "user",
      text: trimmed,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setDraft("");
    setSending(true);
    try {
      const reply = await askCoach({ context, message: trimmed });
      const coachMsg: ChatMsg = {
        id: `${Date.now()}-c`,
        who: "coach",
        text: reply.reply,
        suggestions: reply.suggestions,
        tone: reply.tone,
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, coachMsg]);
    } catch {
      const errMsg: ChatMsg = {
        id: `${Date.now()}-e`,
        who: "coach",
        text:
          "I'm offline right now. Try again in a moment, or just pick one task and start a 25-minute focus block.",
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  const toneIcon = (t?: CoachReply["tone"]) => {
    if (t === "celebrate") return <Trophy size={14} />;
    if (t === "reset") return <Coffee size={14} />;
    return <Sparkles size={14} />;
  };

  return (
    <div className="mx-auto max-w-3xl gf-fade-up flex flex-col h-[calc(100vh-7rem)] sm:h-[calc(100vh-9rem)]">
      <div className="mb-4">
        <h1
          className="gf-h1"
          style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
        >
          Coach
        </h1>
        <p className="gf-muted mt-1 text-sm">
          A nudge based on your week. Ask anything, or pick a starter.
        </p>
      </div>

      {/* Context summary chip */}
      <div
        className="mb-3 px-3 py-2 rounded-lg text-xs flex flex-wrap gap-x-3 gap-y-1"
        style={{
          background: isDark ? "rgba(174,240,201,0.06)" : "rgba(22,59,37,0.05)",
        }}
      >
        {contextReady ? (
          <>
            <ContextChip label="open tasks" value={context.openTasks ?? 0} />
            <ContextChip
              label="done (7d)"
              value={context.tasksCompleted7d ?? 0}
            />
            <ContextChip
              label="best streak"
              value={context.bestStreak ?? 0}
            />
            <ContextChip
              label="focus today"
              value={`${context.focusMinutesToday ?? 0}m`}
            />
            {context.recentMoodAvg !== undefined ? (
              <ContextChip
                label="mood (7d)"
                value={`${context.recentMoodAvg.toFixed(1)}/10`}
              />
            ) : null}
          </>
        ) : (
          <span className="gf-muted">Loading your context…</span>
        )}
      </div>

      {/* Conversation */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto gf-scroll gf-card p-4 mb-3"
      >
        {messages.length === 0 ? (
          <div className="text-center py-10">
            <div
              className="mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-3"
              style={{
                background: primaryAccent,
                color: isDark ? "#06130f" : "#ffffff",
              }}
            >
              <Sparkles size={20} />
            </div>
            <p className="gf-muted text-sm mb-4">
              Pick a starter or type your own.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {STARTERS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  className="gf-btn gf-btn-ghost text-xs"
                  onClick={() => send(s.text)}
                >
                  {s.icon} {s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`flex ${m.who === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
                  style={{
                    background:
                      m.who === "user"
                        ? primaryAccent
                        : isDark
                          ? "rgba(174,240,201,0.08)"
                          : "rgba(22,59,37,0.06)",
                    color:
                      m.who === "user"
                        ? isDark
                          ? "#06130f"
                          : "#ffffff"
                        : undefined,
                  }}
                >
                  {m.who === "coach" ? (
                    <div
                      className="flex items-center gap-1.5 text-xs font-semibold mb-1 opacity-80"
                      style={{ color: primaryAccent }}
                    >
                      {toneIcon(m.tone)} Coach
                    </div>
                  ) : null}
                  <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                  {m.suggestions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: isDark
                              ? "rgba(6,19,15,0.4)"
                              : "rgba(255,255,255,0.6)",
                            color: "inherit",
                          }}
                          onClick={() => send(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
            {sending ? (
              <li className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2"
                  style={{
                    background: isDark
                      ? "rgba(174,240,201,0.08)"
                      : "rgba(22,59,37,0.06)",
                  }}
                >
                  <RefreshCw size={14} className="animate-spin" />
                  <span className="gf-muted">Thinking…</span>
                </div>
              </li>
            ) : null}
          </ul>
        )}
      </div>

      {/* Composer */}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <input
          className="gf-input flex-1"
          placeholder="What's on your mind?"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          disabled={sending}
        />
        <button
          type="submit"
          className="gf-btn gf-btn-primary"
          disabled={sending || !draft.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

function ContextChip({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <span>
      <span className="gf-muted">{label}: </span>
      <span className="font-mono font-semibold">{value}</span>
    </span>
  );
}
