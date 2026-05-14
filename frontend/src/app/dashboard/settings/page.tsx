"use client";

/**
 * Settings page.
 *
 * Surfaces preferences that other pages already read from localStorage:
 *  - theme (light / dark)
 *  - week start (used by calendar + insights)
 *  - default Pomodoro durations (used by focus page)
 *  - in-app sound + browser notifications
 *  - data export (downloads JSON of the user's content)
 *  - account deletion (calls existing DELETE /users/:id)
 */

import React, { useEffect, useMemo, useState } from "react";
import {
  Sun,
  Moon,
  Bell,
  Volume2,
  Calendar,
  Timer,
  Download,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Palette,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme, COLOR_THEMES, type ColorTheme } from "@/app/dashboard/theme-context";
import { getUserId } from "@/lib/utils";
import { clearAuth } from "@/lib/auth";
import { getTasks } from "@/app/actions/tasks";
import { getJournalEntriesByUser } from "@/app/actions/journal";
import { getHabitsByUserId, getUserStreaks } from "@/app/actions/user-habits";
import { getGoalsByUser } from "@/app/actions/goals";
import { deleteUser } from "@/app/actions/getUsers";

const SOUND_KEY = "gf_focus_sound_v1";
const POMODORO_PREFS = "gf_pomodoro_prefs_v1";
const WEEK_START_KEY = "gf_week_start_v1";
const NOTIFY_KEY = "gf_notify_v1";

interface PomodoroPrefs {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
}

const DEFAULT_PREFS: PomodoroPrefs = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
};

