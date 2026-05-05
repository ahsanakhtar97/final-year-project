"use client";

/**
 * Focus Timer (Pomodoro) page.
 *
 * Self-contained: state lives in component + localStorage so the timer
 * survives reloads. Optional task linking lets users mark a task as
 * "in progress" while they work and "completed" when they finish a focus
 * block early. Logged sessions stay client-side (localStorage) for now.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Timer as TimerIcon,
  Coffee,
  CheckCircle2,
  Volume2,
  VolumeX,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { toast } from "react-toastify";
import { getTasks, updateTaskStatus, addFocusMinutes } from "@/app/actions/tasks";
import { Task, TaskStatus } from "@/types/tasks";

type Mode = "focus" | "shortBreak" | "longBreak";

const DEFAULT_DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const MODE_LABEL: Record<Mode, string> = {
  focus: "Deep focus",
  shortBreak: "Short break",
  longBreak: "Long break",
};

interface SessionLog {
  id: string;
  mode: Mode;
  durationSec: number;
  completedAt: string; // ISO
  taskTitle?: string;
}

const STORAGE_KEY = "gf_focus_log_v1";
const SOUND_KEY = "gf_focus_sound_v1";

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function format(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

// Simple WebAudio bell so we don't have to ship an asset.
function playBell() {
  try {
    const Ctx =
      (window.AudioContext as typeof AudioContext) ||
      ((window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext as typeof AudioContext);
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.3);
  } catch {
    /* audio is best-effort */
  }
}

