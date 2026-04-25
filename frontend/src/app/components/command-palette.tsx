"use client";

/**
 * Global command palette.
 *
 * Cmd/Ctrl+K (or "/" in some clients) opens a quick launcher with:
 *  - navigation to every dashboard page
 *  - quick-create shortcuts (new task, new journal entry...)
 *  - in-app actions (toggle theme, toggle privacy, log out)
 *  - free-text search across tasks, habits, journal entries, goals
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Plus,
  Sun,
  Moon,
  Eye,
  EyeOff,
  LogOut,
  CheckSquare,
  Heart,
  BookOpen,
  Timer,
  TrendingUp,
  Trophy,
  Target,
  Calendar,
  Sparkles,
  Settings as SettingsIcon,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "@/app/dashboard/theme-context";
import { clearAuth } from "@/lib/auth";
import { getUserId } from "@/lib/utils";
import { getTasks } from "@/app/actions/tasks";
import { getHabitsByUserId } from "@/app/actions/user-habits";
import { getGoalsByUser } from "@/app/actions/goals";
import { getJournalEntriesByUser } from "@/app/actions/journal";

interface PaletteItem {
  id: string;
  group: "Navigate" | "Create" | "Actions" | "Tasks" | "Habits" | "Goals" | "Journal";
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: number }>;
  run: () => void;
  keywords?: string;
}

export default function CommandPalette() {
  const router = useRouter();
  const { isDark, toggleTheme, isPrivate, togglePrivacy, primaryAccent } =
    useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Lazy-loaded fuzzy data; fetched on first open.
  const [tasks, setTasks] = useState<{ id: number; title: string }[]>([]);
  const [habits, setHabits] = useState<{ id: number; name: string }[]>([]);
  const [goals, setGoals] = useState<{ id: number; title: string }[]>([]);
  const [entries, setEntries] = useState<{ id: number; preview: string }[]>([]);
  const [loadedData, setLoadedData] = useState(false);

  // Open / close hotkeys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Load search corpus once.
  useEffect(() => {
    if (!open || loadedData) return;
    const userId = getUserId();
    if (!userId) {
      setLoadedData(true);
      return;
    }
    (async () => {
      try {
        const [t, h, g, j] = await Promise.all([
          getTasks().catch(() => []),
          getHabitsByUserId(userId).catch(() => []),
          getGoalsByUser(userId).catch(() => []),
          getJournalEntriesByUser(userId).catch(() => []),
        ]);
        setTasks(t.map((x) => ({ id: x.taskId, title: x.title })));
        setHabits(h.map((x) => ({ id: x.habitId, name: x.habitName })));
        setGoals(g.map((x) => ({ id: x.goalId, title: x.title })));
        setEntries(
          j.slice(0, 50).map((x) => ({
            id: x.entryId,
            preview: (x.content ?? "").slice(0, 80),
          })),
        );
      } finally {
        setLoadedData(true);
      }
    })();
  }, [open, loadedData]);

  // Reset state on close.
  useEffect(() => {
    if (open) {
      setActive(0);
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  function go(href: string) {
    router.push(href);
    setOpen(false);
  }

  const items: PaletteItem[] = useMemo(() => {
    const nav: PaletteItem[] = [
      { id: "nav-dash", group: "Navigate", label: "Dashboard", icon: LayoutDashboard, run: () => go("/dashboard") },
      { id: "nav-tasks", group: "Navigate", label: "To Do List", icon: CheckSquare, run: () => go("/dashboard/to-do") },
      { id: "nav-habits", group: "Navigate", label: "Habit Tracker", icon: Heart, run: () => go("/dashboard/habit-tracker") },
      { id: "nav-journal", group: "Navigate", label: "Growth Journal", icon: BookOpen, run: () => go("/dashboard/journal") },
      { id: "nav-focus", group: "Navigate", label: "Focus Timer", icon: Timer, run: () => go("/dashboard/focus") },
      { id: "nav-insights", group: "Navigate", label: "Insights", icon: TrendingUp, run: () => go("/dashboard/insights") },
      { id: "nav-achievements", group: "Navigate", label: "Achievements", icon: Trophy, run: () => go("/dashboard/achievements") },
      { id: "nav-goals", group: "Navigate", label: "Goals", icon: Target, run: () => go("/dashboard/goals") },
      { id: "nav-calendar", group: "Navigate", label: "Calendar", icon: Calendar, run: () => go("/dashboard/calendar") },
      { id: "nav-coach", group: "Navigate", label: "Coach", icon: Sparkles, run: () => go("/dashboard/coach") },
      { id: "nav-settings", group: "Navigate", label: "Settings", icon: SettingsIcon, run: () => go("/dashboard/settings") },
      { id: "nav-profile", group: "Navigate", label: "Profile", icon: UserIcon, run: () => go("/dashboard/profile") },
    ];

    const create: PaletteItem[] = [
      { id: "new-task", group: "Create", label: "New task", icon: Plus, run: () => go("/dashboard/to-do?new=1") },
      { id: "new-journal", group: "Create", label: "New journal entry", icon: Plus, run: () => go("/dashboard/journal?new=1") },
      { id: "new-habit", group: "Create", label: "New habit", icon: Plus, run: () => go("/dashboard/habit-tracker?new=1") },
      { id: "new-goal", group: "Create", label: "New goal", icon: Plus, run: () => go("/dashboard/goals?new=1") },
      { id: "new-focus", group: "Create", label: "Start a focus block", icon: Timer, run: () => go("/dashboard/focus") },
    ];

    const actions: PaletteItem[] = [
      {
        id: "act-theme",
        group: "Actions",
        label: isDark ? "Switch to light theme" : "Switch to dark theme",
        icon: isDark ? Sun : Moon,
        run: () => {
          toggleTheme();
          setOpen(false);
        },
      },
      {
        id: "act-priv",
        group: "Actions",
        label: isPrivate ? "Disable privacy mode" : "Enable privacy mode",
        icon: isPrivate ? Eye : EyeOff,
        run: () => {
          togglePrivacy();
          setOpen(false);
        },
      },
      {
        id: "act-logout",
        group: "Actions",
        label: "Log out",
        icon: LogOut,
        run: () => {
          clearAuth();
          router.replace("/login");
          setOpen(false);
        },
      },
    ];

    const dyn: PaletteItem[] = [
      ...tasks.map((t) => ({
        id: `task-${t.id}`,
        group: "Tasks" as const,
        label: t.title,
        icon: CheckSquare,
        run: () => go("/dashboard/to-do"),
        keywords: t.title,
      })),
      ...habits.map((h) => ({
        id: `habit-${h.id}`,
        group: "Habits" as const,
        label: h.name,
        icon: Heart,
        run: () => go("/dashboard/habit-tracker"),
        keywords: h.name,
      })),
      ...goals.map((g) => ({
        id: `goal-${g.id}`,
        group: "Goals" as const,
        label: g.title,
        icon: Target,
        run: () => go("/dashboard/goals"),
        keywords: g.title,
      })),
      ...entries.map((e) => ({
        id: `entry-${e.id}`,
        group: "Journal" as const,
        label: e.preview || "(empty entry)",
        icon: BookOpen,
        run: () => go("/dashboard/journal"),
        keywords: e.preview,
      })),
    ];

    return [...nav, ...create, ...actions, ...dyn];
  }, [tasks, habits, goals, entries, isDark, isPrivate]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      // Default: hide dynamic results until the user types.
      return items.filter((i) =>
        ["Navigate", "Create", "Actions"].includes(i.group),
      );
    }
    return items.filter((i) => {
      const hay = `${i.label} ${i.keywords ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [q, items]);

  // Group filtered items keeping original order.
  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    filtered.forEach((i) => {
      const arr = map.get(i.group) ?? [];
      arr.push(i);
      map.set(i.group, arr);
    });
    return Array.from(map.entries());
  }, [filtered]);

  // Track active item across groups.
  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered, active]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  }

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-20 px-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl gf-card overflow-hidden"
        style={{ padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 border-b"
          style={{
            borderBottomColor: isDark
              ? "rgba(174,240,201,0.10)"
              : "rgba(22,59,37,0.10)",
          }}
        >
          <Search size={16} style={{ color: primaryAccent }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent outline-none text-sm py-1.5"
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded font-mono"
            style={{
              background: isDark
                ? "rgba(174,240,201,0.10)"
                : "rgba(22,59,37,0.08)",
            }}
          >
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto gf-scroll">
          {filtered.length === 0 ? (
            <div className="text-center py-10 gf-muted text-sm">
              Nothing matches “{q}”.
            </div>
          ) : (
            grouped.map(([group, list]) => (
              <div key={group} className="py-1">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider gf-muted">
                  {group}
                </div>
                {list.map((item) => {
                  runningIndex += 1;
                  const isActive = runningIndex === active;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => item.run()}
                      onMouseEnter={() => {
                        // bind active to the matching index using a fresh count
                        const i = filtered.findIndex((x) => x.id === item.id);
                        if (i >= 0) setActive(i);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm"
                      style={{
                        background: isActive
                          ? isDark
                            ? "rgba(174,240,201,0.10)"
                            : "rgba(22,59,37,0.06)"
                          : "transparent",
                      }}
                    >
                      <Icon size={14} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive ? <ArrowRight size={12} /> : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div
          className="px-3 py-2 text-[10px] gf-muted border-t flex items-center justify-between"
          style={{
            borderTopColor: isDark
              ? "rgba(174,240,201,0.10)"
              : "rgba(22,59,37,0.10)",
          }}
        >
          <span>↑↓ to navigate · Enter to run</span>
          <span>
            Toggle with <kbd className="font-mono">⌘K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
