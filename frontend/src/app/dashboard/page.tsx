"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RCPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

/*
  Upgraded Dashboard (Premium Green theme, inline styles)
  - animations, gradients, hover micro-interactions
  - dark-mode toggle (green dark)
  - weekly/monthly analytics, best/worst habit, task velocity
  - retains compatibility with habit data shape used earlier
*/

const STORAGE_KEY = "growflow_habits_v1";
const MOOD_KEY = "growflow_moods_v1";
const TASK_KEY = "growflow_tasks_v1";
const THEME_KEY = "growflow_theme_v1";

const DATE_KEY = (d = new Date()) => d.toISOString().slice(0, 10);

// helper: build dates array n days ago
function buildPastDates(numDays: number, from = new Date()) {
  return Array.from({ length: numDays }).map((_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() - (numDays - 1 - i));
    return d;
  });
}

export default function DashboardPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [moods, setMoods] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // theme: "light" | "dark"
  const [theme, setTheme] = useState<"light" | "dark">(
    (typeof window !== "undefined" && (localStorage.getItem(THEME_KEY) as any)) || "light"
  );

  useEffect(() => {
    // load persisted theme first
    try {
      const t = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
      if (t) setTheme(t);
    } catch (e) {}
    // mount animation
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    // load data
    try {
      const h = localStorage.getItem(STORAGE_KEY);
      if (h) setHabits(JSON.parse(h));

      const m = localStorage.getItem(MOOD_KEY);
      if (m) setMoods(JSON.parse(m));

      const t = localStorage.getItem(TASK_KEY);
      if (t) setTasks(JSON.parse(t));
    } catch (e) {
      console.error("Failed loading local data", e);
    }
  }, []);

  useEffect(() => {
    // apply body background for full-page theme
    if (typeof document !== "undefined") {
      if (theme === "dark") {
        document.body.style.background = "linear-gradient(180deg,#081510,#0f2a21)";
        document.body.style.color = "#e7f7ee";
      } else {
        document.body.style.background = "linear-gradient(180deg,#dff8e3,#bfe7c5)";
        document.body.style.color = "#123716";
      }
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {}
  }, [theme]);

  const today = DATE_KEY();

  // ---------- Derived analytics ----------

  // productivity: habits completed today + tasks completed
  const completedHabitsToday = habits.filter((h) => h.records?.[today]).length;
  const completedTasksTotal = tasks.filter((t) => t.status === "completed").length;
  const totalItems = habits.length + tasks.length;
  const productivityScore = totalItems ? Math.round(((completedHabitsToday + completedTasksTotal) / totalItems) * 100) : 0;

  // last 7 and last 30 days arrays (labels + values)
  const last7Dates = buildPastDates(7);
  const last30Dates = buildPastDates(30);

  const last7 = last7Dates.map((d) => {
    const key = DATE_KEY(d);
    const completed = habits.filter((h) => h.records?.[key]).length;
    return { day: key.slice(5), completed };
  });

  const last30 = last30Dates.map((d) => {
    const key = DATE_KEY(d);
    const completed = habits.filter((h) => h.records?.[key]).length;
    return { day: key.slice(5), completed };
  });

  // task pie breakdown
  const taskCounts = useMemo(() => {
    const todo = tasks.filter((t) => t.status === "todo").length;
    const inProg = tasks.filter((t) => t.status === "in-progress").length;
    const done = tasks.filter((t) => t.status === "completed").length;
    return { todo, inProg, done };
  }, [tasks]);

  const taskPieData = [
    { name: "To Do", value: taskCounts.todo },
    { name: "In Progress", value: taskCounts.inProg },
    { name: "Completed", value: taskCounts.done },
  ];

  // task velocity: tasks completed in each of last 4 weeks
  const taskVelocityData = useMemo(() => {
    const now = new Date();
    const weeks = [];
    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (w + 1) * 7 + 1);
      const end = new Date(now);
      end.setDate(now.getDate() - w * 7);
      const startKey = DATE_KEY(start);
      const endKey = DATE_KEY(end);
      const count = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        const k = DATE_KEY(d);
        return k >= startKey && k <= endKey;
      }).length;
      weeks.push({ week: `${startKey.slice(5)}→${endKey.slice(5)}`, completed: count });
    }
    return weeks;
  }, [tasks]);

  // best / worst habit in last 30 days (by completion percentage)
  const bestWorst = useMemo(() => {
    if (!habits.length) return { best: null, worst: null };
    const scores = habits.map((h) => {
      const total = last30Dates.length;
      let done = 0;
      for (const d of last30Dates) {
        if (h.records?.[DATE_KEY(d)]) done++;
      }
      const pct = total ? Math.round((done / total) * 100) : 0;
      return { id: h.id, name: h.name, pct, done };
    });
    const sorted = [...scores].sort((a, b) => b.pct - a.pct);
    return { best: sorted[0] || null, worst: sorted[sorted.length - 1] || null };
  }, [habits]);

  // weekly / monthly summaries
  const weeklySummary = useMemo(() => {
    // habits completed in last 7 days (count unique habits completed at least once)
    const last7Keys = last7Dates.map((d) => DATE_KEY(d));
    const habitsCompletedUnique = habits.filter((h) => last7Keys.some((k) => h.records?.[k])).length;
    const tasksCompletedWeek = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const k = DATE_KEY(new Date(t.completedAt));
      return last7Keys.includes(k);
    }).length;
    return { habitsCompletedUnique, tasksCompletedWeek };
  }, [habits, tasks]);

  const monthlySummary = useMemo(() => {
    const last30Keys = last30Dates.map((d) => DATE_KEY(d));
    const habitsCompletedUnique = habits.filter((h) => last30Keys.some((k) => h.records?.[k])).length;
    const tasksCompletedMonth = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const k = DATE_KEY(new Date(t.completedAt));
      return last30Keys.includes(k);
    }).length;
    return { habitsCompletedUnique, tasksCompletedMonth };
  }, [habits, tasks]);

  // habit streak helper
  function computeStreak(habit: any) {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = DATE_KEY(d);
      if (habit.records?.[k]) streak++;
      else break;
    }
    return streak;
  }

  // toggle theme
  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  }

  // small UI styles (inline + CSS block for animations / hover)
  const palette = {
    lightBg: "linear-gradient(180deg,#dff8e3,#bfe7c5)",
    lightCard: "#ffffff",
    lightAccent: "#163b25",
    darkBg: "linear-gradient(180deg,#06130f,#0f2a21)", // green dark gradient
    darkCard: "#0f241f",
    darkAccent: "#8fe8b2",
  };

  const isDark = theme === "dark";

  const pageStyle: React.CSSProperties = {
    padding: 24,
    transition: "background 350ms ease, color 350ms ease, transform 400ms ease",
    transform: mounted ? "translateY(0) scale(1)" : "translateY(6px) scale(0.995)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  };

  const h1Style: React.CSSProperties = {
    fontSize: 32,
    margin: 0,
    color: isDark ? palette.darkAccent : palette.lightAccent,
  };

  const smallMuted: React.CSSProperties = {
    fontSize: 13,
    color: isDark ? "#a8d9bb" : "#2f6b45",
  };

  const cardBase: React.CSSProperties = {
    background: isDark ? palette.darkCard : palette.lightCard,
    borderRadius: 14,
    padding: 16,
    boxShadow: isDark
      ? "0 6px 18px rgba(0,0,0,0.5)"
      : "0 10px 30px rgba(12,70,36,0.08)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.03)" : "rgba(19,55,22,0.06)"}`,
    transition: "transform 180ms ease, box-shadow 180ms ease, background 300ms ease",
  };

  const greenAccent = isDark ? "#aef0c9" : "#163b25";
  const greenAccentSoft = isDark ? "rgba(174,240,201,0.08)" : "rgba(21,82,42,0.06)";

  // small helper for animated glow
  const productivityCircleStyle: React.CSSProperties = {
    margin: "12px auto",
    width: 128,
    height: 128,
    borderRadius: "50%",
    border: `10px solid ${greenAccent}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 28,
    fontWeight: 700,
    color: isDark ? palette.darkAccent : palette.lightCard,
    background: isDark ? "rgba(20,70,50,0.06)" : palette.lightCard,
    boxShadow: isDark ? `0 0 30px rgba(174,240,201,0.06)` : `0 6px 20px rgba(22,59,34,0.08)`,
    transition: "box-shadow 300ms ease, transform 200ms ease",
  };

  // small card hover style via inline onMouse events (to keep no external CSS required)
  function useHoverTransform() {
    const [hover, setHover] = useState(false);
    return {
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      style: { transform: hover ? "translateY(-6px)" : "translateY(0)", boxShadow: hover ? "0 14px 40px rgba(19,55,22,0.12)" : undefined },
    };
  }

  // ---------- Render ----------
  return (
    <div
      style={{
        ...(pageStyle as any),
        minHeight: "100vh",
        background: isDark ? palette.darkBg : palette.lightBg,
      }}
    >
      {/* internal CSS for small animations (keyframes) */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeInUp 480ms ease both; }
        .muted { opacity: 0.9; }
        .btn {
          cursor: pointer;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 600;
          border: none;
        }
        .glass {
          background: ${isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.7)"};
          backdrop-filter: blur(6px);
        }
      `}</style>

      <div style={headerStyle} className="fade-up">
        <div>
          <h1 style={h1Style}>Dashboard</h1>
          <div style={smallMuted}>Overview — {new Date().toLocaleDateString()}</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: isDark ? "#bfead0" : "#2f6b45" }}>Theme</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
              <button
                onClick={toggleTheme}
                className="btn"
                style={{
                  background: isDark ? "linear-gradient(90deg,#153a2f,#0f1f17)" : "linear-gradient(90deg,#2c7a4a,#163b25)",
                  color: "#fff",
                  boxShadow: isDark ? "0 6px 18px rgba(0,0,0,0.5)" : "0 8px 24px rgba(15,50,25,0.18)",
                }}
                title="Toggle theme"
              >
                {isDark ? "🌿 Green Light" : "🌙 Green Dark"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOP ROW */}
      <div style={{ display: "flex", gap: 20, marginTop: 18, flexWrap: "wrap" }}>
        <div style={{ ...cardBase, width: 300 }} className="fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, color: isDark ? "#cfeed8" : "#2f6b45", fontWeight: 700 }}>Productivity</div>
              <div style={{ fontSize: 12, color: isDark ? "#bfead0" : "#3e6f4a", marginTop: 6 }}>Combined habits + tasks</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: isDark ? "#9fdab0" : "#2a5b3a" }}>Today</div>
              <div style={{ fontSize: 13, color: isDark ? "#dff9e8" : "#123716", fontWeight: 700 }}>
                {completedHabitsToday} habits • {completedTasksTotal} tasks
              </div>
            </div>
          </div>

          <div
            style={{ ...productivityCircleStyle, marginTop: 12 }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{ textAlign: "center", lineHeight: 1 }}>
              <div style={{ fontSize: 28 }}>{productivityScore}%</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{totalItems ? `${totalCompleted}/${totalItems}` : "0/0"}</div>
            </div>
          </div>
        </div>

        <div style={{ ...cardBase, width: 240 }} className="fade-up">
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#cfeed8" : "#2f6b45" }}>Today's Mood</div>
          <div style={{ fontSize: 44, textAlign: "center", marginTop: 12 }}>{moods[today] || "—"}</div>
          <div style={{ fontSize: 12, marginTop: 6, color: isDark ? "#9fdab0" : "#3e6f4a", textAlign: "center" }}>
            Mood recorded: {moods[today] ? "Yes" : "No"}
          </div>
        </div>

        <div style={{ ...cardBase, width: 260 }} className="fade-up">
          <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#cfeed8" : "#2f6b45" }}>Focus</div>
          <div style={{ fontSize: 36, textAlign: "center", marginTop: 12 }}>{/* dynamic later */} {42}m</div>
          <div style={{ fontSize: 12, color: isDark ? "#9fdab0" : "#3e6f4a", marginTop: 8, textAlign: "center" }}>
            Focus minutes today
          </div>
        </div>
      </div>

      {/* midsize row: trend + quick stats */}
      <div style={{ display: "flex", gap: 20, marginTop: 28, alignItems: "stretch", flexWrap: "wrap" }}>
        {/* Habit trend (7 days) */}
        <div style={{ ...cardBase, flex: 1, minWidth: 360 }} className="fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: greenAccent }}>Habit Completion — 7d</div>
            <div style={smallMuted}>Recent activity</div>
          </div>

          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.03)" : "#e8f3ea"} />
                <XAxis dataKey="day" stroke={isDark ? "#a7e8c6" : "#2f6b45"} />
                <YAxis allowDecimals={false} stroke={isDark ? "#9fdab0" : "#2f6b45"} />
                <Tooltip
                  wrapperStyle={{ background: isDark ? "#0b221a" : "#fff" }}
                  contentStyle={{ color: isDark ? "#e6ffef" : "#123716" }}
                />
                <Line type="monotone" dataKey="completed" stroke={greenAccent} strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick summary column */}
        <div style={{ width: 360, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ ...cardBase }} className="fade-up">
            <div style={{ fontSize: 15, fontWeight: 700, color: greenAccent }}>Weekly Summary</div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#bfead0" : "#3e6f4a" }}>Habits touched</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{weeklySummary.habitsCompletedUnique}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#bfead0" : "#3e6f4a" }}>Tasks done</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{weeklySummary.tasksCompletedWeek}</div>
              </div>
            </div>
          </div>

          <div style={{ ...cardBase }} className="fade-up">
            <div style={{ fontSize: 15, fontWeight: 700, color: greenAccent }}>Monthly Summary</div>
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#bfead0" : "#3e6f4a" }}>Habits touched</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{monthlySummary.habitsCompletedUnique}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: isDark ? "#bfead0" : "#3e6f4a" }}>Tasks done</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{monthlySummary.tasksCompletedMonth}</div>
              </div>
            </div>
          </div>

          <div style={{ ...cardBase }} className="fade-up">
            <div style={{ fontSize: 15, fontWeight: 700, color: greenAccent }}>Best / Worst Habit (30d)</div>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, color: isDark ? "#bfead0" : "#3e6f4a" }}>
                Best:
                <span style={{ fontWeight: 700, marginLeft: 8 }}>{bestWorst.best ? `${bestWorst.best.name} (${bestWorst.best.pct}%)` : "—"}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: isDark ? "#bfead0" : "#3e6f4a" }}>
                Worst:
                <span style={{ fontWeight: 700, marginLeft: 8 }}>{bestWorst.worst ? `${bestWorst.worst.name} (${bestWorst.worst.pct}%)` : "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task breakdown + streaks + velocity */}
      <div style={{ display: "flex", gap: 24, marginTop: 28, flexWrap: "wrap" }}>
        <div style={{ ...cardBase, flex: 1, minWidth: 380 }} className="fade-up">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: greenAccent }}>Tasks: completion breakdown</div>
            <div style={smallMuted}>Live from local storage</div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
            <div style={{ width: 280, height: 280 }}>
              <RCPieChart width={280} height={280}>
                <Pie data={taskPieData} cx={140} cy={140} outerRadius={100} label dataKey="value">
                  <Cell fill="#8fc48f" />
                  <Cell fill="#4f8b4f" />
                  <Cell fill={greenAccent} />
                </Pie>
              </RCPieChart>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 10, height: 10, background: "#8fc48f", borderRadius: 3 }} />
                <div style={{ fontWeight: 700 }}>{taskCounts.todo} To Do</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                <div style={{ width: 10, height: 10, background: "#4f8b4f", borderRadius: 3 }} />
                <div style={{ fontWeight: 700 }}>{taskCounts.inProg} In progress</div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                <div style={{ width: 10, height: 10, background: greenAccent, borderRadius: 3 }} />
                <div style={{ fontWeight: 700 }}>{taskCounts.done} Completed</div>
              </div>

              <div style={{ marginTop: 16, fontSize: 13, color: isDark ? "#bfead0" : "#3e6f4a" }}>
                Tip: move cards between columns to update statuses (if your tasks UI supports it).
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: 420 }} className="fade-up">
          <div style={{ ...cardBase, marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: greenAccent }}>Habit Streaks (sample)</div>
            <div style={{ marginTop: 10 }}>
              {habits.length === 0 && <div style={smallMuted}>No habits yet.</div>}
              {habits.slice(0, 6).map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px dashed ${isDark ? "rgba(255,255,255,0.02)" : "rgba(19,55,22,0.04)"}` }}>
                  <div style={{ fontWeight: 700, color: isDark ? "#e6ffef" : "#123716" }}>{h.name}</div>
                  <div style={{ color: isDark ? "#bfead0" : "#3e6f4a" }}>{computeStreak(h)} d</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardBase }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: greenAccent }}>Task Velocity (4 weeks)</div>
            <div style={{ height: 180, marginTop: 8 }}>
              <ResponsiveContainer>
                <BarChart data={taskVelocityData}>
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completed" fill={greenAccent} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: isDark ? "#bfead0" : "#3e6f4a" }}>
              Completed tasks per week (last 4 weeks)
            </div>
          </div>
        </div>
      </div>

      {/* Footer notes / small CTA */}
      <div style={{ marginTop: 28, textAlign: "center", color: isDark ? "#9fdab0" : "#2f6b45" }}>
        Built with ❤️ — Green theme active. Dark-mode preserves green accents.
      </div>
    </div>
  );
}