export default function FocusPage() {
  const { primaryAccent, isDark } = useTheme();

  const [mode, setMode] = useState<Mode>("focus");
  const [durations, setDurations] = useState<Record<Mode, number>>(DEFAULT_DURATIONS);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_DURATIONS.focus);
  const [running, setRunning] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | "">("");
  const [log, setLog] = useState<SessionLog[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  const intervalRef = useRef<number | null>(null);

  // Load persisted state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setLog(JSON.parse(saved));
      const sound = localStorage.getItem(SOUND_KEY);
      if (sound !== null) setSoundOn(sound === "true");
    } catch {
      /* ignore */
    }
    (async () => {
      try {
        const all = await getTasks();
        setTasks(all.filter((t) => t.taskStatus !== TaskStatus.COMPLETED));
      } catch {
        /* tasks list is optional */
      }
    })();
  }, []);

  // Persist log
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch {
      /* ignore */
    }
  }, [log]);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_KEY, String(soundOn));
    } catch {
      /* ignore */
    }
  }, [soundOn]);

  // When mode changes, reset the clock (only if not running).
  useEffect(() => {
    if (!running) setSecondsLeft(durations[mode]);
  }, [mode, running, durations]);

  // Tick.
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // session finished
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setRunning(false);
          handleSessionComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.taskId === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const handleSessionComplete = async () => {
    if (soundOn) playBell();
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Focus session complete", {
          body: `${MODE_LABEL[mode]} done. Take a moment.`,
        });
      } catch {
        /* ignore */
      }
    }
    const entry: SessionLog = {
      id: `${Date.now()}`,
      mode,
      durationSec: durations[mode],
      completedAt: new Date().toISOString(),
      taskTitle: selectedTask?.title,
    };
    setLog((prev) => [entry, ...prev].slice(0, 50));
    if (mode === "focus") {
      setCompletedToday((c) => c + 1);

      if (selectedTaskId !== "") {
        try {
          await addFocusMinutes(Number(selectedTaskId), Math.round(durations.focus / 60));
          toast.success("Focus time logged to task!");
        } catch {
          toast.error("Failed to log focus time to server.");
        }
      } else {
        toast.success("Focus block complete \u2014 nice work!");
      }

      // Auto-suggest a break.
      setMode((completedToday + 1) % 4 === 0 ? "longBreak" : "shortBreak");
    } else {
      toast.info("Break over. Ready for another round?");
      setMode("focus");
    }
  };

  const start = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        /* ignore */
      }
    }
    // Move task to in-progress when starting a focus block.
    if (mode === "focus" && selectedTask && selectedTask.taskStatus === TaskStatus.TO_DO) {
      try {
        await updateTaskStatus(selectedTask.taskId, TaskStatus.IN_PROGRESS);
        setTasks((prev) =>
          prev.map((t) =>
            t.taskId === selectedTask.taskId
              ? { ...t, taskStatus: TaskStatus.IN_PROGRESS }
              : t,
          ),
        );
      } catch {
        /* non-fatal */
      }
    }
    setRunning(true);
  };

  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setSecondsLeft(durations[mode]);
  };

  const setCustomMinutes = (m: Mode, minutes: number) => {
    const secs = Math.max(1, Math.min(180, minutes)) * 60;
    setDurations(prev => ({ ...prev, [m]: secs }));
    if (m === mode && !running) setSecondsLeft(secs);
  };

  const skip = () => {
    setRunning(false);
    setSecondsLeft(0);
    handleSessionComplete();
  };

  const finishTask = async () => {
    if (!selectedTask) return;
    try {
      await updateTaskStatus(selectedTask.taskId, TaskStatus.COMPLETED);
      setTasks((prev) => prev.filter((t) => t.taskId !== selectedTask.taskId));
      setSelectedTaskId("");
      toast.success(`"${selectedTask.title}" marked complete`);
    } catch {
      toast.error("Couldn't update task");
    }
  };

  const clearLog = () => {
    if (!log.length) return;
    if (confirm("Clear your focus history?")) setLog([]);
  };

  const total = durations[mode];
  const progress = ((total - secondsLeft) / total) * 100;
  const minutesToday = Math.round(
    log
      .filter(
        (e) =>
          e.mode === "focus" &&
          new Date(e.completedAt).toDateString() === new Date().toDateString(),
      )
      .reduce((sum, e) => sum + e.durationSec, 0) / 60,
  );

  return (
    <div className="mx-auto max-w-5xl gf-fade-up">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            className="gf-h1"
            style={{ fontFamily: "'Lora', serif", color: primaryAccent }}
          >
            Focus
          </h1>
          <p className="gf-muted mt-1 text-sm">
            One thing at a time. The timer keeps you honest.
          </p>
        </div>
        <button
          onClick={() => setSoundOn((s) => !s)}
          className="gf-btn gf-btn-ghost"
          aria-label={soundOn ? "Mute bell" : "Unmute bell"}
          title={soundOn ? "Sound on" : "Sound off"}
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="hidden sm:inline">
            {soundOn ? "Sound on" : "Sound off"}
          </span>
        </button>
      </div>

      {/* Mode picker */}
      <div className="gf-card p-2 mb-5 flex gap-1 sm:gap-2">
        {(["focus", "shortBreak", "longBreak"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            disabled={running}
            className={`flex-1 gf-btn !py-2 text-sm font-semibold ${
              mode === m ? "gf-btn-primary" : "gf-btn-ghost"
            }`}
          >
            {m === "focus" ? (
              <TimerIcon size={14} />
            ) : (
              <Coffee size={14} />
            )}
            <span className="hidden sm:inline">{MODE_LABEL[m]}</span>
          </button>
        ))}
      </div>

      {/* Custom durations */}
      <div className="gf-card mb-5 overflow-hidden">
        <button
          onClick={() => setShowCustom(s => !s)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-[var(--gf-text)] hover:bg-white/5 transition-colors"
        >
          <span className="flex items-center gap-2">
            <TimerIcon size={14} style={{ color: primaryAccent }} />
            Custom durations
          </span>
          <span className="gf-muted text-xs">
            {showCustom ? "▲ Hide" : `Focus: ${Math.round(durations.focus / 60)}m · Short: ${Math.round(durations.shortBreak / 60)}m · Long: ${Math.round(durations.longBreak / 60)}m`}
          </span>
        </button>

        {showCustom && (
          <div className="border-t border-[var(--gf-border)] px-5 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { key: "focus"      as Mode, label: "Focus",       icon: "🎯", max: 120 },
              { key: "shortBreak" as Mode, label: "Short break",  icon: "☕", max: 30  },
              { key: "longBreak"  as Mode, label: "Long break",   icon: "🌿", max: 60  },
            ]).map(({ key, label, icon, max }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold gf-muted flex items-center gap-1">
                  {icon} {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={max}
                    disabled={running}
                    value={Math.round(durations[key] / 60)}
                    onChange={e => setCustomMinutes(key, Number(e.target.value))}
                    className="gf-input w-20 text-center font-bold"
                    style={{ color: key === mode ? primaryAccent : undefined }}
                  />
                  <span className="text-sm gf-muted">min</span>
                  <input
                    type="range"
                    min={1}
                    max={max}
                    disabled={running}
                    value={Math.round(durations[key] / 60)}
                    onChange={e => setCustomMinutes(key, Number(e.target.value))}
                    className="flex-1 accent-[var(--gf-accent)]"
                  />
                </div>
              </div>
            ))}
            <p className="sm:col-span-3 text-xs gf-muted mt-1">
              Changes apply immediately when the timer is stopped. Max: Focus 120 min · Short break 30 min · Long break 60 min.
            </p>
          </div>
        )}
      </div>

      {/* Timer card */}
      <div className="gf-card p-8 sm:p-10 text-center">
        {/* Ring */}
        <div className="relative mx-auto h-56 w-56 sm:h-64 sm:w-64">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={isDark ? "rgba(174,240,201,0.15)" : "rgba(22,59,37,0.10)"}
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={primaryAccent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * 289} 289`}
              style={{ transition: "stroke-dasharray 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl sm:text-6xl font-bold tabular-nums"
              style={{
                fontFamily: "'Lora', serif",
                color: primaryAccent,
              }}
            >
              {format(secondsLeft)}
            </span>
            <span className="gf-muted text-xs uppercase tracking-widest mt-1">
              {MODE_LABEL[mode]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {!running ? (
            <button onClick={start} className="gf-btn gf-btn-primary">
              <Play size={16} /> Start
            </button>
          ) : (
            <button onClick={pause} className="gf-btn gf-btn-primary">
              <Pause size={16} /> Pause
            </button>
          )}
          <button onClick={reset} className="gf-btn gf-btn-ghost">
            <RotateCcw size={16} /> Reset
          </button>
          <button onClick={skip} className="gf-btn gf-btn-ghost">
            <SkipForward size={16} /> Skip
          </button>
        </div>

        {/* Today summary */}
        <div className="mt-5 flex justify-center gap-6 text-sm">
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: primaryAccent }}
            >
              {completedToday}
            </div>
            <div className="gf-muted">blocks today</div>
          </div>
          <div className="border-l border-[var(--gf-border)]" />
          <div>
            <div
              className="text-2xl font-bold"
              style={{ color: primaryAccent }}
            >
              {minutesToday}
            </div>
            <div className="gf-muted">minutes focused</div>
          </div>
        </div>
      </div>

      {/* Task picker */}
      <div className="mt-6 gf-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="gf-h2">What are you working on?</h3>
          {selectedTask && (
            <button onClick={finishTask} className="gf-btn gf-btn-ghost !py-1.5">
              <CheckCircle2 size={14} /> Mark done
            </button>
          )}
        </div>
        {tasks.length === 0 ? (
          <p className="gf-muted text-sm">
            No active tasks. Add one from the To-Do page to track focus
            against it.
          </p>
        ) : (
          <select
            value={selectedTaskId}
            onChange={(e) =>
              setSelectedTaskId(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="gf-select w-full"
          >
            <option value="">No task — just focus</option>
            {tasks.map((t) => (
              <option key={t.taskId} value={t.taskId}>
                {t.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* History */}
      <div className="mt-6 gf-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="gf-h2">Recent sessions</h3>
          {log.length > 0 && (
            <button
              onClick={clearLog}
              className="gf-btn gf-btn-ghost !py-1.5 text-xs"
            >
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
        {log.length === 0 ? (
          <p className="gf-muted text-sm">
            Your finished sessions will show up here.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--gf-border)]">
            {log.slice(0, 10).map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-semibold">{MODE_LABEL[e.mode]}</span>
                  {e.taskTitle && (
                    <span className="gf-muted"> · {e.taskTitle}</span>
                  )}
                </div>
                <span className="gf-muted text-xs">
                  {new Date(e.completedAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
