"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Trash2, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import {
  upsertMoodLog,
  getRecentMoodLogs,
  deleteMoodLog,
  type MoodLog,
} from "@/app/actions/mood";
import { analyzeMoodText } from "@/app/actions/ai";

// ── Constants ──────────────────────────────────────────────────────────────

const SCORE_OPTIONS = [
  { value: 1, emoji: "😞", label: "Very low" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Excellent" },
];

const EMOTION_TAGS = [
  "anxious", "calm", "content", "energized", "excited",
  "focused", "grateful", "hopeful", "irritable", "overwhelmed",
  "sad", "tired",
];

const TAG_COLORS: Record<string, string> = {
  anxious:     "rgba(225,140,60,0.22)",
  calm:        "rgba(92,242,255,0.20)",
  content:     "rgba(110,255,196,0.20)",
  energized:   "rgba(255,220,50,0.22)",
  excited:     "rgba(180,110,255,0.20)",
  focused:     "rgba(60,160,255,0.20)",
  grateful:    "rgba(110,255,196,0.28)",
  hopeful:     "rgba(92,242,255,0.26)",
  irritable:   "rgba(225,76,76,0.20)",
  overwhelmed: "rgba(225,76,76,0.14)",
  sad:         "rgba(140,140,200,0.22)",
  tired:       "rgba(180,180,180,0.22)",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ── Component ──────────────────────────────────────────────────────────────

export default function MoodPage() {
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [score, setScore] = useState<number>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [loggedToday, setLoggedToday] = useState(false);

  // AI detect state
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReflection, setAiReflection] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecentMoodLogs(30);
      setLogs(data);
      const todayEntry = data.find((l) => l.date === todayIso());
      if (todayEntry) {
        setLoggedToday(true);
        setScore(todayEntry.score);
        setTags(todayEntry.emotionTags ?? []);
        setNote(todayEntry.note ?? "");
      }
    } catch {
      toast.error("Couldn't load mood history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleAiDetect() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const result = await analyzeMoodText(aiText.trim());
      setScore(result.score);
      setTags(result.tags);
      setAiReflection(result.reflection);
      if (!note) setNote(aiText.trim());
      toast.success("AI detected your mood!");
    } catch {
      toast.error("AI detection failed. Fill in manually.");
    } finally {
      setAiLoading(false);
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await upsertMoodLog({
        date: todayIso(),
        score,
        emotionTags: tags.length ? tags : undefined,
        note: note.trim() || undefined,
      });
      toast.success(loggedToday ? "Mood updated!" : "Mood logged!");
      setLoggedToday(true);
      await load();
    } catch {
      toast.error("Couldn't save mood.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMoodLog(id);
      toast.info("Entry removed.");
      await load();
    } catch {
      toast.error("Couldn't remove entry.");
    }
  }

  // Chart data — null gaps for missing days
  const chartData = logs.map((l) => ({
    date: l.date.slice(5), // MM-DD
    score: l.score,
  }));

  const avgScore =
    logs.length > 0
      ? (logs.reduce((s, l) => s + l.score, 0) / logs.length).toFixed(1)
      : "—";

  // Tag frequency for the summary strip
  const tagFreq: Record<string, number> = {};
  for (const log of logs) {
    for (const t of log.emotionTags ?? []) {
      tagFreq[t] = (tagFreq[t] ?? 0) + 1;
    }
  }
  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Mood</h1>
        <p className="gf-muted">Track how you feel each day and spot patterns over time.</p>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="gf-card p-4 text-center">
          <div className="text-2xl font-bold">{avgScore}</div>
          <div className="text-xs gf-muted mt-0.5">30-day avg</div>
        </div>
        <div className="gf-card p-4 text-center">
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-xs gf-muted mt-0.5">days logged</div>
        </div>
        <div className="gf-card p-4 text-center col-span-2 sm:col-span-1">
          <div className="flex flex-wrap gap-1 justify-center">
            {topTags.length > 0
              ? topTags.map(([tag]) => (
                  <span
                    key={tag}
                    className="gf-chip capitalize text-[11px]"
                    style={{ background: TAG_COLORS[tag] ?? "rgba(110,255,196,0.15)" }}
                  >
                    {tag}
                  </span>
                ))
              : <span className="text-xs gf-muted">No tags yet</span>
            }
          </div>
          <div className="text-xs gf-muted mt-1">top emotions</div>
        </div>
      </div>

      {/* Check-in form */}
      <form onSubmit={handleSubmit} className="gf-card p-6 space-y-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} />
          <h2 className="gf-h2">{loggedToday ? "Update today's mood" : "How are you feeling today?"}</h2>
        </div>

        {/* AI detect box */}
        <div className="rounded-xl border border-dashed p-4 space-y-3"
          style={{ borderColor: "rgba(110,255,196,0.3)", background: "rgba(110,255,196,0.04)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#6effc4" }}>
            <Sparkles size={15} />
            Describe how you feel — AI fills everything in
          </div>
          <div className="flex gap-2">
            <textarea
              value={aiText}
              onChange={e => setAiText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiDetect(); } }}
              rows={2}
              placeholder='e.g. "I woke up anxious about the exam but felt better after a walk"'
              className="gf-textarea flex-1 text-sm"
              style={{ resize: "none" }}
            />
            <button
              type="button"
              onClick={handleAiDetect}
              disabled={aiLoading || !aiText.trim()}
              className="rounded-xl px-4 py-2 font-bold text-sm text-[#012016] flex items-center gap-2 self-stretch"
              style={{ background: "linear-gradient(135deg,#6effc4,#1fbf75)", opacity: (!aiText.trim() || aiLoading) ? 0.5 : 1 }}
            >
              {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {aiLoading ? "Detecting…" : "Detect"}
            </button>
          </div>
          {aiReflection && (
            <p className="text-xs italic" style={{ color: "#9df2c8" }}>
              💬 {aiReflection}
            </p>
          )}
          <p className="text-[11px] gf-muted">AI fills in the score and emotion tags below. You can still adjust them.</p>
        </div>

        {/* Score picker */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
            Mood score
          </label>
          <div className="flex gap-2 flex-wrap">
            {SCORE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScore(opt.value)}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all"
                style={{
                  borderColor: score === opt.value ? "#6effc4" : "transparent",
                  background: score === opt.value
                    ? "rgba(110,255,196,0.18)"
                    : "rgba(110,255,196,0.05)",
                  boxShadow: score === opt.value
                    ? "0 0 12px rgba(110,255,196,0.3)"
                    : "none",
                }}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-[11px] opacity-80">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emotion tags */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">
            Emotions (pick all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map((tag) => {
              const active = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className="gf-chip capitalize cursor-pointer transition-all"
                  style={{
                    background: active
                      ? TAG_COLORS[tag] ?? "rgba(110,255,196,0.25)"
                      : "rgba(110,255,196,0.07)",
                    borderWidth: active ? 1 : 0,
                    borderStyle: "solid",
                    borderColor: active ? "#6effc4" : "transparent",
                    opacity: active ? 1 : 0.7,
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">
            Note <span className="normal-case font-normal opacity-60">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="What's contributing to how you feel today?"
            className="gf-textarea"
          />
        </div>

        <button type="submit" disabled={saving} className="gf-btn gf-btn-primary">
          {saving ? "Saving…" : loggedToday ? "Update" : "Log mood"}
        </button>
      </form>

      {/* 30-day chart */}
      {!loading && logs.length > 1 && (
        <div className="gf-card p-6">
          <h2 className="gf-h2 mb-4">30-day mood trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, opacity: 0.7 }}
                interval="preserveStartEnd"
              />
              <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, opacity: 0.7 }} />
              <Tooltip
                formatter={(v: number) => {
                  const opt = SCORE_OPTIONS.find((o) => o.value === v);
                  return [`${opt?.emoji ?? ""} ${opt?.label ?? v}`, "Mood"];
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6effc4"
                strokeWidth={2}
                dot={{ r: 3, fill: "#6effc4" }}
                activeDot={{ r: 5 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History list */}
      {!loading && logs.length > 0 && (
        <div className="space-y-2">
          <h2 className="gf-h2">History</h2>
          {[...logs].reverse().map((log) => {
            const opt = SCORE_OPTIONS.find((o) => o.value === log.score);
            const isToday = log.date === todayIso();
            return (
              <div key={log.moodLogId} className="gf-card p-4 flex items-start gap-4">
                <div className="text-3xl">{opt?.emoji ?? "😐"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{log.date}</span>
                    {isToday && (
                      <span className="gf-chip text-[11px]" style={{ background: "rgba(110,255,196,0.20)" }}>
                        Today
                      </span>
                    )}
                    <span className="text-xs gf-muted">{opt?.label}</span>
                  </div>
                  {(log.emotionTags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(log.emotionTags ?? []).map((tag) => (
                        <span
                          key={tag}
                          className="gf-chip capitalize text-[11px]"
                          style={{ background: TAG_COLORS[tag] ?? "rgba(110,255,196,0.15)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {log.note && (
                    <p className="mt-1.5 text-sm opacity-80 line-clamp-2">{log.note}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(log.moodLogId)}
                  className="gf-btn gf-btn-ghost !p-2 shrink-0"
                  aria-label="Delete entry"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!loading && logs.length === 0 && (
        <div className="gf-card p-10 text-center">
          <div className="text-4xl mb-3">😐</div>
          <div className="font-semibold mb-1">No mood logs yet.</div>
          <p className="gf-muted text-sm">Log your first check-in above to start tracking.</p>
        </div>
      )}
    </div>
  );
}
