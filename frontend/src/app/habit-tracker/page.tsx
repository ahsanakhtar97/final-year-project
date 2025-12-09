// frontend/src/app/habit-tracker/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

type HabitType = "positive" | "bad";

type Habit = {
  id: string;
  name: string;
  description?: string;
  type: HabitType;
  reminder?: string; // simple text or time string
  records: Record<string, boolean>; // dateKey -> done (YYYY-MM-DD)
  bestStreak?: number;
};

type MoodKey = string; // dateKey -> mood string

const DATE_KEY = (d = new Date()) =>
  d.toISOString().slice(0, 10); /* YYYY-MM-DD */

const startOfWeek = (d = new Date()) => {
  // Monday as first day
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // how many days since monday
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const weekDates = (today = new Date()) => {
  const start = startOfWeek(today);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const STORAGE_KEY = "growflow_habits_v1";
const MOOD_KEY = "growflow_moods_v1";

export default function HabitTrackerPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [moods, setMoods] = useState<Record<MoodKey, string>>({});
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<HabitType>("positive");
  const [newReminder, setNewReminder] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setHabits(JSON.parse(raw));
      }
      const rawM = localStorage.getItem(MOOD_KEY);
      if (rawM) setMoods(JSON.parse(rawM));
    } catch (e) {
      console.error("Failed to load habits:", e);
    }
  }, []);

  // save on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem(MOOD_KEY, JSON.stringify(moods));
  }, [moods]);

  // helpers
  const addHabit = () => {
    const name = newName.trim();
    if (!name) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name,
      description: newDesc.trim() || undefined,
      type: newType,
      reminder: newReminder.trim() || undefined,
      records: {},
      bestStreak: 0,
    };

    setHabits((s) => [habit, ...s]);
    setNewName("");
    setNewDesc("");
    setNewReminder("");
    setNewType("positive");
  };

  const deleteHabit = (id: string) => {
    if (!confirm("Delete this habit? This cannot be undone.")) return;
    setHabits((s) => s.filter((h) => h.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleToday = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const key = DATE_KEY();
        const newRecords = { ...h.records, [key]: !h.records[key] };
        // compute bestStreak if toggled on
        const updated: Habit = { ...h, records: newRecords };
        updated.bestStreak = computeBestStreak(updated.records);
        return updated;
      })
    );
  };

  function computeStreak(records: Record<string, boolean>) {
    // current consecutive days up to today
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = DATE_KEY(d);
      if (records[key]) count++;
      else break;
    }
    return count;
  }

  function computeBestStreak(records: Record<string, boolean>) {
    // scan records to find longest consecutive run
    // we will check each day in range of recorded dates
    const keys = Object.keys(records).filter((k) => records[k]);
    if (!keys.length) return 0;
    // create a Set for O(1)
    const set = new Set(keys);
    // find longest streak by checking starts
    let best = 0;
    for (const k of keys) {
      const d = new Date(k);
      // if previous day not present, this is a start
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      const prevKey = DATE_KEY(prev);
      if (set.has(prevKey)) continue; // not a start
      // count forward
      let cur = new Date(d);
      let run = 0;
      while (set.has(DATE_KEY(cur))) {
        run++;
        cur.setDate(cur.getDate() + 1);
      }
      if (run > best) best = run;
    }
    return best;
  }

  const toggleRecord = (habitId: string, dateKey: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const newRecords = { ...h.records, [dateKey]: !h.records[dateKey] };
        // if toggled off, remove key to keep data tidy
        if (!newRecords[dateKey]) delete newRecords[dateKey];
        const updated: Habit = { ...h, records: newRecords };
        updated.bestStreak = computeBestStreak(updated.records);
        return updated;
      })
    );
  };

  const setMoodForToday = (mood: string) => {
    const key = DATE_KEY();
    setMoods((prev) => ({ ...prev, [key]: mood }));
  };

  // derived
  const todayKey = DATE_KEY();
  const week = weekDates();
  const habitsCompletedToday = habits.filter((h) => h.records[todayKey]).length;
  const percentToday = habits.length ? Math.round((habitsCompletedToday / habits.length) * 100) : 0;

  const moodsOptions = [
    { k: "😄", label: "Great" },
    { k: "🙂", label: "Good" },
    { k: "😐", label: "Okay" },
    { k: "😔", label: "Bad" },
  ];

  // small presentational helpers
  const container = {
    fontFamily: "'Lora','Georgia',serif",
    minHeight: "100vh",
    background: "linear-gradient(180deg,#dff8e3,#bfe7c5)",
    padding: 28,
    color: "#123716",
    boxSizing: "border-box" as const,
  };

  const card = {
    background: "#fff",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  };

  const headerStyle = {
    textAlign: "center" as const,
    fontSize: 34,
    marginBottom: 18,
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e0e0e0",
    marginBottom: 10,
    boxSizing: "border-box" as const,
  };

  const smallBtn = (bg = "#163b25") => ({
    background: bg,
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 10,
    cursor: "pointer",
  });

  return (
    <main style={container}>
      <h1 style={headerStyle}>Habit Tracker</h1>

      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 18 }}>
        {/* top summary row */}
        <div style={{ display: "flex", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 8 }}>
              <strong>Today's progress</strong>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 18 }}>{habitsCompletedToday}/{habits.length} habits</div>
                <div style={{ flex: 1, height: 14, background: "#e6f1ea", borderRadius: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${percentToday}%`,
                      background: "#163b25",
                      transition: "width 300ms ease",
                    }}
                  />
                </div>
                <div style={{ minWidth: 52, textAlign: "right" }}>{percentToday}%</div>
              </div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Tip: Click any habit to expand it's weekly view, description and streak.
              </div>
            </div>

            <div style={{ ...card, width: 260 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>Today's Mood</strong>
              <div style={{ display: "flex", gap: 8 }}>
                {moodsOptions.map((m) => (
                  <button
                    key={m.k}
                    onClick={() => setMoodForToday(m.k)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: moods[DATE_KEY()] === m.k ? "2px solid #163b25" : "1px solid #e6e6e6",
                      background: "#fff",
                      cursor: "pointer",
                      fontSize: 18,
                    }}
                    title={m.label}
                  >
                    {m.k}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
                Selected: {moods[DATE_KEY()] || "—"}
              </div>
            </div>
          </div>

          {/* add habit card */}
          <div style={{ width: 340, ...card }}>
            <strong style={{ display: "block", marginBottom: 8 }}>Add Habit</strong>
            <input
              style={inputStyle}
              placeholder="Habit name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Short description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Reminder (text/time, optional)"
              value={newReminder}
              onChange={(e) => setNewReminder(e.target.value)}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="radio"
                  name="type"
                  checked={newType === "positive"}
                  onChange={() => setNewType("positive")}
                />{" "}
                Positive
              </label>
              <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="radio"
                  name="type"
                  checked={newType === "bad"}
                  onChange={() => setNewType("bad")}
                />{" "}
                Bad habit
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setNewName(""); setNewDesc(""); setNewReminder(""); }} style={{ ...smallBtn("#999") }}>
                Clear
              </button>
              <button onClick={addHabit} style={smallBtn()}>
                Add
              </button>
            </div>
          </div>
        </div>

        {/* main list of habits */}
        <div style={{ display: "grid", gap: 12 }}>
          {habits.length === 0 && (
            <div style={{ ...card, textAlign: "center" }}>
              No habits yet — add one on the right to get started.
            </div>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {habits.map((h) => {
              const currentStreak = computeStreak(h.records);
              const best = h.bestStreak ?? computeBestStreak(h.records);
              const doneToday = !!h.records[DATE_KEY()];
              const weeklyCompleted = week.map((d) => h.records[DATE_KEY(d)] ?? false);
              const weekCount = weeklyCompleted.filter(Boolean).length;
              const weekPercent = Math.round((weekCount / 7) * 100);

              return (
                <div key={h.id} style={{ width: 340 }}>
                  <div style={{ ...card }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{h.name}</div>
                        <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                          {h.type === "positive" ? "Positive habit" : "Bad habit (avoid)"}
                          {h.reminder ? ` • Reminder: ${h.reminder}` : ""}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button
                          onClick={() => toggleToday(h.id)}
                          style={{
                            ...smallBtn(doneToday ? "#1e8f4b" : "#163b25"),
                            minWidth: 86,
                          }}
                          title="Mark done for today"
                        >
                          {doneToday ? "Done ✓" : "Mark"}
                        </button>
                        <button
                          onClick={() => deleteHabit(h.id)}
                          style={{ ...smallBtn("#d9534f") }}
                          title="Delete habit"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 10, background: "#e9f3ea", borderRadius: 8, overflow: "hidden" }}>
                          <div style={{ width: `${weekPercent}%`, height: "100%", background: "#163b25", transition: "width 300ms" }} />
                        </div>
                        <div style={{ fontSize: 12, marginTop: 6, color: "#444" }}>
                          Weekly: {weekCount}/7 • {weekPercent}%
                        </div>
                      </div>

                      <div style={{ textAlign: "right", minWidth: 120 }}>
                        <div style={{ fontSize: 12, color: "#666" }}>Streak</div>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{currentStreak}d</div>
                        <div style={{ fontSize: 12, color: "#999" }}>Best {best}d</div>
                      </div>
                    </div>

                    <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                        style={{ ...smallBtn("#f0f0f0"), color: "#123716", border: "1px solid #e6e6e6" }}
                      >
                        {expandedId === h.id ? "Collapse" : "Expand"}
                      </button>
                      <div style={{ fontSize: 12, color: "#777" }}>{Object.keys(h.records).length} records</div>
                    </div>
                  </div>

                  {expandedId === h.id && (
                    <div style={{ marginTop: 8, ...card }}>
                      {h.description ? <div style={{ marginBottom: 8 }}>{h.description}</div> : <div style={{ marginBottom: 8, color: "#666" }}>No description</div>}

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        {/* weekly grid */}
                        {week.map((d) => {
                          const key = DATE_KEY(d);
                          const done = !!h.records[key];
                          const isToday = key === DATE_KEY();
                          return (
                            <div
                              key={key}
                              onClick={() => toggleRecord(h.id, key)}
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                background: done ? "#163b25" : "#f5f5f5",
                                color: done ? "#fff" : "#333",
                                border: isToday ? "2px solid #1e8f4b" : "1px solid #e6e6e6",
                                boxShadow: done ? "0 6px 14px rgba(0,0,0,0.12)" : undefined,
                              }}
                              title={`${d.toLocaleDateString(undefined, { weekday: "short" })} • ${key}`}
                            >
                              {isToday ? "T" : d.toLocaleDateString(undefined, { weekday: "narrow" }).slice(0, 1)}
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#666" }}>Manually toggle day</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            {week.map((d) => (
                              <button
                                key={DATE_KEY(d)}
                                onClick={() => toggleRecord(h.id, DATE_KEY(d))}
                                style={{
                                  padding: "6px 8px",
                                  borderRadius: 8,
                                  border: "1px solid #e6e6e6",
                                  background: h.records[DATE_KEY(d)] ? "#1e8f4b" : "#fff",
                                  color: h.records[DATE_KEY(d)] ? "#fff" : "#333",
                                  cursor: "pointer",
                                }}
                              >
                                {d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                          <div style={{ fontSize: 12, color: "#666" }}>Goal type</div>
                          <div style={{ fontWeight: 700 }}>{h.type === "positive" ? "Do more" : "Avoid"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
