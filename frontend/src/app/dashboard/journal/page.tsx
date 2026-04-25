"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import confetti from "canvas-confetti";
import { getUserId } from "@/lib/utils";
import { toast } from "react-toastify";
import {
  Loader2,
  Sparkles,
  Send,
  X,
  Trash2,
  BookOpen,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntriesByUser,
} from "@/app/actions/journal";
import { JournalEntry } from "@/types/journal";

// Words longer than this in the textarea are flagged as "you might be venting"
// -- purely cosmetic; the analyzer still runs.
const STREAK_GOAL_WORDS = 80;

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Score from the Python service is roughly in 0-100 (or sometimes -1..1). Normalize. */
function normalizeScore(raw: number | null | undefined): number | null {
  if (raw === null || raw === undefined || Number.isNaN(raw)) return null;
  if (raw >= -1 && raw <= 1) return Math.round(((raw + 1) / 2) * 100);
  return Math.round(Math.max(0, Math.min(100, raw)));
}

function moodLabel(score: number | null): string {
  if (score === null) return "Saved";
  if (score >= 75) return "Bright";
  if (score >= 55) return "Steady";
  if (score >= 35) return "Mixed";
  return "Heavy";
}

export default function JournalPage() {
  const { isDark, primaryAccent } = useTheme();
  const [entry, setEntry] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latest, setLatest] = useState<JournalEntry | null>(null);
  const [history, setHistory] = useState<JournalEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const uid = getUserId();
    if (uid) setUserId(uid);
  }, []);

  // Load history once we have a userId.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const entries = await getJournalEntriesByUser(userId);
        if (!cancelled) setHistory(entries);
      } catch {
        if (!cancelled) toast.error("Couldn't load past entries.");
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter((e) => e.content.toLowerCase().includes(q));
  }, [history, search]);

  // Stats: entry count + 7-day streak (consecutive calendar days with at least
  // one entry, working backwards from today).
  const stats = useMemo(() => {
    const days = new Set(
      history.map((e) => new Date(e.createdAt).toISOString().slice(0, 10)),
    );
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (days.has(key)) streak += 1;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    const last7 = history.filter((e) => {
      const ageDays =
        (Date.now() - new Date(e.createdAt).getTime()) / 86_400_000;
      return ageDays <= 7;
    });
    const avg = (() => {
      const scored = last7
        .map((e) => normalizeScore(e.sentimentScore))
        .filter((n): n is number => n !== null);
      if (!scored.length) return null;
      return Math.round(scored.reduce((s, n) => s + n, 0) / scored.length);
    })();
    return { total: history.length, streak, weeklyAvg: avg };
  }, [history]);

  const handleSave = async () => {
    if (!entry.trim() || isAnalyzing || !userId) return;
    setIsAnalyzing(true);
    try {
      const saved = await createJournalEntry({
        userId,
        content: entry.trim(),
      });
      setLatest(saved);
      setHistory((prev) => [saved, ...prev]);

      const norm = normalizeScore(saved.sentimentScore);
      if (norm !== null && norm >= 75) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#60d394", "#1fbf75", "#c7ffdc"],
        });
      }
      toast.success("Entry saved.");
      setEntry("");
    } catch {
      toast.error("Couldn't save the entry. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    const prev = history;
    setHistory((h) => h.filter((e) => e.entryId !== entryId));
    if (latest?.entryId === entryId) setLatest(null);
    try {
      await deleteJournalEntry(entryId);
      toast.success("Entry deleted.");
    } catch {
      setHistory(prev);
      toast.error("Couldn't delete that entry.");
    }
  };

  const latestScore = normalizeScore(latest?.sentimentScore ?? null);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1
          className="gf-h1"
          style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
        >
          Growth Journal
        </h1>
        <p className="gf-muted mt-1 text-sm sm:text-base">
          Write down your thoughts. Each entry is saved and analyzed so you can
          look back on patterns in your emotional well-being.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="gf-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs uppercase tracking-wider gf-muted">
            <BookOpen size={12} />
            Entries
          </div>
          <div
            className="mt-1 text-2xl font-bold"
            style={{ color: primaryAccent }}
          >
            {stats.total}
          </div>
        </div>
        <div className="gf-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs uppercase tracking-wider gf-muted">
            <CalendarDays size={12} />
            Streak
          </div>
          <div
            className="mt-1 text-2xl font-bold"
            style={{ color: primaryAccent }}
          >
            {stats.streak}d
          </div>
        </div>
        <div className="gf-card p-4 text-center">
          <div className="flex items-center justify-center gap-1 text-xs uppercase tracking-wider gf-muted">
            <TrendingUp size={12} />
            7-day mood
          </div>
          <div
            className="mt-1 text-2xl font-bold"
            style={{ color: primaryAccent }}
          >
            {stats.weeklyAvg !== null ? `${stats.weeklyAvg}` : "\u2014"}
          </div>
        </div>
      </div>

      {/* Composer */}
      <div className="gf-card gf-fade-up p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="gf-chip">
            <Sparkles size={12} />
            New entry
          </span>
          <span className="gf-muted text-xs">
            {wordCount} word{wordCount === 1 ? "" : "s"}
            {wordCount > 0 && wordCount < STREAK_GOAL_WORDS && (
              <> &middot; {STREAK_GOAL_WORDS - wordCount} to go</>
            )}
          </span>
        </div>

        <textarea
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
          placeholder="How was your day? What's been on your mind?"
          className="gf-textarea min-h-[260px] sm:min-h-[320px] text-base leading-relaxed"
          style={{ fontFamily: "'Lora', serif" }}
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="gf-muted text-xs">
            Your entries are private. Sentiment analysis runs once when you
            save and the feedback is stored alongside the text.
          </p>
          <button
            onClick={handleSave}
            disabled={!entry.trim() || isAnalyzing || !userId}
            className="gf-btn gf-btn-primary w-full sm:w-auto"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving&hellip;
              </>
            ) : (
              <>
                <Send size={16} />
                Save &amp; Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* Latest entry feedback */}
      {latest && (latest.feedbackEnglish || latest.feedbackUrdu) && (
        <div
          className="gf-card gf-fade-up mt-6 p-5 sm:p-6"
          style={{
            background: isDark
              ? "linear-gradient(135deg,#0f241f 0%, #06130f 100%)"
              : "linear-gradient(135deg,#ffffff 0%, #f0fff4 100%)",
            border: `2px solid ${isDark ? "#8fe8b2" : "#163b25"}`,
          }}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(145deg,#1fbf75,#108a54)",
                  color: "#052818",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: primaryAccent }}
                >
                  AI Feedback
                </div>
                {latestScore !== null && (
                  <div className="gf-muted text-xs">
                    Positivity score:{" "}
                    <span className="font-bold">{latestScore}</span>/100
                    &middot; {moodLabel(latestScore)}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLatest(null)}
              className="gf-btn gf-btn-ghost !p-2"
              aria-label="Dismiss feedback"
            >
              <X size={16} />
            </button>
          </div>

          {latest.feedbackEnglish && (
            <p className="text-base leading-relaxed">
              {latest.feedbackEnglish}
            </p>
          )}
          {latest.feedbackUrdu && (
            <p
              className="mt-3 text-base leading-relaxed gf-muted"
              dir="rtl"
              style={{ fontFamily: "'Lora', serif" }}
            >
              {latest.feedbackUrdu}
            </p>
          )}
        </div>
      )}

      {/* History */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            className="text-lg font-bold"
            style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
          >
            Past entries
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search\u2026"
            className="gf-input max-w-[200px] text-sm"
          />
        </div>

        {historyLoading ? (
          <div className="space-y-3">
            <div className="gf-skeleton h-24 rounded-xl" />
            <div className="gf-skeleton h-24 rounded-xl" />
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="gf-card p-6 text-center gf-muted text-sm">
            {history.length === 0
              ? "Your first entry will appear here."
              : "No entries match that search."}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredHistory.map((e) => {
              const score = normalizeScore(e.sentimentScore);
              return (
                <li key={e.entryId} className="gf-card p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-xs gf-muted">
                      {formatDate(e.createdAt)}
                      {score !== null && (
                        <>
                          {" "}
                          &middot;{" "}
                          <span className="font-bold">
                            {moodLabel(score)} ({score})
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.entryId)}
                      className="gf-btn gf-btn-ghost !p-2"
                      aria-label="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p
                    className="mt-2 whitespace-pre-wrap text-sm leading-relaxed"
                    style={{ fontFamily: "'Lora', serif" }}
                  >
                    {e.content}
                  </p>
                  {e.feedbackEnglish && (
                    <p className="mt-3 text-xs gf-muted italic">
                      &ldquo;{e.feedbackEnglish}&rdquo;
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
