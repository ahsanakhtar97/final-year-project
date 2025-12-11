"use client";

import React, { useEffect, useState, useMemo } from "react";
// FIX: Changed import path to align with your other pages (assuming dashboard/layout provides the theme)
import { useTheme } from "@/app/dashboard/layout";
import { Habit } from "@/types/habits";
import { getUserId } from "@/lib/utils";
import { assignHabit, getHabitsByUserId, revokeHabit } from "@/app/actions/user-habits";
import { completeHabit } from "@/app/actions/habit-logs";
import { getHabits } from "@/app/actions/habits";
import { getCategories } from "@/app/actions/categories";
import { Category } from "@/types/categories";
import { CreateUserHabitPayload } from "@/types/user-habits";
import { toast } from "react-toastify";

export default function HabitsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [userHabits, setUserHabits] = useState<(Habit & { completed?: boolean })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [userId, setUserId] = useState<number>(0);


  // --- Theme Colors (Matching dashboard/to-do green theme) ---
  const palette = {
    // Light Mode
    lightBg: "linear-gradient(180deg,#dff8e3,#bfe7c5)",
    lightCard: "#ffffff",
    lightText: "#123716",
    lightAccent: "#163b25",

    // Dark Mode (Deep Green)
    darkBg: "linear-gradient(180deg,#06130f,#0f2a21)",
    darkCard: "#0f241f",
    darkText: "#e7f7ee",
    darkAccent: "#8fe8b2",
    darkBorder: "#2f6b45",
  };

  const cardBg = isDark ? palette.darkCard : palette.lightCard;
  const textColor = isDark ? palette.darkText : palette.lightText;
  const primaryAccent = isDark ? palette.darkAccent : palette.lightAccent;
  const borderColor = isDark ? palette.darkBorder : "#e5e5e5";
  const mutedColor = isDark ? "#a8d9bb" : "#666";


  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const uid = getUserId();
        if (!uid) return;

        setUserId(uid);

        const [allHabits, userHabits, allCategories] = await Promise.all([
          getHabits(),
          getHabitsByUserId(uid),
          getCategories(),
        ]);

        setHabits(allHabits);
        setUserHabits(userHabits);
        setCategories(allCategories);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const habitsByCategory = useMemo(() => {
    const map: Record<string, Habit[]> = {};
    categories.forEach((cat) => {
      map[cat.categoryId] = habits.filter((h) => h.categoryId === cat.categoryId);
    });
    return map;
  }, [categories, habits]);

  const addHabit = async (habit: Habit) => {
    try {
      const payload: CreateUserHabitPayload = { userId, habitId: habit.habitId };
      await assignHabit(payload);
      setUserHabits((prev) => [...prev, { ...habit, completed: false }]);
      setShowModal(false);
      setSelectedCategory("");
      toast.success("Habit added!");
    } catch (err) {
      toast.error("Error adding habit");
    }
  };

  const deleteHabit = async (habit: Habit) => {
    try {
      await revokeHabit({ userId, habitId: habit.habitId });
      setUserHabits((prev) => prev.filter((h) => h.habitId !== habit.habitId));
      toast.info("Habit removed");
    } catch (err) {
      toast.error("Error removing habit");
    }
  };

  // In your habit-tracker/page.tsx file

  // ... (existing imports and component logic)

  const toggleComplete = async (habit: Habit & { completed?: boolean }) => {
    try {
      // Send request to toggle completion status on the server
      const serverResponse = await completeHabit({ userId, habitId: habit.habitId });

      // Determine the *new* completion state from the local update before the server call
      // OR, rely on the server to tell us the final status.
      // Since we modified completeHabit to toggle, we flip the local state optimistically:

      const isCurrentlyCompleted = habit.completed;

      setUserHabits((prev) =>
        prev.map((h) =>
          h.habitId === habit.habitId ? { ...h, completed: !isCurrentlyCompleted } : h
        )
      );

      toast.success(isCurrentlyCompleted ? "Habit marked as incomplete" : "Habit completed!");
    } catch (err) {
      toast.error("Error updating habit");
    }
  };

  // ... (rest of the component)

  if (loading) return <p>Loading habits...</p>;

  const filteredHabits = selectedCategory ? habitsByCategory[selectedCategory] || [] : habits;

  // Style for the main header containing the title and the button
  const headerContainerStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px", // Maintains gap below the header
  };

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        // FIX 1: Apply green theme background
        background: isDark ? palette.darkBg : palette.lightBg,
        color: textColor,
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* New Header Container for Title and Button */}
      <div style={headerContainerStyle}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", color: primaryAccent, margin: 0 }}>
          Your Habits
        </h1>

        {/* MOVED: Add Habit Button */}
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "10px 16px",
            // FIX 3: Apply themed accent button color
            backgroundColor: primaryAccent,
            color: isDark ? palette.lightText : "#fff",
            border: "none",
            borderRadius: "8px", // Adjusted slightly for cleaner look
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + Add Habit
        </button>
      </div>


      {/* User Habits */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
          Selected Habits
        </h2>

        {userHabits.length === 0 ? (
          <p style={{ color: mutedColor }}>No habits added yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {userHabits.map((habit) => (
              <li
                key={habit.habitId}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  marginBottom: "10px",
                  // FIX 2: Apply themed card background
                  backgroundColor: cardBg,
                  borderRadius: "8px",
                  boxShadow: isDark ? "0 4px 8px rgba(0,0,0,0.4)" : "0 2px 4px rgba(0,0,0,0.1)",
                  textDecoration: habit.completed ? "line-through" : "none",
                  opacity: habit.completed ? 0.7 : 1,
                  border: `1px solid ${borderColor}`,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>{habit.habitName}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: mutedColor }}>
                    {categories.find((c) => c.categoryId === habit.categoryId)?.categoryName}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => toggleComplete(habit)}
                    style={{
                      padding: "6px 12px",
                      // Use themed accent color for Complete button
                      backgroundColor: habit.completed ? "#f39c12" : primaryAccent,
                      color: isDark && !habit.completed ? palette.lightText : "#fff", // Dark text on dark accent
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    {habit.completed ? "Undo" : "Complete"}
                  </button>

                  <button
                    onClick={() => deleteHabit(habit)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#e74c3c",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* REMOVED OLD BUTTON POSITION */}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => {
            setShowModal(false);
            setSelectedCategory("");
          }}
        >
          <div
            style={{
              // FIX 4: Apply themed modal background
              backgroundColor: cardBg,
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80%",
              overflowY: "auto",
              color: textColor,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "16px" }}>
              Add New Habit
            </h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ marginRight: "8px", fontWeight: "bold" }}>
                Filter by category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  // FIX 5: Themed border and background for select input
                  border: `1px solid ${borderColor}`,
                  background: isDark ? palette.darkCard : palette.lightCard,
                  color: textColor,
                  cursor: "pointer",
                }}
              >
                <option value="">All</option>
                {categories.map((category) => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {filteredHabits.map((habit) => (
                <button
                  key={habit.habitId}
                  onClick={() => addHabit(habit)}
                  style={{
                    padding: "8px 12px",
                    // FIX 6: Themed habit buttons
                    border: `1px solid ${borderColor}`,
                    borderRadius: "8px",
                    backgroundColor: isDark ? palette.darkCard : "#f9f9f9",
                    color: textColor,
                    cursor: "pointer",
                  }}
                >
                  {habit.habitName}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                setSelectedCategory("");
              }}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                backgroundColor: "#999",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}