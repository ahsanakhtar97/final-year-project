"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import { createTask, removeTask, updateTaskStatus } from "../../actions/tasks";
import { Task, TaskStatus, CreateTaskPayload } from "@/types/tasks";
import { getTasksByUserId } from "@/app/actions/getUsers";
import { getUserId } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  Plus, Trash2, GripVertical, Eye, EyeOff,
  CheckCircle2, Circle, Clock, Flame, TrendingUp, X,
  ChevronDown, ChevronUp, ListTodo,
} from "lucide-react";

interface Columns {
  todo: Task[];
  inProgress: Task[];
  completed: Task[];
}

const COLUMN_META = {
  todo: {
    label: "To Do",
    accent: "#fbbf24",
    accentBg: "rgba(251,191,36,0.10)",
    icon: Circle,
    emptyMsg: "No tasks yet — add one above.",
  },
  inProgress: {
    label: "In Progress",
    accent: "#5cf2ff",
    accentBg: "rgba(92,242,255,0.10)",
    icon: Clock,
    emptyMsg: "Drag a task here when you start working.",
  },
  completed: {
    label: "Completed",
    accent: "#6effc4",
    accentBg: "rgba(110,255,196,0.10)",
    icon: CheckCircle2,
    emptyMsg: "Completed tasks will appear here.",
  },
} as const;

function getInsight(completionRate: number, total: number): string {
  if (total === 0) return "Add your first task to get started — small steps lead to big wins.";
  if (completionRate === 100) return "You've completed everything! Take a moment to celebrate, then set new goals.";
  if (completionRate >= 70) return "You're on a roll! Over 70% done — keep up the momentum.";
  if (completionRate >= 40) return "Good progress. Focus on one in-progress task at a time to build flow.";
  return "Getting started is the hardest part. Pick the easiest task and knock it out first.";
}