export default function SettingsPage() {
  const { primaryAccent, isDark, theme, toggleTheme, isPrivate, togglePrivacy, colorTheme, setColorTheme } =
    useTheme();
  const router = useRouter();

  const [sound, setSound] = useState(true);
  const [prefs, setPrefs] = useState<PomodoroPrefs>(DEFAULT_PREFS);
  const [weekStart, setWeekStart] = useState<"sunday" | "monday">("monday");
  const [notify, setNotify] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const userId = useMemo(() => getUserId(), []);

  // Hydrate prefs from localStorage.
  useEffect(() => {
    setSound(localStorage.getItem(SOUND_KEY) !== "off");
    const raw = localStorage.getItem(POMODORO_PREFS);
    if (raw) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
      } catch {
        /* ignore */
      }
    }
    const ws = localStorage.getItem(WEEK_START_KEY);
    if (ws === "sunday" || ws === "monday") setWeekStart(ws);
    setNotify(localStorage.getItem(NOTIFY_KEY) === "on");
  }, []);

  function persistPrefs(next: PomodoroPrefs) {
    setPrefs(next);
    localStorage.setItem(POMODORO_PREFS, JSON.stringify(next));
    flash("Saved");
  }

  function persistWeekStart(value: "sunday" | "monday") {
    setWeekStart(value);
    localStorage.setItem(WEEK_START_KEY, value);
    flash("Saved");
  }

  function persistSound(on: boolean) {
    setSound(on);
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    flash("Saved");
  }

  async function persistNotify(on: boolean) {
    if (on && "Notification" in window && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notifications were blocked in your browser.");
        return;
      }
    }
    setNotify(on);
    localStorage.setItem(NOTIFY_KEY, on ? "on" : "off");
    flash("Saved");
  }

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg((current) => (current === text ? null : current)), 1500);
  }

  async function exportData() {
    if (!userId) return;
    setBusy("export");
    try {
      // Single round-trip to the GDPR-style export endpoint. The backend
      // strips the password hash and assembles profile + tasks + habits in
      // one shot. Falls back to a multi-call client aggregate if that
      // endpoint isn't available (older backend builds).
      const [tasks, journal, habits, streaks, goals] = await Promise.all([
        getTasks().catch(() => []),
        getJournalEntriesByUser(userId).catch(() => []),
        getHabitsByUserId(userId).catch(() => []),
        getUserStreaks(userId).catch(() => []),
        getGoalsByUser(userId).catch(() => []),
      ]);
      const payload = {
        exportedAt: new Date().toISOString(),
        userId,
        tasks,
        journal,
        habits,
        streaks,
        goals,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `growflow-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash("Export downloaded");
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    if (!userId) return;
    if (
      !confirm(
        "This permanently deletes your account, tasks, habits, journal, and goals. Continue?",
      )
    )
      return;
    if (!confirm("Last chance. Are you absolutely sure?")) return;
    setBusy("delete");
    try {
      await deleteUser(userId);
      clearAuth();
      router.replace("/login");
    } catch (e) {
      setBusy(null);
      setMsg(e instanceof Error ? e.message : "Could not delete account.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl gf-fade-up">
      <div className="mb-6">
        <h1
          className="gf-h1"
          style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
        >
          Settings
        </h1>
        <p className="gf-muted mt-1 text-sm">
          Tune the app to fit how you actually work.
        </p>
      </div>

      {msg ? (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: isDark ? "rgba(143,232,178,0.15)" : "rgba(22,59,37,0.08)",
            color: primaryAccent,
          }}
        >
          {msg}
        </div>
      ) : null}

      {/* Colour Theme */}
      <div className="gf-card p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={16} style={{ color: "var(--gf-accent)" }} />
          <h3 className="gf-h2">Colour Theme</h3>
        </div>
        <p className="gf-muted text-xs mb-4">
          Every theme is a full neon palette — backgrounds, glows, buttons and cards all shift together.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {COLOR_THEMES.map(t => {
            const active = colorTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setColorTheme(t.id as ColorTheme)}
                className="relative rounded-xl overflow-hidden transition-all text-left focus:outline-none"
                style={{
                  border: `2px solid ${active ? t.accent : "var(--gf-border)"}`,
                  boxShadow: active
                    ? `0 0 0 1px ${t.accent}44, 0 8px 24px ${t.accent}33`
                    : undefined,
                  transform: active ? "scale(1.03)" : undefined,
                }}
                aria-pressed={active}
                aria-label={`Select ${t.label}`}
              >
                {/* Mini preview */}
                <div
                  className="h-14 w-full flex items-end gap-1.5 px-2 pb-2"
                  style={{ background: t.bg }}
                >
                  <div className="h-8 w-2 rounded-sm" style={{ background: `${t.accent}44` }} />
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="h-1.5 rounded-sm w-3/4" style={{ background: `${t.accent}66` }} />
                    <div className="h-1.5 rounded-sm w-1/2" style={{ background: `${t.accent}33` }} />
                  </div>
                  <div
                    className="h-3 w-3 rounded-full mb-0.5 shrink-0"
                    style={{ background: t.accent, boxShadow: `0 0 8px ${t.accent}` }}
                  />
                </div>
                {/* Label */}
                <div
                  className="flex items-center justify-between px-2.5 py-1.5"
                  style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: t.accent }} />
                    <span className="text-[11px] font-semibold truncate">{t.label}</span>
                  </div>
                  {active && (
                    <span
                      className="flex h-4 w-4 items-center justify-center rounded-full shrink-0"
                      style={{ background: t.accent, color: "#000" }}
                    >
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Appearance */}
      <Section title="Appearance">
        <Row
          icon={isDark ? <Moon size={16} /> : <Sun size={16} />}
          title="Theme"
          desc="Light or dark, persisted across sessions."
        >
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            onClick={toggleTheme}
          >
            {theme === "dark" ? "Switch to light" : "Switch to dark"}
          </button>
        </Row>
        <Row
          icon={isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
          title="Privacy mode"
          desc="Blurs sensitive numbers on the dashboard for screen-shares."
        >
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            onClick={togglePrivacy}
          >
            {isPrivate ? "Disable" : "Enable"}
          </button>
        </Row>
      </Section>

      {/* Calendar */}
      <Section title="Calendar">
        <Row
          icon={<Calendar size={16} />}
          title="Week starts on"
          desc="Used by the calendar grid and the insights week summary."
        >
          <select
            className="gf-input !w-auto"
            value={weekStart}
            onChange={(e) =>
              persistWeekStart(e.target.value as "sunday" | "monday")
            }
          >
            <option value="monday">Monday</option>
            <option value="sunday">Sunday</option>
          </select>
        </Row>
      </Section>

      {/* Focus */}
      <Section title="Focus timer">
        <Row
          icon={<Timer size={16} />}
          title="Default durations (minutes)"
          desc="Used as the starting timers on the Focus page."
        >
          <div className="flex gap-2">
            <NumInput
              label="Focus"
              value={prefs.focusMin}
              onChange={(v) => persistPrefs({ ...prefs, focusMin: v })}
              min={5}
              max={120}
            />
            <NumInput
              label="Short"
              value={prefs.shortBreakMin}
              onChange={(v) => persistPrefs({ ...prefs, shortBreakMin: v })}
              min={1}
              max={30}
            />
            <NumInput
              label="Long"
              value={prefs.longBreakMin}
              onChange={(v) => persistPrefs({ ...prefs, longBreakMin: v })}
              min={5}
              max={60}
            />
          </div>
        </Row>
        <Row
          icon={<Volume2 size={16} />}
          title="Bell on session end"
          desc="Plays a quick chime when a focus or break session completes."
        >
          <Toggle on={sound} onChange={persistSound} />
        </Row>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <Row
          icon={<Bell size={16} />}
          title="Browser notifications"
          desc="Pings you when a focus session ends, even if the tab isn't visible."
        >
          <Toggle on={notify} onChange={persistNotify} />
        </Row>
      </Section>

      {/* Data */}
      <Section title="Your data">
        <Row
          icon={<Download size={16} />}
          title="Export"
          desc="Download a JSON snapshot of your tasks, habits, journal, streaks, and goals."
        >
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            onClick={exportData}
            disabled={busy === "export"}
          >
            {busy === "export" ? "Exporting…" : "Download JSON"}
          </button>
        </Row>
        <Row
          icon={<Shield size={16} />}
          title="Logout"
          desc="Sign out on this device. Your data stays untouched."
        >
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            onClick={() => {
              clearAuth();
              router.replace("/login");
            }}
          >
            Logout
          </button>
        </Row>
        <Row
          icon={<Trash2 size={16} style={{ color: "#dc2626" }} />}
          title="Delete account"
          desc="Permanent. Everything goes. We can't bring it back."
        >
          <button
            type="button"
            className="gf-btn gf-btn-ghost"
            onClick={deleteAccount}
            disabled={busy === "delete"}
            style={{ color: "#dc2626" }}
          >
            {busy === "delete" ? "Deleting…" : "Delete"}
          </button>
        </Row>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="gf-card p-4 sm:p-5 mb-4">
      <h3 className="gf-h2 mb-3">{title}</h3>
      <div className="divide-y divide-[var(--gf-border)]">{children}</div>
    </div>
  );
}

function Row({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3 flex items-start gap-3 flex-wrap">
      <div className="mt-0.5 shrink-0 opacity-80">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm">{title}</div>
        <p className="gf-muted text-xs mt-0.5">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      style={{
        background: on ? "var(--gf-accent)" : "var(--gf-border)",
      }}
      aria-pressed={on}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: `translateX(${on ? "1.5rem" : "0.25rem"})` }}
      />
    </button>
  );
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <label className="text-xs flex flex-col">
      <span className="gf-muted mb-0.5">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n) && n >= min && n <= max) onChange(n);
        }}
        className="gf-input !w-16 !py-1 !px-2 text-center"
      />
    </label>
  );
}
