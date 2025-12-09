"use client";

import React, { useEffect, useState } from "react";
// Adjust this import if your ThemeContext/useTheme is exported from a different module
// e.g. import { useTheme } from "@/app/dashboard/layout";
import { useTheme } from "@/app/layout";

type HabitType = "positive" | "bad";

type Habit = {
  id: string;
  name: string;
  description?: string;
  type: HabitType;
  records: Record<string, boolean>;
};

const HABIT_CATEGORIES: Record<
  string,
  { name: string; description: string; type: HabitType }[]
> = {
  Health: [
    {
      name: "Drink 8 Glasses of Water",
      description: "Stay hydrated throughout the day.",
      type: "positive",
    },
    {
      name: "Sleep 8 Hours",
      description: "Maintain a consistent sleep cycle.",
      type: "positive",
    },
  ],

  Fitness: [
    {
      name: "Walk 10,000 Steps",
      description: "Boost your heart health and endurance.",
      type: "positive",
    },
    {
      name: "Do 20 Pushups",
      description: "Strengthen upper body muscles.",
      type: "positive",
    },
  ],

  Productivity: [
    {
      name: "Plan My Day",
      description: "Prioritize tasks and goals.",
      type: "positive",
    },
    {
      name: "Deep Work Session",
      description: "Work with 100% focus for a set time.",
      type: "positive",
    },
  ],

  Mindset: [
    {
      name: "Meditate 10 Minutes",
      description: "Improve mindfulness and relaxation.",
      type: "positive",
    },
    {
      name: "Gratitude Journal",
      description: "Write 3 things you're grateful for.",
      type: "positive",
    },
  ],

  "Bad Habits": [
    {
      name: "No Junk Food",
      description: "Avoid unhealthy eating.",
      type: "bad",
    },
    {
      name: "No Procrastination",
      description: "Stay disciplined with tasks.",
      type: "bad",
    },
  ],
};

const DATE_KEY = (d = new Date()) => d.toISOString().slice(0, 10);

const startOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const weekDates = () => {
  const start = startOfWeek();
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

const STORAGE_KEY = "growflow_habits_v3";

export default function HabitTrackerPage() {
  const { theme } = useTheme(); // "light" | "dark"

  const [habits, setHabits] = useState<Habit[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setHabits(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse habits from storage", e);
      }
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
    } catch (e) {
      console.error("Failed to save habits", e);
    }
  }, [habits]);

  const addPredefinedHabit = (habitTemplate: {
    name: string;
    description: string;
    type: HabitType;
  }) => {
    const habit: Habit = {
      id: Date.now().toString(),
      name: habitTemplate.name,
      description: habitTemplate.description,
      type: habitTemplate.type,
      records: {},
    };

    setHabits((s) => [habit, ...s]);
  };

  const deleteHabit = (id: string) => {
    if (!confirm("Delete this habit?")) return;
    setHabits((s) => s.filter((h) => h.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleToday = (habitId: string) => {
    const key = DATE_KEY();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;

        const newRecords = { ...h.records, [key]: !h.records[key] };
        if (!newRecords[key]) delete newRecords[key];

        return { ...h, records: newRecords };
      })
    );
  };

  const toggleRecord = (habitId: string, dateKey: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id !== habitId
          ? h
          : {
              ...h,
              records: { ...h.records, [dateKey]: !h.records[dateKey] },
            }
      )
    );
  };

  const week = weekDates();

  // theme-driven styles
  const isDark = theme === "dark";

  const styles = {
    pageBg: isDark ? "linear-gradient(180deg,#09110f,#11241e)" : "linear-gradient(180deg,#dff8e3,#bfe7c5)",
    pageColor: isDark ? "#e6f3ea" : "#123716",
    card: {
      background: isDark ? "#0f1b17" : "#ffffff",
      padding: 18,
      borderRadius: 14,
      boxShadow: isDark ? "0 8px 30px rgba(0,0,0,0.6)" : "0 8px 24px rgba(0,0,0,0.12)",
      color: isDark ? "#e6f3ea" : "#222",
    } as React.CSSProperties,
    muted: {
      color: isDark ? "#b9cbbd" : "#666",
    } as React.CSSProperties,
    buttonPrimary: {
      background: isDark ? "#1e3a31" : "#163b25",
      color: "white",
      border: "none",
      padding: "10px 16px",
      borderRadius: 10,
      cursor: "pointer",
    } as React.CSSProperties,
    buttonAlt: {
      background: isDark ? "#33483f" : "#f5f5f5",
      color: isDark ? "#e6f3ea" : "#123716",
      border: "1px solid",
      borderColor: isDark ? "#445c4f" : "#ccc",
      padding: "8px 12px",
      borderRadius: 10,
      cursor: "pointer",
    } as React.CSSProperties,
    modalBackdrop: {
      position: "fixed" as const,
      inset: 0,
      background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      zIndex: 1000,
    },
    modalCard: {
      background: isDark ? "#0b1612" : "#ffffff",
      color: isDark ? "#e6f3ea" : "#000",
      padding: 24,
      borderRadius: 12,
      maxWidth: 560,
      width: "100%",
      boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.7)" : "0 8px 24px rgba(0,0,0,0.12)",
    } as React.CSSProperties,
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: 32,
        background: styles.pageBg,
        color: styles.pageColor,
        fontFamily: "'Lora', serif",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: styles.pageColor }}>Habit Tracker</h1>

        <button onClick={() => setShowModal(true)} style={styles.buttonPrimary}>
          + Add Habit
        </button>
      </div>

      {/* NO HABITS */}
      {habits.length === 0 && (
        <div style={{ ...styles.card, maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          No habits yet — click <b style={{ color: styles.pageColor }}>+ Add Habit</b> to begin.
        </div>
      )}

      {/* HABIT LIST */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: habits.length ? 8 : 18 }}>
        {habits.map((h) => {
          const doneToday = !!h.records[DATE_KEY()];

          return (
            <div key={h.id} style={{ width: 340 }}>
              <div style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: styles.pageColor }}>{h.name}</div>
                    <div style={{ fontSize: 12, marginTop: 6, ...styles.muted }}>
                      {h.type === "positive" ? "Positive habit" : "Bad habit"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      onClick={() => toggleToday(h.id)}
                      style={{
                        background: doneToday ? (isDark ? "#1ca65a" : "#1e8f4b") : styles.buttonPrimary.background,
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        minWidth: 86,
                      }}
                    >
                      {doneToday ? "Done ✓" : "Mark"}
                    </button>

                    <button
                      onClick={() => deleteHabit(h.id)}
                      style={{
                        background: "#c74747",
                        color: "white",
                        padding: "6px 12px",
                        borderRadius: 10,
                        border: "none",
                        cursor: "pointer",
                        minWidth: 86,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: 8,
                    borderRadius: 10,
                    border: isDark ? "1px solid #2f4a3f" : "1px solid #ccc",
                    background: isDark ? "#0c1411" : "#f5f5f5",
                    cursor: "pointer",
                    color: isDark ? "#e6f3ea" : "#123716",
                  }}
                >
                  {expandedId === h.id ? "Collapse" : "Expand"}
                </button>
              </div>

              {/* EXPANDED SECTION */}
              {expandedId === h.id && (
                <div style={{ marginTop: 8, ...styles.card }}>
                  <div style={{ marginBottom: 10, color: isDark ? "#dbeede" : "#333" }}>
                    {h.description || "No description"}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {week.map((d) => {
                      const key = DATE_KEY(d);
                      const done = !!h.records[key];
                      const today = DATE_KEY();

                      const squareBg = done
                        ? isDark
                          ? "#1e3a31"
                          : "#163b25"
                        : isDark
                        ? "#183126"
                        : "#eee";

                      const squareColor = done ? "#fff" : isDark ? "#d6efe1" : "#333";

                      const squareBorder = key === today
                        ? `2px solid ${isDark ? "#34d08d" : "#1e8f4b"}`
                        : `1px solid ${isDark ? "#2f4a3f" : "#ccc"}`;

                      return (
                        <div
                          key={key}
                          onClick={() => toggleRecord(h.id, key)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            background: squareBg,
                            color: squareColor,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            border: squareBorder,
                            boxShadow: done ? (isDark ? "0 6px 12px rgba(0,0,0,0.5)" : "0 6px 12px rgba(0,0,0,0.08)") : undefined,
                            userSelect: "none",
                          }}
                          title={`${d.toLocaleDateString(undefined, { weekday: "short" })} • ${key}`}
                        >
                          {d.toLocaleDateString(undefined, { weekday: "narrow" }).slice(0, 1)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---------------- MODAL ---------------- */}
      {showModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            {/* CATEGORY VIEW */}
            {!selectedCategory && (
              <>
                <h2 style={{ marginBottom: 12, color: styles.pageColor }}>Choose a Category</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {Object.keys(HABIT_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: "12px",
                        borderRadius: 10,
                        border: isDark ? "1px solid #2f4a3f" : "1px solid #ccc",
                        background: isDark ? "#0c1411" : "#f7f7f7",
                        cursor: "pointer",
                        width: "100%",
                        color: isDark ? "#e6f3ea" : "#123716",
                        textAlign: "left",
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    marginTop: 20,
                    padding: "10px",
                    borderRadius: 10,
                    background: isDark ? "#33483f" : "#999",
                    color: "white",
                    border: "none",
                    width: "100%",
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
              </>
            )}

            {/* HABIT SELECTION */}
            {selectedCategory && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ color: styles.pageColor }}>{selectedCategory}</h2>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    style={{
                      ...styles.buttonAlt,
                      padding: "8px 10px",
                    }}
                  >
                    Back
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                  {HABIT_CATEGORIES[selectedCategory].map((h) => (
                    <button
                      key={h.name}
                      onClick={() => {
                        addPredefinedHabit(h);
                        setShowModal(false);
                        setSelectedCategory(null);
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: isDark ? "1px solid #2f4a3f" : "1px solid #ccc",
                        background: isDark ? "#07110d" : "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        color: isDark ? "#e6f3ea" : "#123716",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{h.name}</div>
                      <div style={{ fontSize: 13, marginTop: 6, color: isDark ? "#bcd6bf" : "#555" }}>
                        {h.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
