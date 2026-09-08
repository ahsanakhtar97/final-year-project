"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import {
  createTask, removeTask, updateTaskStatus, updateTask,
} from "../../actions/tasks";
import { Task, TaskStatus, TaskPriority, CreateTaskPayload, UpdateTaskPayload } from "@/types/tasks";
import { getTasksByUserId } from "@/app/actions/getUsers";
import { getUserId } from "@/lib/utils";
import confetti from "canvas-confetti";
import {
  Plus, Trash2, Pencil, X, Search, SlidersHorizontal,
  CheckCircle2, Circle, Clock, Flame, TrendingUp, ListTodo,
  AlertTriangle, CalendarDays, GripVertical, ChevronDown,
  ChevronUp, ArrowUpDown, Eye, EyeOff, Timer, Sparkles, Loader2,
} from "lucide-react";
import { parseTaskDescription } from "@/app/actions/ai";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Columns { todo: Task[]; inProgress: Task[]; completed: Task[] }
type ColKey = keyof Columns;
type SortKey = "default" | "priority" | "dueDate" | "title";

// ─── Constants ────────────────────────────────────────────────────────────────
const COL_META: Record<ColKey, {
  label: string; accent: string; dimAccent: string;
  Icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  emptyMsg: string;
}> = {
  todo: {
    label: "To Do", accent: "#fbbf24", dimAccent: "rgba(251,191,36,0.12)",
    Icon: Circle, emptyMsg: "No tasks yet. Hit + Add Task to get started.",
  },
  inProgress: {
    label: "In Progress", accent: "#5cf2ff", dimAccent: "rgba(92,242,255,0.12)",
    Icon: Clock, emptyMsg: "Drag a task here once you start working on it.",
  },
  completed: {
    label: "Completed", accent: "#6effc4", dimAccent: "rgba(110,255,196,0.12)",
    Icon: CheckCircle2, emptyMsg: "Drag here or use the ✓ button to mark done.",
  },
};

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string; order: number }> = {
  high:   { label: "High",   color: "#e14c4c", bg: "rgba(225,76,76,0.12)",   order: 0 },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  order: 1 },
  low:    { label: "Low",    color: "#6effc4", bg: "rgba(110,255,196,0.12)", order: 2 },
};

