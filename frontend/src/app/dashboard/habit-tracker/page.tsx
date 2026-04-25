"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import { Habit } from "@/types/habits";
import { getUserId } from "@/lib/utils";
import {
  assignHabit,
  getHabitsByUserId,
  revokeHabit,
} from "@/app/actions/user-habits";
import { completeHabit } from "@/app/actions/habit-logs";
import { createHabit, getHabits } from "@/app/actions/habits";
import { createCategory, getCategories } from "@/app/actions/categories";
import { Category } from "@/types/categories";
import { CreateUserHabitPayload } from "@/types/user-habits";
import { toast } from "react-toastify";
import {
  Plus,
  Trash2,
  Check,
  Undo2,
  X,
  Sparkles,
  Wand2,
  FolderPlus,
} from "lucide-react";

type ModalTab = "browse" | "custom";

export default function HabitsPage() {
  const { primaryAccent } = useTheme();

  const [userHabits, setUserHabits] =
    useState<(Habit & { completed?: boolean })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>("browse");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [userId, setUserId] = useState<number>(0);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [pendingHabit, setPendingHabit] =
    useState<(Habit & { completed?: boolean }) | null>(null);
  const [moodScore, setMoodScore] = useState(5);

  // Custom habit creation form
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategoryId, setNewHabitCategoryId] = useState<string>("");
  const [creatingHabit, setCreatingHabit] = useState(false);

  // Inline category creation
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const uid = getUserId();
        if (!uid) return;
        setUserId(uid);

        const [allHabits, uh, allCategories] = await Promise.all([
          getHabits(),
          getHabitsByUserId(uid),
          getCategories(),
        ]);

        setHabits(allHabits);
        setUserHabits(uh);
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
      map[cat.categoryId] = habits.filter(
        (h) => h.categoryId === cat.categoryId,
      );
    });
    return map;
  }, [categories, habits]);

  // Habits the user hasn't already added.
  const availableHabits = useMemo(() => {
    const taken = new Set(userHabits.map((h) => h.habitId));
    return habits.filter((h) => !taken.has(h.habitId));
  }, [habits, userHabits]);

  const filteredHabits = selectedCategory
    ? (habitsByCategory[selectedCategory] || []).filter(
        (h) => !userHabits.some((u) => u.habitId === h.habitId),
      )
    : availableHabits;

  const openModal = () => {
    setShowModal(true);
    setModalTab("browse");
    if (selectedCategory) setNewHabitCategoryId(selectedCategory);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory("");
    setModalTab("browse");
    setNewHabitName("");
    setNewHabitCategoryId("");
    setShowNewCategoryInput(false);
    setNewCategoryName("");
  };

  const addHabit = async (habit: Habit) => {
    try {
      const payload: CreateUserHabitPayload = {
        userId,
        habitId: habit.habitId,
      };
      await assignHabit(payload);
      setUserHabits((prev) => [...prev, { ...habit, completed: false }]);
      toast.success(`Added "${habit.habitName}"`);
    } catch {
      toast.error("Error adding habit");
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.warn("Give the category a name first.");
      return;
    }
    if (
      categories.some(
        (c) => c.categoryName.toLowerCase() === name.toLowerCase(),
      )
    ) {
      toast.info("That category already exists.");
      const existing = categories.find(
        (c) => c.categoryName.toLowerCase() === name.toLowerCase(),
      );
      if (existing) setNewHabitCategoryId(String(existing.categoryId));
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      return;
    }
    setCreatingCategory(true);
    try {
      const created = await createCategory({ categoryName: name });
      setCategories((prev) => [...prev, created]);
      setNewHabitCategoryId(String(created.categoryId));
      setShowNewCategoryInput(false);
      setNewCategoryName("");
      toast.success(`Category "${created.categoryName}" created`);
    } catch {
      toast.error("Couldn't create that category");
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateHabit = async () => {
    const name = newHabitName.trim();
    if (!name) {
      toast.warn("Give your habit a name first.");
      return;
    }
    if (!newHabitCategoryId) {
      toast.warn("Pick a category for this habit.");
      return;
    }
    setCreatingHabit(true);
    try {
      const created = await createHabit({
        habitName: name,
        categoryId: Number(newHabitCategoryId),
      });
      setHabits((prev) => [...prev, created]);
      await assignHabit({ userId, habitId: created.habitId });
      setUserHabits((prev) => [...prev, { ...created, completed: false }]);
      toast.success(`"${created.habitName}" added to your tracker`);
      setNewHabitName("");
      setModalTab("browse");
    } catch {
      toast.error("Couldn't create that habit");
    } finally {
      setCreatingHabit(false);
    }
  };

  const deleteHabit = async (habit: Habit) => {
    try {
      await revokeHabit({ userId, habitId: habit.habitId });
      setUserHabits((prev) => prev.filter((h) => h.habitId !== habit.habitId));
      toast.info("Habit removed");
    } catch {
      toast.error("Error removing habit");
    }
  };

  const toggleComplete = async (habit: Habit & { completed?: boolean }) => {
    if (habit.completed) {
      try {
        await completeHabit({ userId, habitId: habit.habitId });
        setUserHabits((prev) =>
          prev.map((h) =>
            h.habitId === habit.habitId ? { ...h, completed: false } : h,
          ),
        );
        toast.info("Habit marked as incomplete");
      } catch {
        toast.error("Error updating habit");
      }
      return;
    }
    setPendingHabit(habit);
    setShowMoodModal(true);
  };

  const submitCompletionWithMood = async () => {
    if (!pendingHabit) return;
    try {
      await completeHabit({
        userId,
        habitId: pendingHabit.habitId,
        moodScore,
      });
      setUserHabits((prev) =>
        prev.map((h) =>
          h.habitId === pendingHabit.habitId ? { ...h, completed: true } : h,
        ),
      );
      toast.success("Habit completed! Mood logged.");
      setShowMoodModal(false);
      setPendingHabit(null);
    } catch {
      toast.error("Failed to log mood and habit");
    }
  };

  const browseCategories = useMemo(
    () =>
      categories.filter(
        (c) => (habitsByCategory[c.categoryId] || []).length > 0,
      ),
    [categories, habitsByCategory],
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
            Your Habits
          </h1>
          <p className="gf-muted mt-1 text-sm">
            Build routines that stick. Tap complete, log your mood, watch
            yourself grow.
          </p>
        </div>
        <button onClick={openModal} className="gf-btn gf-btn-primary">
          <Plus size={16} /> Add habit
        </button>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="gf-skeleton h-16 w-full" />
          ))}
        </div>
      ) : userHabits.length === 0 ? (
        <div className="gf-card p-10 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(31,191,117,0.15)",
              color: primaryAccent,
            }}
          >
            <Sparkles size={22} />
          </div>
          <h3 className="gf-h2">No habits yet</h3>
          <p className="gf-muted mt-1 text-sm">
            Pick from our starter habits or write your own — start with one.
          </p>
          <button
            onClick={openModal}
            className="gf-btn gf-btn-primary mt-5 mx-auto"
          >
            <Plus size={16} /> Add your first habit
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {userHabits.map((habit) => {
            const catName =
              categories.find((c) => c.categoryId === habit.categoryId)
                ?.categoryName || "";
            return (
              <li
                key={habit.habitId}
                className="gf-card gf-card-hover flex items-center justify-between gap-3 p-4"
                style={{ opacity: habit.completed ? 0.75 : 1 }}
              >
                <div className="min-w-0">
                  <p
                    className="truncate font-semibold"
                    style={{
                      textDecoration: habit.completed
                        ? "line-through"
                        : "none",
                    }}
                  >
                    {habit.habitName}
                  </p>
                  {catName && (
                    <span className="gf-chip mt-1 text-[11px]">{catName}</span>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => toggleComplete(habit)}
                    className={`gf-btn !py-2 !px-3 ${
                      habit.completed ? "gf-btn-ghost" : "gf-btn-primary"
                    }`}
                    aria-label={habit.completed ? "Undo" : "Complete"}
                  >
                    {habit.completed ? (
                      <Undo2 size={16} />
                    ) : (
                      <Check size={16} />
                    )}
                    <span className="hidden sm:inline">
                      {habit.completed ? "Undo" : "Done"}
                    </span>
                  </button>
                  <button
                    onClick={() => deleteHabit(habit)}
                    className="gf-btn gf-btn-danger !py-2 !px-3"
                    aria-label="Delete habit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add-habit modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="gf-card w-full max-w-xl overflow-hidden sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--gf-border)] p-4">
              <h2 className="gf-h2">Add a habit</h2>
              <button
                type="button"
                className="gf-btn gf-btn-ghost !p-2"
                aria-label="Close"
                onClick={closeModal}
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--gf-border)]">
              <button
                onClick={() => setModalTab("browse")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  modalTab === "browse" ? "" : "gf-muted hover:opacity-80"
                }`}
                style={{
                  color: modalTab === "browse" ? primaryAccent : undefined,
                  borderBottom:
                    modalTab === "browse"
                      ? `2px solid ${primaryAccent}`
                      : "2px solid transparent",
                }}
              >
                <Sparkles size={14} className="inline mr-1.5" /> Browse
              </button>
              <button
                onClick={() => setModalTab("custom")}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                  modalTab === "custom" ? "" : "gf-muted hover:opacity-80"
                }`}
                style={{
                  color: modalTab === "custom" ? primaryAccent : undefined,
                  borderBottom:
                    modalTab === "custom"
                      ? `2px solid ${primaryAccent}`
                      : "2px solid transparent",
                }}
              >
                <Wand2 size={14} className="inline mr-1.5" /> Create your own
              </button>
            </div>

            {/* BROWSE TAB */}
            {modalTab === "browse" && (
              <>
                <div className="border-b border-[var(--gf-border)] p-4">
                  <label className="gf-muted text-xs font-semibold uppercase tracking-wider">
                    Filter by category
                  </label>
                  {categories.length === 0 ? (
                    <p className="gf-muted mt-2 text-sm">
                      No categories yet. Switch to{" "}
                      <button
                        onClick={() => setModalTab("custom")}
                        className="underline font-semibold"
                        style={{ color: primaryAccent }}
                      >
                        Create your own
                      </button>{" "}
                      to add one.
                    </p>
                  ) : (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="gf-select mt-1.5"
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto gf-scroll p-4">
                  {filteredHabits.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="gf-muted text-sm mb-3">
                        {habits.length === 0
                          ? "No starter habits available yet."
                          : selectedCategory
                            ? "Nothing left in this category to add."
                            : "You've added every starter habit. Nice!"}
                      </p>
                      <button
                        onClick={() => setModalTab("custom")}
                        className="gf-btn gf-btn-primary mx-auto"
                      >
                        <Wand2 size={14} /> Create your own habit
                      </button>
                    </div>
                  ) : selectedCategory ? (
                    <div className="flex flex-wrap gap-2">
                      {filteredHabits.map((h) => (
                        <button
                          key={h.habitId}
                          onClick={() => addHabit(h)}
                          className="gf-btn gf-btn-ghost !py-1.5 !px-3 text-sm"
                        >
                          <Plus size={14} /> {h.habitName}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {browseCategories.map((cat) => {
                        const items = (
                          habitsByCategory[cat.categoryId] || []
                        ).filter(
                          (h) =>
                            !userHabits.some((u) => u.habitId === h.habitId),
                        );
                        if (items.length === 0) return null;
                        return (
                          <div key={cat.categoryId}>
                            <h4
                              className="text-xs font-semibold uppercase tracking-wider mb-2"
                              style={{ color: primaryAccent }}
                            >
                              {cat.categoryName}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {items.map((h) => (
                                <button
                                  key={h.habitId}
                                  onClick={() => addHabit(h)}
                                  className="gf-btn gf-btn-ghost !py-1.5 !px-3 text-sm"
                                >
                                  <Plus size={14} /> {h.habitName}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* CUSTOM TAB */}
            {modalTab === "custom" && (
              <div className="flex-1 overflow-y-auto gf-scroll p-4 space-y-4">
                <div>
                  <label className="gf-muted text-xs font-semibold uppercase tracking-wider">
                    Habit name
                  </label>
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="e.g. Stretch for 5 minutes"
                    maxLength={120}
                    className="gf-input mt-1.5 w-full"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="gf-muted text-xs font-semibold uppercase tracking-wider">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCategoryInput((v) => !v);
                        setNewCategoryName("");
                      }}
                      className="text-xs font-semibold inline-flex items-center gap-1 hover:opacity-80"
                      style={{ color: primaryAccent }}
                    >
                      <FolderPlus size={12} />
                      {showNewCategoryInput ? "Cancel" : "New category"}
                    </button>
                  </div>

                  {!showNewCategoryInput ? (
                    <select
                      value={newHabitCategoryId}
                      onChange={(e) => setNewHabitCategoryId(e.target.value)}
                      className="gf-select mt-1.5 w-full"
                    >
                      <option value="">
                        {categories.length === 0
                          ? "No categories yet — add one"
                          : "Pick a category…"}
                      </option>
                      {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1.5 flex gap-2">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g. Side projects"
                        maxLength={60}
                        className="gf-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                        className="gf-btn gf-btn-primary"
                      >
                        {creatingCategory ? "…" : "Add"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCreateHabit}
                    disabled={
                      creatingHabit ||
                      !newHabitName.trim() ||
                      !newHabitCategoryId
                    }
                    className="gf-btn gf-btn-primary w-full"
                  >
                    {creatingHabit ? (
                      "Creating…"
                    ) : (
                      <>
                        <Plus size={16} /> Create &amp; track
                      </>
                    )}
                  </button>
                  <p className="gf-muted text-xs text-center mt-2">
                    Your habit will be added to your tracker right away.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mood modal */}
      {showMoodModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="gf-card w-full max-w-sm p-6 text-center">
            <h3 className="gf-h2">How are you feeling?</h3>
            <p className="gf-muted mt-1 text-sm">
              Log your mood to power better insights.
            </p>
            <div className="my-5 text-5xl">
              {moodScore <= 3
                ? "\u{1F614}"
                : moodScore <= 7
                  ? "\u{1F60A}"
                  : "\u{1F680}"}
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={moodScore}
              onChange={(e) => setMoodScore(parseInt(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor: primaryAccent }}
            />
            <div className="mt-2 flex justify-between text-sm gf-muted">
              <span>1</span>
              <span
                className="text-lg font-bold"
                style={{ color: primaryAccent }}
              >
                {moodScore}
              </span>
              <span>10</span>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={submitCompletionWithMood}
                className="gf-btn gf-btn-primary w-full"
              >
                Log mood &amp; complete
              </button>
              <button
                onClick={() => setShowMoodModal(false)}
                className="gf-btn gf-btn-ghost w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