export default function ToDoBoard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [columns, setColumns] = useState<Columns>({ todo: [], inProgress: [], completed: [] });
  const [draggedItem, setDraggedItem] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState<keyof Columns | "">("");
  const [dragOver, setDragOver] = useState<keyof Columns | "">("");
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number>(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [collapsedCols, setCollapsedCols] = useState<Set<keyof Columns>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const uid = getUserId();
        if (uid) {
          setUserId(uid);
          const tasksFromApi = await getTasksByUserId(uid);
          const userTasks = tasksFromApi.filter((t: Task) => t.userId === uid);
          setColumns({
            todo: userTasks.filter((t: Task) => t.taskStatus === TaskStatus.TO_DO),
            inProgress: userTasks.filter((t: Task) => t.taskStatus === TaskStatus.IN_PROGRESS),
            completed: userTasks.filter((t: Task) => t.taskStatus === TaskStatus.COMPLETED),
          });
        }
      } catch { setError("Failed to fetch tasks."); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const total = columns.todo.length + columns.inProgress.length + columns.completed.length;
  const completionRate = total > 0 ? Math.round((columns.completed.length / total) * 100) : 0;

  const streakDays = (() => {
    const days = new Set(
      columns.completed
        .map((t) => t.completedAt as string | null | undefined)
        .filter(Boolean)
        .map((d) => new Date(d!).toISOString().slice(0, 10))
    );
    if (!days.size) return 0;
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (days.has(key)) streak++;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  })();

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const handleDragStart = (task: Task, col: keyof Columns) => {
    setDraggedItem(task);
    setSourceColumn(col);
  };

  const handleDrop = async (target: keyof Columns) => {
    if (!draggedItem || !sourceColumn || sourceColumn === target) {
      setDraggedItem(null); setDragOver(""); return;
    }
    const statusMap: Record<keyof Columns, TaskStatus> = {
      todo: TaskStatus.TO_DO,
      inProgress: TaskStatus.IN_PROGRESS,
      completed: TaskStatus.COMPLETED,
    };
    if (target === "completed") {
      confetti({ particleCount: 120, spread: 65, origin: { y: 0.6 }, colors: ["#6effc4", "#1fbf75", "#fff"] });
    }
    const taskToMove = { ...draggedItem, taskStatus: statusMap[target] };
    const oldColumns = { ...columns };
    setColumns(prev => {
      const next = { ...prev };
      next[sourceColumn as keyof Columns] = next[sourceColumn as keyof Columns].filter(t => t.taskId !== draggedItem.taskId);
      next[target] = [...next[target], taskToMove];
      return next;
    });
    setDraggedItem(null); setDragOver("");
    try { await updateTaskStatus(draggedItem.taskId, statusMap[target]); }
    catch { setError("Failed to move task."); setColumns(oldColumns); }
  };

  // ── Add Task ─────────────────────────────────────────────────────────────────
  const addTask = async () => {
    if (!newTitle.trim()) return;
    const tempId = Date.now() * -1;
    const payload: CreateTaskPayload = {
      userId, title: newTitle.trim(),
      description: newDescription.trim(), taskStatus: TaskStatus.TO_DO,
    };
    const optimistic: Task = { ...payload, taskId: tempId, completedAt: null as any };
    setColumns(prev => ({ ...prev, todo: [...prev.todo, optimistic] }));
    setShowModal(false); setNewTitle(""); setNewDescription("");
    try {
      const created = await createTask(payload);
      const realId = created?.taskId ?? (created as any)?.id;
      if (!realId) throw new Error();
      setColumns(prev => ({
        ...prev,
        todo: prev.todo.map(t => t.taskId === tempId ? { ...created, taskId: realId } : t),
      }));
    } catch {
      setError("Failed to create task.");
      setColumns(prev => ({ ...prev, todo: prev.todo.filter(t => t.taskId !== tempId) }));
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteTask = async (taskId: number, col: keyof Columns) => {
    const old = { ...columns };
    setColumns(prev => ({ ...prev, [col]: prev[col].filter(t => t.taskId !== taskId) }));
    if (expandedTask?.taskId === taskId) setExpandedTask(null);
    try { await removeTask(taskId); }
    catch { setError("Failed to delete task."); setColumns(old); }
  };

  const toggleCollapse = (col: keyof Columns) => {
    setCollapsedCols(prev => {
      const next = new Set(prev);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  };

  // ── Shared card/col styles ───────────────────────────────────────────────────
  const cardBase: React.CSSProperties = {
    background: isDark ? "rgba(15,36,31,0.8)" : "#ffffff",
    border: isDark ? "1px solid rgba(110,255,196,0.10)" : "1px solid rgba(22,59,37,0.10)",
    borderRadius: 16,
    padding: "14px 16px",
    marginBottom: 10,
    cursor: "grab",
    position: "relative",
    transition: "box-shadow 0.2s, transform 0.15s",
  };

  return (
    <main className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>To‑Do List</h1>
          <p className="gf-muted text-sm">Drag tasks between columns or click to view details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrivate(v => !v)}
            className="gf-btn gf-btn-ghost"
            title="Privacy mode"
          >
            {isPrivate ? <EyeOff size={15} /> : <Eye size={15} />}
            <span className="hidden sm:inline">{isPrivate ? "Private" : "Visible"}</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="gf-btn gf-btn-primary"
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ListTodo, label: "Total", value: total, color: "#b3c6ff" },
          { icon: TrendingUp, label: "Done", value: `${completionRate}%`, color: "#6effc4" },
          { icon: Clock, label: "In Progress", value: columns.inProgress.length, color: "#5cf2ff" },
          { icon: Flame, label: "Streak", value: `${streakDays}d`, color: "#fbbf24" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="gf-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">{value}</div>
              <div className="text-xs gf-muted mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <div className="gf-card p-4 space-y-2">
          <div className="flex justify-between text-xs gf-muted">
            <span>Overall progress</span>
            <span className="font-semibold" style={{ color: "#6effc4" }}>{completionRate}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionRate}%`,
                background: "linear-gradient(90deg,#1fbf75,#6effc4)",
              }}
            />
          </div>
        </div>
      )}

      {/* ── AI Insight ── */}
      <div
        className="gf-card p-4 flex items-start gap-3"
        style={{ borderLeft: "3px solid #6effc4", background: isDark ? "rgba(110,255,196,0.06)" : "rgba(110,255,196,0.08)" }}
      >
        <span className="text-xl shrink-0">💡</span>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest gf-muted mb-1">GrowFlow Insight</div>
          <p className="text-sm leading-relaxed font-medium">{getInsight(completionRate, total)}</p>
        </div>
      </div>

      {error && (
        <div className="gf-card p-3 text-sm flex items-center gap-2"
          style={{ borderLeft: "3px solid #e14c4c", color: "#e14c4c", background: "rgba(225,76,76,0.08)" }}>
          {error}
          <button onClick={() => setError("")} className="ml-auto opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* ── Kanban columns ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="gf-skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(Object.keys(columns) as (keyof Columns)[]).map(colKey => {
            const meta = COLUMN_META[colKey];
            const ColIcon = meta.icon;
            const isCollapsed = collapsedCols.has(colKey);
            const isDropTarget = dragOver === colKey;
            const count = columns[colKey].length;

            return (
              <div
                key={colKey}
                onDrop={() => handleDrop(colKey)}
                onDragOver={e => { e.preventDefault(); setDragOver(colKey); }}
                onDragLeave={() => setDragOver("")}
                className="rounded-2xl flex flex-col transition-all duration-200"
                style={{
                  background: isDark
                    ? isDropTarget ? `${meta.accentBg}` : "rgba(11,29,24,0.6)"
                    : isDropTarget ? meta.accentBg : "rgba(240,250,242,0.8)",
                  border: `1.5px solid ${isDropTarget ? meta.accent : isDark ? "rgba(110,255,196,0.10)" : "rgba(22,59,37,0.10)"}`,
                  minHeight: isCollapsed ? "auto" : 420,
                  boxShadow: isDropTarget ? `0 0 20px ${meta.accent}22` : "none",
                }}
              >
                {/* Column header */}
                <div
                  className="flex items-center justify-between px-4 py-3 rounded-t-2xl"
                  style={{ borderBottom: `1px solid ${meta.accent}22` }}
                >
                  <div className="flex items-center gap-2">
                    <ColIcon size={16} style={{ color: meta.accent }} />
                    <span className="font-bold text-sm">{meta.label}</span>
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: `${meta.accent}20`, color: meta.accent }}
                    >
                      {count}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleCollapse(colKey)}
                    className="gf-btn gf-btn-ghost !p-1"
                    title={isCollapsed ? "Expand" : "Collapse"}
                  >
                    {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>

                {/* Tasks */}
                {!isCollapsed && (
                  <div className="flex-1 p-3">
                    {count === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 gap-2">
                        <ColIcon size={24} style={{ color: meta.accent, opacity: 0.25 }} />
                        <p className="text-xs gf-muted text-center">{meta.emptyMsg}</p>
                      </div>
                    ) : (
                      columns[colKey].map(task => (
                        <div
                          key={task.taskId}
                          draggable
                          onDragStart={() => handleDragStart(task, colKey)}
                          onClick={() => setExpandedTask(task)}
                          className="group"
                          style={{
                            ...cardBase,
                            opacity: task.taskId < 0 ? 0.5 : 1,
                            boxShadow: isDark
                              ? "0 2px 8px rgba(0,0,0,0.3)"
                              : "0 2px 8px rgba(0,0,0,0.07)",
                          }}
                        >
                          {/* Colour accent stripe */}
                          <div
                            className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                            style={{ background: meta.accent }}
                          />
                          <div className="pl-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <GripVertical size={13} className="shrink-0 opacity-30" />
                                <span
                                  className="font-semibold text-sm leading-snug truncate"
                                  style={{ filter: isPrivate ? "blur(6px)" : "none" }}
                                >
                                  {task.title}
                                </span>
                              </div>
                              <button
                                onClick={e => { e.stopPropagation(); deleteTask(task.taskId, colKey); }}
                                className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/15 transition-all"
                                style={{ color: "#e14c4c" }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {task.description && (
                              <p
                                className="text-xs gf-muted mt-1.5 line-clamp-2 leading-relaxed"
                                style={{ filter: isPrivate ? "blur(5px)" : "none" }}
                              >
                                {task.description}
                              </p>
                            )}
                            {colKey === "completed" && task.completedAt && (
                              <div className="text-[10px] gf-muted mt-2 flex items-center gap-1">
                                <CheckCircle2 size={10} style={{ color: "#6effc4" }} />
                                {new Date(task.completedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Task Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{
              background: isDark ? "#0f241f" : "#ffffff",
              border: isDark ? "1px solid rgba(110,255,196,0.18)" : "1px solid rgba(22,59,37,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>New Task</h2>
              <button onClick={() => setShowModal(false)} className="gf-btn gf-btn-ghost !p-1.5">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider gf-muted">Title *</label>
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addTask(); } }}
                placeholder="What needs to be done?"
                className="gf-input"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider gf-muted">Description (optional)</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Add some context…"
                rows={3}
                className="gf-textarea"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="gf-btn gf-btn-ghost flex-1">
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTitle.trim()}
                className="gf-btn gf-btn-primary flex-1"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Task Detail Modal ── */}
      {expandedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setExpandedTask(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{
              background: isDark ? "#0f241f" : "#ffffff",
              border: isDark ? "1px solid rgba(110,255,196,0.18)" : "1px solid rgba(22,59,37,0.12)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                {/* status chip */}
                {(() => {
                  const colKey = expandedTask.taskStatus === TaskStatus.TO_DO ? "todo"
                    : expandedTask.taskStatus === TaskStatus.IN_PROGRESS ? "inProgress" : "completed";
                  const meta = COLUMN_META[colKey as keyof Columns];
                  return (
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full mb-2"
                      style={{ background: meta.accentBg, color: meta.accent }}
                    >
                      {meta.label}
                    </span>
                  );
                })()}
                <h2 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>{expandedTask.title}</h2>
              </div>
              <button onClick={() => setExpandedTask(null)} className="gf-btn gf-btn-ghost !p-1.5 shrink-0">
                <X size={16} />
              </button>
            </div>

            <p className="text-sm leading-relaxed gf-muted">
              {expandedTask.description || "No description provided."}
            </p>

            {expandedTask.completedAt && (
              <div className="flex items-center gap-1.5 text-xs gf-muted">
                <CheckCircle2 size={12} style={{ color: "#6effc4" }} />
                Completed on {new Date(expandedTask.completedAt).toLocaleDateString(undefined, {
                  weekday: "long", year: "numeric", month: "long", day: "numeric"
                })}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  const colKey = expandedTask.taskStatus === TaskStatus.TO_DO ? "todo"
                    : expandedTask.taskStatus === TaskStatus.IN_PROGRESS ? "inProgress" : "completed";
                  deleteTask(expandedTask.taskId, colKey as keyof Columns);
                }}
                className="gf-btn gf-btn-ghost flex-1"
                style={{ color: "#e14c4c" }}
              >
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => setExpandedTask(null)} className="gf-btn gf-btn-primary flex-1">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