function prioritySort(a: Task, b: Task) {
  return PRIORITY_META[a.priority ?? "medium"].order - PRIORITY_META[b.priority ?? "medium"].order;
}
function dueDateSort(a: Task, b: Task) {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

function isOverdue(task: Task) {
  if (!task.dueDate || task.taskStatus === TaskStatus.COMPLETED) return false;
  return new Date(task.dueDate) < new Date();
}

function dueDateLabel(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Due today";
  if (diff === 1) return "Due tomorrow";
  return `Due ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

// ─── Reusable modal wrapper ───────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}

// ─── Task form (shared by Add + Edit) ────────────────────────────────────────
function TaskForm({
  isDark, initial, onSubmit, onClose, submitLabel,
}: {
  isDark: boolean;
  initial?: Partial<Task>;
  onSubmit: (v: { title: string; description: string; priority: TaskPriority; dueDate: string }) => void;
  onClose: () => void;
  submitLabel: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? TaskPriority.MEDIUM);
  const [dueDate, setDueDate] = useState(
    initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : ""
  );

  const cardBg = isDark ? "#0f241f" : "#ffffff";
  const border = isDark ? "rgba(110,255,196,0.18)" : "rgba(22,59,37,0.12)";
  const inputStyle: React.CSSProperties = {
    background: isDark ? "rgba(110,255,196,0.05)" : "rgba(22,59,37,0.04)",
    border: `1.5px solid ${isDark ? "rgba(110,255,196,0.15)" : "rgba(22,59,37,0.12)"}`,
    borderRadius: 10, padding: "10px 14px", width: "100%",
    color: isDark ? "#e7f7ee" : "#123716", outline: "none", fontSize: 14,
  };

  return (
    <div
      className="w-full max-w-md rounded-2xl p-6 space-y-5"
      style={{ background: cardBg, border: `1px solid ${border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>
          {submitLabel === "Save changes" ? "Edit Task" : "New Task"}
        </h2>
        <button onClick={onClose} className="gf-btn gf-btn-ghost !p-1.5"><X size={16} /></button>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider gf-muted">Title *</label>
        <input
          autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          style={inputStyle}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (title.trim()) onSubmit({ title, description: desc, priority, dueDate }); } }}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider gf-muted">Description</label>
        <textarea
          value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Add more context (optional)…" rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {/* Priority + Due date row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider gf-muted">Priority</label>
          <div className="flex gap-1.5">
            {(["high", "medium", "low"] as TaskPriority[]).map(p => {
              const meta = PRIORITY_META[p];
              const active = priority === p;
              return (
                <button
                  key={p} type="button" onClick={() => setPriority(p)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
                  style={{
                    background: active ? meta.bg : "transparent",
                    border: `1.5px solid ${active ? meta.color : isDark ? "rgba(110,255,196,0.12)" : "rgba(22,59,37,0.1)"}`,
                    color: active ? meta.color : isDark ? "rgba(231,247,238,0.45)" : "rgba(18,55,22,0.5)",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider gf-muted">Due date</label>
          <input
            type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            style={inputStyle}
            min={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button onClick={onClose} className="gf-btn gf-btn-ghost flex-1">Cancel</button>
        <button
          onClick={() => { if (title.trim()) onSubmit({ title, description: desc, priority, dueDate }); }}
          disabled={!title.trim()}
          className="gf-btn gf-btn-primary flex-1"
        >
          {submitLabel === "Save changes" ? <Pencil size={14} /> : <Plus size={14} />}
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ToDoBoard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [columns, setColumns] = useState<Columns>({ todo: [], inProgress: [], completed: [] });
  const [draggedItem, setDraggedItem] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState<ColKey | "">("");
  const [dragOver, setDragOver] = useState<ColKey | "">("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [smartInput, setSmartInput] = useState("");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartPrefill, setSmartPrefill] = useState<{ title: string; description: string; priority: TaskPriority; dueDate: string } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number>(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<TaskPriority | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [collapsedCols, setCollapsedCols] = useState<Set<ColKey>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const uid = getUserId();
        if (!uid) return;
        setUserId(uid);
        const all = await getTasksByUserId(uid);
        const mine = all.filter((t: Task) => t.userId === uid);
        setColumns({
          todo: mine.filter((t: Task) => t.taskStatus === TaskStatus.TO_DO),
          inProgress: mine.filter((t: Task) => t.taskStatus === TaskStatus.IN_PROGRESS),
          completed: mine.filter((t: Task) => t.taskStatus === TaskStatus.COMPLETED),
        });
      } catch { setError("Failed to load tasks."); }
      finally { setLoading(false); }
    })();
  }, []);

  // ── Keyboard shortcut: N → add modal ───────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShowAddModal(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const allTasks = useMemo(() => [...columns.todo, ...columns.inProgress, ...columns.completed], [columns]);
  const total = allTasks.length;
  const completionRate = total > 0 ? Math.round((columns.completed.length / total) * 100) : 0;
  const overdueCount = allTasks.filter(isOverdue).length;
  const streakDays = useMemo(() => {
    const days = new Set(
      columns.completed
        .map(t => t.completedAt)
        .filter(Boolean)
        .map(d => new Date(d as string).toISOString().slice(0, 10))
    );
    if (!days.size) return 0;
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      if (days.has(cursor.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }, [columns.completed]);

  // ── Filter + sort per column ───────────────────────────────────────────────
  const filtered = useCallback((tasks: Task[]) => {
    let list = tasks;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
    }
    if (filterPriority !== "all") list = list.filter(t => (t.priority ?? "medium") === filterPriority);
    if (sortKey === "priority") list = [...list].sort(prioritySort);
    else if (sortKey === "dueDate") list = [...list].sort(dueDateSort);
    else if (sortKey === "title") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [search, filterPriority, sortKey]);

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDrop = async (target: ColKey) => {
    if (!draggedItem || !sourceColumn || sourceColumn === target) {
      setDraggedItem(null); setDragOver(""); return;
    }
    const statusMap: Record<ColKey, TaskStatus> = {
      todo: TaskStatus.TO_DO, inProgress: TaskStatus.IN_PROGRESS, completed: TaskStatus.COMPLETED,
    };
    if (target === "completed") {
      confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 }, colors: ["#6effc4", "#1fbf75", "#fff"] });
    }
    const moved = { ...draggedItem, taskStatus: statusMap[target] };
    const snap = { ...columns };
    setColumns(prev => {
      const next = { ...prev };
      next[sourceColumn as ColKey] = next[sourceColumn as ColKey].filter(t => t.taskId !== draggedItem.taskId);
      next[target] = [...next[target], moved];
      return next;
    });
    setDraggedItem(null); setDragOver("");
    try { await updateTaskStatus(draggedItem.taskId, statusMap[target]); }
    catch { setError("Failed to move task."); setColumns(snap); }
  };

  // ── Smart AI Add ───────────────────────────────────────────────────────────
  const handleSmartAdd = async () => {
    if (!smartInput.trim()) return;
    setSmartLoading(true);
    try {
      const parsed = await parseTaskDescription(smartInput.trim());
      setSmartPrefill({
        title: parsed.title,
        description: parsed.description,
        priority: (parsed.priority as TaskPriority) || TaskPriority.MEDIUM,
        dueDate: parsed.dueDate ?? "",
      });
      setSmartInput("");
      setShowAddModal(true);
    } catch {
      // fallback: just open modal with the text as title
      setSmartPrefill({ title: smartInput.trim(), description: "", priority: TaskPriority.MEDIUM, dueDate: "" });
      setSmartInput("");
      setShowAddModal(true);
    } finally {
      setSmartLoading(false);
    }
  };

  // ── Add ────────────────────────────────────────────────────────────────────
  const handleAdd = async (v: { title: string; description: string; priority: TaskPriority; dueDate: string }) => {
    const tempId = Date.now() * -1;
    const payload: CreateTaskPayload = {
      userId, title: v.title, description: v.description,
      taskStatus: TaskStatus.TO_DO, priority: v.priority,
      dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : null,
    };
    const optimistic: Task = { ...payload, taskId: tempId, completedAt: null, focusMinutes: 0, dueDate: payload.dueDate ?? null, priority: payload.priority ?? TaskPriority.MEDIUM };
    setColumns(prev => ({ ...prev, todo: [optimistic, ...prev.todo] }));
    setShowAddModal(false);
    try {
      const created = await createTask(payload);
      const realId = created.taskId ?? (created as { id?: number }).id;
      setColumns(prev => ({ ...prev, todo: prev.todo.map(t => t.taskId === tempId ? { ...created, taskId: realId } : t) }));
    } catch {
      setError("Failed to create task.");
      setColumns(prev => ({ ...prev, todo: prev.todo.filter(t => t.taskId !== tempId) }));
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleEdit = async (v: { title: string; description: string; priority: TaskPriority; dueDate: string }) => {
    if (!editingTask) return;
    const payload: UpdateTaskPayload = {
      title: v.title, description: v.description, priority: v.priority,
      dueDate: v.dueDate ? new Date(v.dueDate).toISOString() : null,
    };
    const snap = { ...columns };
    const patch = (list: Task[]) => list.map(t => t.taskId === editingTask.taskId ? { ...t, ...payload } : t);
    setColumns(prev => ({ todo: patch(prev.todo), inProgress: patch(prev.inProgress), completed: patch(prev.completed) }));
    setEditingTask(null);
    try { await updateTask(editingTask.taskId, payload); }
    catch { setError("Failed to save changes."); setColumns(snap); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (taskId: number, col: ColKey) => {
    const snap = { ...columns };
    setColumns(prev => ({ ...prev, [col]: prev[col].filter(t => t.taskId !== taskId) }));
    if (viewingTask?.taskId === taskId) setViewingTask(null);
    try { await removeTask(taskId); }
    catch { setError("Failed to delete task."); setColumns(snap); }
  };

  // ── Quick complete (✓ button on card) ──────────────────────────────────────
  const quickComplete = async (task: Task, col: ColKey) => {
    if (col === "completed") return;
    confetti({ particleCount: 80, spread: 55, origin: { y: 0.6 }, colors: ["#6effc4", "#1fbf75"] });
    const snap = { ...columns };
    const moved = { ...task, taskStatus: TaskStatus.COMPLETED };
    setColumns(prev => {
      const next = { ...prev };
      next[col] = next[col].filter(t => t.taskId !== task.taskId);
      next.completed = [moved, ...next.completed];
      return next;
    });
    try { await updateTaskStatus(task.taskId, TaskStatus.COMPLETED); }
    catch { setError("Failed to complete task."); setColumns(snap); }
  };

  const toggleCollapse = (col: ColKey) =>
    setCollapsedCols(prev => { const n = new Set(prev); n.has(col) ? n.delete(col) : n.add(col); return n; });

  // ── Shared card style ──────────────────────────────────────────────────────
  const cardBg: React.CSSProperties = {
    background: isDark ? "rgba(11,29,24,0.85)" : "#ffffff",
    borderRadius: 14,
    border: isDark ? "1px solid rgba(110,255,196,0.09)" : "1px solid rgba(22,59,37,0.09)",
    padding: "13px 14px 13px 18px",
    marginBottom: 8,
    cursor: "grab",
    position: "relative",
    transition: "box-shadow 0.18s, transform 0.12s",
  };

  return (
    <main className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="gf-h1" style={{ fontFamily: "'Lora', serif" }}>Task Board</h1>
          <p className="gf-muted text-sm mt-0.5">
            Drag cards between columns · press <kbd className="px-1 py-0.5 rounded text-[11px]"
              style={{ background: isDark ? "rgba(110,255,196,0.1)" : "rgba(22,59,37,0.08)", color: isDark ? "#6effc4" : "#163b25" }}>N</kbd> to add
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsPrivate(v => !v)} className="gf-btn gf-btn-ghost" title="Privacy mode">
            {isPrivate ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button onClick={() => setShowAddModal(true)} className="gf-btn gf-btn-primary">
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* ── AI Smart Add ── */}
      <div className="gf-card p-4 flex gap-2 items-center"
        style={{ borderLeft: "3px solid #6effc4", background: isDark ? "rgba(110,255,196,0.04)" : "rgba(22,59,37,0.03)" }}>
        <Sparkles size={16} style={{ color: "#6effc4", flexShrink: 0 }} />
        <input
          value={smartInput}
          onChange={e => setSmartInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleSmartAdd(); }}
          placeholder='Describe a task in plain English… e.g. "Finish report by Friday, urgent"'
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: isDark ? "#e7f7ee" : "#163b25" }}
        />
        <button
          onClick={handleSmartAdd}
          disabled={smartLoading || !smartInput.trim()}
          className="gf-btn gf-btn-primary !py-1.5 !px-3 text-xs"
          style={{ opacity: (!smartInput.trim() || smartLoading) ? 0.5 : 1 }}
        >
          {smartLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {smartLoading ? "Parsing…" : "AI Add"}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: ListTodo, label: "Total Tasks", value: total, color: "#b3c6ff" },
          { icon: TrendingUp, label: "Completed", value: `${completionRate}%`, color: "#6effc4" },
          { icon: AlertTriangle, label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "#e14c4c" : "#6effc4" },
          { icon: Flame, label: "Streak", value: `${streakDays}d`, color: "#fbbf24" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="gf-card p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div className="font-bold text-xl leading-none">{value}</div>
              <div className="text-xs gf-muted mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ── */}
      {total > 0 && (
        <div className="gf-card p-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="gf-muted">Overall progress</span>
            <span className="font-bold" style={{ color: "#6effc4" }}>
              {columns.completed.length} / {total} tasks
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden"
            style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%`, background: "linear-gradient(90deg,#1fbf75,#6effc4)" }}
            />
          </div>
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="gf-input pl-9 text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`gf-btn ${showFilters ? "gf-btn-primary" : "gf-btn-ghost"}`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
          </button>
          <button onClick={() => setSortKey(k => {
            const keys: SortKey[] = ["default", "priority", "dueDate", "title"];
            return keys[(keys.indexOf(k) + 1) % keys.length];
          })} className="gf-btn gf-btn-ghost" title="Cycle sort">
            <ArrowUpDown size={15} />
            <span className="hidden sm:inline capitalize text-xs">{sortKey}</span>
          </button>
        </div>

        {showFilters && (
          <div className="gf-card p-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs gf-muted font-semibold uppercase tracking-wider mr-1">Priority:</span>
            {(["all", "high", "medium", "low"] as const).map(p => {
              const active = filterPriority === p;
              const color = p === "all" ? "#6effc4" : PRIORITY_META[p as TaskPriority].color;
              return (
                <button
                  key={p} onClick={() => setFilterPriority(p as TaskPriority | "all")}
                  className="px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all"
                  style={{
                    background: active ? `${color}20` : "transparent",
                    border: `1px solid ${active ? color : isDark ? "rgba(110,255,196,0.12)" : "rgba(22,59,37,0.1)"}`,
                    color: active ? color : isDark ? "rgba(231,247,238,0.5)" : "rgba(22,59,37,0.5)",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="gf-card p-3 text-sm flex items-center gap-2"
          style={{ borderLeft: "3px solid #e14c4c", color: "#e14c4c", background: "rgba(225,76,76,0.06)" }}>
          {error}
          <button onClick={() => setError("")} className="ml-auto opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
      )}

      {/* ── Kanban Board ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="gf-skeleton h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(Object.keys(columns) as ColKey[]).map(colKey => {
            const meta = COL_META[colKey];
            const ColIcon = meta.Icon;
            const tasks = filtered(columns[colKey]);
            const isDropTarget = dragOver === colKey;
            const collapsed = collapsedCols.has(colKey);

            return (
              <div
                key={colKey}
                onDrop={() => handleDrop(colKey)}
                onDragOver={e => { e.preventDefault(); setDragOver(colKey); }}
                onDragLeave={() => setDragOver("")}
                className="flex flex-col rounded-2xl transition-all duration-200"
                style={{
                  background: isDark
                    ? isDropTarget ? meta.dimAccent : "rgba(9,22,17,0.7)"
                    : isDropTarget ? meta.dimAccent : "rgba(242,250,243,0.85)",
                  border: `1.5px solid ${isDropTarget ? meta.accent : isDark ? "rgba(110,255,196,0.08)" : "rgba(22,59,37,0.08)"}`,
                  minHeight: collapsed ? "auto" : 440,
                  boxShadow: isDropTarget ? `0 0 24px ${meta.accent}28` : "none",
                }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-4 py-3"
                  style={{ borderBottom: `1px solid ${meta.accent}1a` }}>
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: meta.accent }} />
                  <ColIcon size={14} style={{ color: meta.accent }} />
                  <span className="font-bold text-sm flex-1">{meta.label}</span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: meta.dimAccent, color: meta.accent }}
                  >
                    {columns[colKey].length}
                  </span>
                  <button onClick={() => toggleCollapse(colKey)} className="gf-btn gf-btn-ghost !p-1">
                    {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  </button>
                </div>

                {!collapsed && (
                  <div className="flex-1 p-3">
                    {tasks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <ColIcon size={28} style={{ color: meta.accent, opacity: 0.2 }} />
                        <p className="text-xs gf-muted text-center max-w-[160px] leading-relaxed">
                          {search || filterPriority !== "all" ? "No tasks match your filters." : meta.emptyMsg}
                        </p>
                      </div>
                    ) : (
                      tasks.map(task => {
                        const pm = PRIORITY_META[task.priority ?? "medium"];
                        const overdue = isOverdue(task);
                        const dueLabel = dueDateLabel(task.dueDate);

                        return (
                          <div
                            key={task.taskId}
                            draggable
                            onDragStart={() => { setDraggedItem(task); setSourceColumn(colKey); }}
                            className="group"
                            style={{
                              ...cardBg,
                              opacity: task.taskId < 0 ? 0.5 : 1,
                              boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                            }}
                          >
                            {/* Priority stripe */}
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[13px]"
                              style={{ background: pm.color }}
                            />

                            {/* Top row: drag + title + actions */}
                            <div className="flex items-start gap-1.5">
                              <GripVertical size={13} className="shrink-0 mt-0.5 opacity-20 cursor-grab" />
                              <div className="flex-1 min-w-0">
                                <span
                                  className="font-semibold text-sm leading-snug block"
                                  style={{
                                    filter: isPrivate ? "blur(6px)" : "none",
                                    textDecoration: colKey === "completed" ? "line-through" : "none",
                                    opacity: colKey === "completed" ? 0.6 : 1,
                                  }}
                                >
                                  {task.title}
                                </span>

                                {task.description && (
                                  <p
                                    className="text-xs gf-muted mt-1 leading-relaxed line-clamp-2"
                                    style={{ filter: isPrivate ? "blur(5px)" : "none" }}
                                  >
                                    {task.description}
                                  </p>
                                )}
                              </div>

                              {/* Hover actions */}
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                {colKey !== "completed" && (
                                  <button
                                    onClick={e => { e.stopPropagation(); quickComplete(task, colKey); }}
                                    className="p-1 rounded-lg hover:bg-green-500/15 transition-colors"
                                    style={{ color: "#6effc4" }} title="Mark complete"
                                  >
                                    <CheckCircle2 size={13} />
                                  </button>
                                )}
                                <button
                                  onClick={e => { e.stopPropagation(); setEditingTask(task); }}
                                  className="p-1 rounded-lg hover:bg-blue-500/15 transition-colors"
                                  style={{ color: "#b3c6ff" }} title="Edit"
                                >
                                  <Pencil size={13} />
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); handleDelete(task.taskId, colKey); }}
                                  className="p-1 rounded-lg hover:bg-red-500/15 transition-colors"
                                  style={{ color: "#e14c4c" }} title="Delete"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Meta row: priority, due date, focus */}
                            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold capitalize"
                                style={{ background: pm.bg, color: pm.color }}
                              >
                                {pm.label}
                              </span>

                              {dueLabel && (
                                <span
                                  className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: overdue ? "rgba(225,76,76,0.12)" : "rgba(110,255,196,0.08)",
                                    color: overdue ? "#e14c4c" : "rgba(231,247,238,0.5)",
                                  }}
                                >
                                  {overdue ? <AlertTriangle size={9} /> : <CalendarDays size={9} />}
                                  {dueLabel}
                                </span>
                              )}

                              {(task.focusMinutes ?? 0) > 0 && (
                                <span
                                  className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                  style={{ background: "rgba(251,191,36,0.10)", color: "#fbbf24" }}
                                >
                                  <Timer size={9} /> {task.focusMinutes}m
                                </span>
                              )}

                              {colKey === "completed" && task.completedAt && (
                                <span className="text-[10px] gf-muted ml-auto">
                                  ✓ {new Date(task.completedAt as string).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); setSmartPrefill(null); }}>
          <TaskForm
            isDark={isDark}
            initial={smartPrefill ? { ...smartPrefill, taskId: 0, userId: 0, taskStatus: TaskStatus.TO_DO, completedAt: null, focusMinutes: 0 } as Task : undefined}
            onSubmit={v => { handleAdd(v); setSmartPrefill(null); }}
            onClose={() => { setShowAddModal(false); setSmartPrefill(null); }}
            submitLabel="Create task"
          />
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editingTask && (
        <Modal onClose={() => setEditingTask(null)}>
          <TaskForm
            isDark={isDark}
            initial={editingTask}
            onSubmit={handleEdit}
            onClose={() => setEditingTask(null)}
            submitLabel="Save changes"
          />
        </Modal>
      )}

      {/* ── View Modal ── */}
      {viewingTask && (
        <Modal onClose={() => setViewingTask(null)}>
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{
              background: isDark ? "#0f241f" : "#ffffff",
              border: isDark ? "1px solid rgba(110,255,196,0.18)" : "1px solid rgba(22,59,37,0.12)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-1">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
                    style={{ background: PRIORITY_META[viewingTask.priority ?? "medium"].bg, color: PRIORITY_META[viewingTask.priority ?? "medium"].color }}>
                    {viewingTask.priority ?? "medium"} priority
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold capitalize"
                    style={{ background: COL_META[viewingTask.taskStatus === TaskStatus.TO_DO ? "todo" : viewingTask.taskStatus === TaskStatus.IN_PROGRESS ? "inProgress" : "completed"].dimAccent, color: COL_META[viewingTask.taskStatus === TaskStatus.TO_DO ? "todo" : viewingTask.taskStatus === TaskStatus.IN_PROGRESS ? "inProgress" : "completed"].accent }}>
                    {viewingTask.taskStatus.replace("_", " ")}
                  </span>
                </div>
                <h2 className="gf-h2" style={{ fontFamily: "'Lora', serif" }}>{viewingTask.title}</h2>
              </div>
              <button onClick={() => setViewingTask(null)} className="gf-btn gf-btn-ghost !p-1.5 shrink-0"><X size={16} /></button>
            </div>
            <p className="text-sm leading-relaxed gf-muted">
              {viewingTask.description || "No description."}
            </p>
            <div className="flex flex-col gap-1 text-xs gf-muted">
              {viewingTask.dueDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={12} />
                  Due: {new Date(viewingTask.dueDate).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              )}
              {viewingTask.completedAt && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} style={{ color: "#6effc4" }} />
                  Completed: {new Date(viewingTask.completedAt as string).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              )}
              {(viewingTask.focusMinutes ?? 0) > 0 && (
                <span className="flex items-center gap-1.5"><Timer size={12} /> {viewingTask.focusMinutes} focus minutes logged</span>
              )}
            </div>
            <button onClick={() => setViewingTask(null)} className="gf-btn gf-btn-primary w-full">Close</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
