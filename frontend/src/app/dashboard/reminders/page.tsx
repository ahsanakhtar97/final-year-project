"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getUserId } from "@/lib/utils";
import {
  Bell, BellOff, Check, CheckCheck, Plus, Trash2,
  Zap, CalendarClock, Smile, ListTodo, X, Loader2,
} from "lucide-react";
import {
  getReminders, getSmartReminders, createReminder,
  markReminderRead, markAllRead, deleteReminder,
  type Reminder, type SmartReminder,
} from "@/app/actions/reminders";

const TYPE_ICON: Record<string, React.ReactNode> = {
  task:   <ListTodo  size={15} />,
  mood:   <Smile     size={15} />,
  habit:  <Zap       size={15} />,
  custom: <Bell      size={15} />,
};

const TYPE_COLOR: Record<string, string> = {
  task:   "#60a5fa",
  mood:   "#34d399",
  habit:  "#fbbf24",
  custom: "#c084fc",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function RemindersPage() {
  const [userId, setUserId]       = useState(0);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [smart, setSmart]         = useState<SmartReminder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");

  // new reminder form
  const [fTitle, setFTitle]     = useState("");
  const [fMessage, setFMessage] = useState("");
  const [fDate, setFDate]       = useState("");
  const [fTime, setFTime]       = useState("");
  const [fType, setFType]       = useState<"custom" | "task" | "mood" | "habit">("custom");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") setNotifPerm(Notification.permission);
  }, []);

  const load = useCallback(async (uid: number) => {
    try {
      const [r, s] = await Promise.all([getReminders(uid), getSmartReminders(uid)]);
      setReminders(r);
      setSmart(s);
    } catch { toast.error("Couldn't load reminders."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const uid = getUserId();
    if (!uid) return;
    setUserId(uid);
    load(uid);
  }, [load]);

  const requestNotifPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === "granted") toast.success("Browser notifications enabled!");
    else toast.info("Notifications blocked. You can enable them in browser settings.");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim() || !userId) return;
    setSaving(true);
    try {
      const scheduledFor = fDate
        ? new Date(`${fDate}T${fTime || "09:00"}:00`).toISOString()
        : undefined;
      const r = await createReminder({ userId, title: fTitle, message: fMessage, type: fType, scheduledFor });
      setReminders(prev => [r, ...prev]);
      setFTitle(""); setFMessage(""); setFDate(""); setFTime(""); setFType("custom");
      setShowForm(false);
      toast.success("Reminder created!");

      // Fire browser notification if scheduled in the future
      if (scheduledFor && notifPerm === "granted") {
        const delay = new Date(scheduledFor).getTime() - Date.now();
        if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            new Notification(fTitle, { body: fMessage || "Time to check in!", icon: "/logo3.png" });
          }, delay);
          toast.info(`Browser notification scheduled for ${new Date(scheduledFor).toLocaleString()}`);
        }
      }
    } catch { toast.error("Couldn't create reminder."); }
    finally { setSaving(false); }
  };

  const handleRead = async (r: Reminder) => {
    setReminders(prev => prev.map(x => x.reminderId === r.reminderId ? { ...x, isRead: true } : x));
    await markReminderRead(r.reminderId, userId).catch(() => {});
  };

  const handleReadAll = async () => {
    setReminders(prev => prev.map(x => ({ ...x, isRead: true })));
    await markAllRead(userId).catch(() => {});
  };

  const handleDelete = async (r: Reminder) => {
    setReminders(prev => prev.filter(x => x.reminderId !== r.reminderId));
    await deleteReminder(r.reminderId, userId).catch(() => {});
  };

  const unread = reminders.filter(r => !r.isRead).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Reminders</h1>
          <p className="gf-muted text-sm mt-0.5">Smart alerts for tasks, mood check-ins, and custom schedules.</p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={handleReadAll} className="gf-btn gf-btn-ghost text-xs">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={() => setShowForm(v => !v)}
            className="gf-btn gf-btn-primary"
          >
            <Plus size={15} /> New Reminder
          </button>
        </div>
      </div>

      {/* Browser notification banner */}
      {notifPerm !== "granted" && (
        <div className="gf-card p-4 flex items-center justify-between gap-3"
          style={{ borderLeft: "3px solid #fbbf24", background: "rgba(251,191,36,0.05)" }}>
          <div className="flex items-center gap-3">
            <Bell size={18} style={{ color: "#fbbf24" }} />
            <div>
              <p className="font-semibold text-sm">Enable browser notifications</p>
              <p className="gf-muted text-xs mt-0.5">Get alerted when a scheduled reminder fires, even if GrowFlow isn&apos;t in focus.</p>
            </div>
          </div>
          <button onClick={requestNotifPermission}
            className="gf-btn gf-btn-ghost text-xs whitespace-nowrap"
            style={{ color: "#fbbf24", borderColor: "rgba(251,191,36,0.3)" }}>
            Enable
          </button>
        </div>
      )}

      {/* New reminder form */}
      {showForm && (
        <div className="gf-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="gf-h2">New reminder</h2>
            <button onClick={() => setShowForm(false)} className="gf-btn gf-btn-ghost !p-1.5"><X size={16} /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              value={fTitle} onChange={e => setFTitle(e.target.value)}
              placeholder="Reminder title *" required
              className="gf-input w-full"
            />
            <textarea
              value={fMessage} onChange={e => setFMessage(e.target.value)}
              placeholder="Message (optional)" rows={2}
              className="gf-textarea w-full"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs gf-muted font-semibold uppercase tracking-wider mb-1">Date</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className="gf-input w-full" />
              </div>
              <div>
                <label className="block text-xs gf-muted font-semibold uppercase tracking-wider mb-1">Time</label>
                <input type="time" value={fTime} onChange={e => setFTime(e.target.value)} className="gf-input w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs gf-muted font-semibold uppercase tracking-wider mb-1">Type</label>
              <div className="flex gap-2 flex-wrap">
                {(["custom","task","mood","habit"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setFType(t)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={{
                      background: fType === t ? `${TYPE_COLOR[t]}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${fType === t ? TYPE_COLOR[t] : "rgba(255,255,255,0.1)"}`,
                      color: fType === t ? TYPE_COLOR[t] : undefined,
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={saving || !fTitle.trim()} className="gf-btn gf-btn-primary w-full">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : <><Bell size={14} /> Create Reminder</>}
            </button>
          </form>
        </div>
      )}

      {/* Smart reminders */}
      {smart.length > 0 && (
        <div className="space-y-2">
          <h2 className="gf-h2 flex items-center gap-2">
            <Zap size={16} style={{ color: "#fbbf24" }} /> Smart Reminders
          </h2>
          {smart.map(s => (
            <div key={s.id} className="gf-card p-4 flex items-start gap-4"
              style={{
                borderLeft: `3px solid ${s.urgent ? "#f87171" : "#6effc4"}`,
                background: s.urgent ? "rgba(248,113,113,0.04)" : "rgba(110,255,196,0.04)",
              }}>
              <div className="mt-0.5" style={{ color: s.urgent ? "#f87171" : "#6effc4" }}>
                {TYPE_ICON[s.type] ?? <Bell size={15} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{s.title}</p>
                <p className="gf-muted text-xs mt-0.5">{s.message}</p>
              </div>
              {s.urgent && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                  Urgent
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Custom reminders */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="gf-skeleton h-16 rounded-xl" />)}
        </div>
      ) : reminders.length === 0 && smart.length === 0 ? (
        <div className="gf-card p-10 text-center">
          <BellOff size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">No reminders yet</p>
          <p className="gf-muted text-sm mt-1">Create one above or they&apos;ll appear automatically when tasks are due.</p>
        </div>
      ) : reminders.length > 0 ? (
        <div className="space-y-2">
          <h2 className="gf-h2 flex items-center gap-2">
            <Bell size={16} /> Your Reminders
            {unread > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                {unread} unread
              </span>
            )}
          </h2>
          {reminders.map(r => {
            const color = TYPE_COLOR[r.type] ?? "#6effc4";
            return (
              <div key={r.reminderId}
                className="gf-card p-4 flex items-start gap-3 transition-all"
                style={{ opacity: r.isRead ? 0.55 : 1 }}>
                <div className="mt-0.5 shrink-0" style={{ color }}>
                  {TYPE_ICON[r.type] ?? <Bell size={15} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-semibold text-sm ${r.isRead ? "line-through opacity-60" : ""}`}>{r.title}</p>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                      style={{ background: `${color}18`, color }}>
                      {r.type}
                    </span>
                  </div>
                  {r.message && <p className="gf-muted text-xs mt-0.5">{r.message}</p>}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] gf-muted">
                    <span>{timeAgo(r.createdAt)}</span>
                    {r.scheduledFor && (
                      <span className="flex items-center gap-1">
                        <CalendarClock size={11} />
                        {new Date(r.scheduledFor).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!r.isRead && (
                    <button onClick={() => handleRead(r)}
                      className="gf-btn gf-btn-ghost !p-1.5" title="Mark read">
                      <Check size={14} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(r)}
                    className="gf-btn gf-btn-ghost !p-1.5" title="Delete"
                    style={{ color: "#e14c4c" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
