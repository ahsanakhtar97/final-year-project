"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/app/layout";
import { Habit } from "@/types/habits";
import { getUserId } from "@/lib/utils";
import { assignHabit, getHabitsByUserId, revokeHabit} from "@/app/actions/user-habits";
import { completeHabit } from "@/app/actions/habit-logs";
import { getHabits } from "@/app/actions/habits";
import { getCategories } from "@/app/actions/categories";
import { Category } from "@/types/categories";
import { CreateUserHabitPayload } from "@/types/user-habits";
import { toast } from "react-toastify";

export default function HabitsPage() {
  const { theme } = useTheme();

  const [userHabits, setUserHabits] = useState<(Habit & { completed?: boolean })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [userId, setUserId] = useState<number>(0);

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

  const toggleComplete = async (habit: Habit & { completed?: boolean }) => {
    try {
      await completeHabit({ userId, habitId: habit.habitId });
      setUserHabits((prev) =>
        prev.map((h) =>
          h.habitId === habit.habitId ? { ...h, completed: !h.completed } : h
        )
      );
      toast.success(habit.completed ? "Habit marked as incomplete" : "Habit completed!");
    } catch (err) {
      toast.error("Error updating habit");
    }
  };

  if (loading) return <p>Loading habits...</p>;

  const filteredHabits = selectedCategory ? habitsByCategory[selectedCategory] || [] : habits;

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        backgroundColor: theme === "dark" ? "#1a1a1a" : "#f0f0f0",
        color: theme === "dark" ? "#fff" : "#000",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        Your Habits
      </h1>

      {/* User Habits */}
      <section style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
          Selected Habits
        </h2>

        {userHabits.length === 0 ? (
          <p style={{ color: "#888" }}>No habits added yet.</p>
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
                  backgroundColor: theme === "dark" ? "#333" : "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  textDecoration: habit.completed ? "line-through" : "none",
                  opacity: habit.completed ? 0.6 : 1,
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>{habit.habitName}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                    {categories.find((c) => c.categoryId === habit.categoryId)?.categoryName}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => toggleComplete(habit)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: habit.completed ? "#f39c12" : "#2ecc71",
                      color: "#fff",
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

      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: "10px 16px",
          backgroundColor: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Add Habit
      </button>

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
              backgroundColor: theme === "dark" ? "#222" : "#fff",
              padding: "24px",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "600px",
              maxHeight: "80%",
              overflowY: "auto",
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
                  border: "1px solid #ccc",
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
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    backgroundColor: theme === "dark" ? "#333" : "#f9f9f9",
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
