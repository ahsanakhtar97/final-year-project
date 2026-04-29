"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Moon,
  Save,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  deleteSleep,
  getRecentSleep,
  upsertSleep,
  type SleepLog,
} from "@/app/actions/sleep";
import { ErrorBoundary } from "@/app/components/error-boundary";
import { EmptyState } from "@/app/components/empty-state";

const QUALITY_LABELS: Record<number, string> = {
  1: "Awful",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Restorative",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function SleepPage() {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [date, setDate] = useState(todayIso());
  const [hours, setHours] = useState("7.5");
  const [quality, setQuality] = useState(3);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setLogs(await getRecentSleep(30)); }
    catch { toast.error("Couldn't load sleep history."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsedHours = Number(hours);
    if (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 24) {
      toast.error("Hours must be between 0 and 24.");
      return;
    }
    setBusy(true);
    try {
      await upsertSleep({
        date,
        hours: parsedHours,
        quality,
        note: note.trim() || undefined,
      });
      toast.success("Logged.");
      setNote("");
      void load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await deleteSleep(id);
      toast.info("Removed.");
      void load();
    } catch { toast.error("Couldn't remove."); }
  }

  const stats = useMemo(() => {
    if (logs.length === 0) return { avgHours: 0, avgQuality: 0, last7: [] as SleepLog[] };
    const last7 = logs.slice(-7);
    const sumH = logs.reduce((a, l) => a + Number(l.hours), 0);
    const sumQ = logs.reduce((a, l) => a + Number(l.quality), 0);
    return {
      avgHours: sumH / logs.length,
      avgQuality: sumQ / logs.length,
      last7,
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Sleep</h1>
        <p className="gf-muted">
          Sleep is the lever everything else rests on. Track it for a week and watch
          your other charts move.
        </p>
      </header>

      <form onSubmit={save} className="gf-card p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Night of</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={todayIso()}
              required
              className="gf-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Hours</label>
            <input
              type="number"
              step="0.25"
              min={0}
              max={24}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              required
              className="gf-input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Quality</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuality(q)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
                    quality === q ? "gf-btn-primary" : "gf-btn-ghost"
                  }`}
                  title={QUALITY_LABELS[q]}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider opacity-80 mb-1">Note (optional)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything notable -- early wake, dreams, late caffeine"
            className="gf-input"
          />
        </div>
        <button type="submit" disabled={busy} className="gf-btn gf-btn-primary">
          <Save size={14} /> {busy ? "Saving…" : "Save night"}
        </button>
      </form>

      {loading ? (
        <div className="gf-skeleton h-56 rounded-2xl" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<Moon size={28} />}
          title="No sleep logged yet."
          description="Log tonight when you wake up. After a week the trend chart starts to mean something."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Avg hours" value={stats.avgHours.toFixed(1)} />
            <Stat label="Avg quality" value={stats.avgQuality.toFixed(1)} />
            <Stat label="Logged nights" value={String(logs.length)} />
          </div>

          <div className="gf-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Moon size={16} />
              <h2 className="gf-h2">Last 30 nights</h2>
            </div>
            <ErrorBoundary label="the chart">
              <div className="h-64">
                <ResponsiveContainer>
                  <LineChart data={logs.map((l) => ({ ...l, hours: Number(l.hours) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(110,255,196,0.12)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10,30,22,0.92)",
                        border: "1px solid rgba(110,255,196,0.25)",
                        borderRadius: 12,
                        color: "#e7f7ee",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#6effc4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ErrorBoundary>
          </div>

          <section className="space-y-2">
            <h2 className="gf-h2">Recent</h2>
            {[...logs].reverse().map((l) => (
              <div key={l.sleepLogId} className="gf-card p-4 flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="font-semibold">{l.date}</div>
                  <div className="text-sm opacity-85">
                    {Number(l.hours).toFixed(1)}h · {QUALITY_LABELS[l.quality]} ({l.quality}/5)
                  </div>
                  {l.note && <p className="mt-1 text-sm opacity-80">{l.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => remove(l.sleepLogId)}
                  className="gf-btn gf-btn-ghost"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="gf-card p-4">
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="gf-mono text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
