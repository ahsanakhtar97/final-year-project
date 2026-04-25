"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/dashboard/theme-context";
import {
  createTask,
  removeTask,
  updateTaskStatus,
} from "../../actions/tasks";
import { Task, TaskStatus, CreateTaskPayload } from "@/types/tasks";
import { getTasksByUserId } from "@/app/actions/getUsers";
import { getUserId } from "@/lib/utils";
import confetti from 'canvas-confetti';
interface Columns {
  todo: Task[];
  inProgress: Task[];
  completed: Task[];
}

// --- Theme Palette (Defined for consistency) ---
const PALETTE = {
  // Main Theme Colors
  lightBg: "linear-gradient(180deg, #dff8e3, #bfe7c5)",
  darkBg: "linear-gradient(180deg, #0f1f17, #1b2f24)",

  // Card/Column Colors
  lightColumn: "#f0f8f0",
  darkColumn: "#1f2f27",
  lightCard: "#ffffff",
  darkCard: "#243b30",

  // Text & Accents
  lightText: "#123716",
  darkText: "#e5f5ec",
  lightAccent: "#163b25",
  darkAccent: "#60d394",
  lightBorder: "#e5e5e5",
  darkBorder: "#355a4a",

  // Action Colors
  complete: "#2ecc71",
  remove: "#e74c3c",
  modalBg: "rgba(0,0,0,0.6)",
};

export default function ToDoBoard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isPrivate, setIsPrivate] = useState(false);

  const [columns, setColumns] = useState<Columns>({
    todo: [],
    inProgress: [],
    completed: [],
  });

  const [draggedItem, setDraggedItem] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number>(0);

  // --- Theme Accessors ---
  const columnBg = isDark ? PALETTE.darkColumn : PALETTE.lightColumn;
  const cardBg = isDark ? PALETTE.darkCard : PALETTE.lightCard;
  const borderColor = isDark ? PALETTE.darkBorder : PALETTE.lightBorder;
  const primaryAccent = isDark ? PALETTE.darkAccent : PALETTE.lightAccent;
  const primaryButtonBg = isDark ? PALETTE.darkAccent : PALETTE.lightAccent;


  // Fetch tasks from API on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const uid = getUserId();
        if (uid) {
          setUserId(uid);
          const tasksFromApi = await getTasksByUserId(uid);
          const userTasks = tasksFromApi.filter((t: Task) => t.userId === uid);
          setColumns({
            todo: userTasks.filter((t: Task) => t.taskStatus === TaskStatus.TO_DO),
            inProgress: userTasks.filter(
              (t: Task) => t.taskStatus === TaskStatus.IN_PROGRESS
            ),
            completed: userTasks.filter(
              (t: Task) => t.taskStatus === TaskStatus.COMPLETED
            ),
          });
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tasks");
        setLoading(false);
      }
    };
    fetchTasks();
  }, [userId]);

  const boardStyle: React.CSSProperties = {
    color: isDark ? PALETTE.darkText : PALETTE.lightText,
    transition: "color 0.3s ease",
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  };

  const handleDragStart = (task: Task, column: string) => {
    setDraggedItem(task);
    setSourceColumn(column);
  };

  const handleDrop = async (target: keyof Columns) => {
    if (!draggedItem) return;

    let status: TaskStatus;
    switch (target) {
      case "todo":
        status = TaskStatus.TO_DO;
        break;
      case "inProgress":
        status = TaskStatus.IN_PROGRESS;
        break;
      case "completed":
        status = TaskStatus.COMPLETED;
        break;
      default:
        return;
    }
    if (target === 'completed') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#60d394', '#163b25', '#ffffff']
      });
    }
    const oldColumns = columns;
    const taskToMove = { ...draggedItem, taskStatus: status };

    setColumns(prev => {
      const updated = { ...prev };
      updated[sourceColumn as keyof Columns] = updated[sourceColumn as keyof Columns].filter(
        t => t.taskId !== draggedItem.taskId
      );
      updated[target] = [...updated[target], taskToMove];
      return updated;
    });

    setDraggedItem(null);
    try {
      await updateTaskStatus(draggedItem.taskId, status);
    } catch (err) {
      console.error(err);
      setError("Failed to update task status. Reverting change.");
      setColumns(oldColumns);
    }
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const addTask = async () => {
    if (!newTitle.trim()) return;

    const tempId = Date.now() * -1;
    const payload: CreateTaskPayload = {
      userId,
      title: newTitle,
      description: newDescription,
      taskStatus: TaskStatus.TO_DO,
    };
    const optimisticTask: Task & { completedAt: string | null } = {
      ...payload,
      taskId: tempId,
      completedAt: null,
    };

    setColumns(prev => ({
      ...prev,
      todo: [...prev.todo, optimisticTask],
    }));
    setShowModal(false);
    setNewTitle("");
    setNewDescription("");

    try {
      const createdTask = await createTask(payload);
      const realId = createdTask?.taskId ?? (createdTask as unknown as { id?: number | string } | null)?.id;

      if (!realId) {
        throw new Error("Invalid taskId returned from backend");
      }

      setColumns(prev => ({
        ...prev,
        todo: prev.todo.map(t =>
          t.taskId === tempId ? { ...createdTask, taskId: realId as number } : t
        )
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to create task. Reverting change.");
      setColumns(prev => ({
        ...prev,
        todo: prev.todo.filter(t => t.taskId !== tempId)
      }));
    }
  };

  const deleteTask = async (taskId: number, columnKey: keyof Columns) => {
    const oldColumns = columns;
    const taskToDelete = columns[columnKey].find(t => t.taskId === taskId);

    setColumns(prev => ({
      ...prev,
      [columnKey]: prev[columnKey].filter(t => t.taskId !== taskId),
    }));

    try {
      await removeTask(taskId);
    } catch (err) {
      console.error(err);
      setError("Failed to delete task. Reverting change.");
      if (taskToDelete) {
        setColumns(prev => ({
          ...prev,
          [columnKey]: [...prev[columnKey], taskToDelete]
        }));
      } else {
        setColumns(oldColumns);
      }
    }
  };

  const ColumnHeader = ({ title }: { title: string }) => (
    <h2
      style={{
        textAlign: "center",
        textTransform: "capitalize",
        fontSize: "1.5rem",
        marginBottom: "15px",
        color: primaryAccent,
      }}
    >
      {title}
    </h2>
  );

  const TaskCard = ({ task, columnKey }: { task: Task, columnKey: keyof Columns }) => (
    <div
      key={task.taskId}
      draggable
      onDragStart={() => handleDragStart(task, columnKey)}
      onClick={() => setExpandedTask(task)}
      style={{
        background: cardBg,
        padding: "14px",
        marginBottom: "12px",
        borderRadius: "14px",
        cursor: "grab",
        boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
        border: `1px solid ${borderColor}`,
        position: "relative",
        opacity: task.taskId < 0 ? 0.7 : 1,
      }}
    >
      <div style={{
        fontWeight: 600,
        fontSize: "1.1rem",
        filter: isPrivate ? "blur(8px)" : "none",
        transition: "filter 0.3s ease",
      }}>{task.title}</div>
      <button
        onClick={e => {
          e.stopPropagation();
          deleteTask(task.taskId, columnKey);
        }}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          background: "transparent",
          border: "none",
          color: PALETTE.remove,
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: 'bold',
          opacity: 0.8,
        }}
      >
        ✕
      </button>
    </div>
  );

  // --- Quick Stats Logic ---
  const totalTasks = columns.todo.length + columns.inProgress.length + columns.completed.length;
  const completionRate = totalTasks > 0
    ? Math.round((columns.completed.length / totalTasks) * 100)
    : 0;

  const totalXP = (columns.completed.length * 10);
  const currentLevel = Math.floor(totalXP / 50) + 1;
  const levelName = currentLevel > 3 ? "Sapling" : "Seedling";

  const computeStreak = (): number => {
    const days = new Set(
      columns.completed
        .map((t) => t.completedAt as Date | string | null | undefined)
        .filter((d): d is Date | string => Boolean(d))
        .map((d) => new Date(d as Date | string).toISOString().slice(0, 10)),
    );
    if (days.size === 0) return 0;
    let streak = 0;
    const cursor = new Date();
    for (let i = 0; i < 365; i++) {
      const key = cursor.toISOString().slice(0, 10);
      if (days.has(key)) streak += 1;
      else if (i > 0) break;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  };
  const streakDays = computeStreak();

  const getWeeklyInsight = () => {
    const allCompletedTasks = columns.completed;
    const currentMood = allCompletedTasks.length > 0 ? 8 : 5;

    if (totalTasks === 0) return "اپنے دن کا آغاز کرنے کے لیے پہلا کام شامل کریں!";
    if (completionRate > 70 && currentMood > 7) {
      return "آپ کی کارکردگی بہترین ہے! اپنی ذہنی صحت اور کام میں توازن برقرار رکھیں۔ 🚀";
    } else if (completionRate > 70 && currentMood < 4) {
      return "انتباہ: آپ بہت زیادہ کام کر رہے ہیں۔ تھوڑا آرام کریں تاکہ برن آؤٹ سے بچ سکیں۔ ⚠️";
    } else if (completionRate < 30 && currentMood < 4) {
      return "آج خود پر نرمی برتیں۔ چھوٹے اور آسان کاموں سے آغاز کریں تاکہ آپ بہتر محسوس کر سکیں۔ ✨";
    } else {
      return "آج کا دن خود کی بہتری کے لیے اچھا ہے۔ آپ کے اہداف آپ کے منتظر ہیں!";
    }
  };

  return (
    <main style={boardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}
      >
        <h1 style={{ fontSize: "2.5rem", color: primaryAccent, margin: 0 }}>To-Do List</h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsPrivate(!isPrivate)}
            style={{
              background: isPrivate ? PALETTE.remove : 'transparent',
              border: `1px solid ${primaryAccent}`,
              color: isPrivate ? '#fff' : primaryAccent,
              padding: "10px 18px",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: 700,
              transition: "all 0.3s ease",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isPrivate ? "🔒 Public View" : "👁️ Privacy Mode"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: primaryButtonBg,
              color: isDark ? PALETTE.lightText : PALETTE.darkText,
              padding: "10px 20px",
              borderRadius: "12px",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              transition: 'background 0.3s ease',
            }}
          >
            + Add Task
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          background: isDark ? 'rgba(96, 211, 148, 0.1)' : '#fff',
          border: `1px solid ${primaryAccent}`,
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🌳</span>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            Level {currentLevel}: {levelName}
          </span>
        </div>

        <div style={{
          background: isDark ? 'rgba(96, 211, 148, 0.1)' : '#fff',
          border: `1px solid ${primaryAccent}`,
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>📈</span>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {completionRate}% Done
          </span>
        </div>

        <div style={{
          background: isDark ? 'rgba(96, 211, 148, 0.1)' : '#fff',
          border: `1px solid ${primaryAccent}`,
          padding: '8px 16px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '18px' }}>🔥</span>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            {streakDays} Day Streak
          </span>
        </div>
      </div>

      <div style={{
        background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f0fdf4',
        padding: '18px',
        borderRadius: '16px',
        borderLeft: `6px solid ${primaryAccent}`,
        marginBottom: '30px',
        boxShadow: isDark ? 'none' : '0 4px 6px rgba(0,0,0,0.05)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          opacity: 0.7,
          fontSize: '12px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          <span>🧠</span> GrowFlow AI Insight
        </div>
        <p style={{
          margin: 0,
          fontWeight: '600',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          color: isDark ? '#e5f5ec' : '#123716'
        }}>
          {getWeeklyInsight()}
        </p>
      </div>

      {error && <p style={{ color: PALETTE.remove, textAlign: "center", marginBottom: '20px' }}>{error}</p>}

      {loading ? (
        <p style={{ textAlign: "center", marginTop: '50px' }}>Loading tasks...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: "24px",
            alignItems: 'flex-start',
            flexGrow: 1,
          }}
        >
          {(Object.keys(columns) as (keyof Columns)[]).map(columnKey => (
            <div
              key={columnKey}
              onDrop={() => handleDrop(columnKey)}
              onDragOver={allowDrop}
              style={{
                background: columnBg,
                borderRadius: "20px",
                padding: "16px",
                minHeight: "420px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                border: `1px solid ${borderColor}`,
              }}
            >
              <ColumnHeader
                title={
                  columnKey === "todo"
                    ? "To Do"
                    : columnKey === "inProgress"
                    ? "In Progress"
                    : "Completed"
                }
              />

              {columns[columnKey].length === 0 && (
                <p style={{ textAlign: 'center', color: isDark ? '#aaa' : '#666', marginTop: '10px' }}>
                  Drag tasks here or add a new one.
                </p>
              )}

              {columns[columnKey].map(task => (
                <TaskCard key={task.taskId} task={task} columnKey={columnKey} />
              ))}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: PALETTE.modalBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: cardBg,
              padding: "24px",
              borderRadius: "20px",
              width: "380px",
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
              color: isDark ? PALETTE.darkText : PALETTE.lightText,
            }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.8rem", marginBottom: "20px", color: primaryAccent }}>Add New Task</h2>
            <input
              placeholder="Title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                borderRadius: "10px",
                border: `1px solid ${borderColor}`,
                background: isDark ? PALETTE.darkColumn : 'transparent',
                color: 'inherit',
                outline: 'none',
              }}
              autoFocus
            />
            <textarea
              placeholder="Description (Optional)"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                height: "100px",
                borderRadius: "10px",
                border: `1px solid ${borderColor}`,
                background: isDark ? PALETTE.darkColumn : 'transparent',
                color: 'inherit',
                outline: 'none',
              }}
            />
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  marginRight: "10px",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  background: isDark ? '#444' : '#ccc',
                  color: isDark ? '#eee' : '#333',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                style={{
                  background: primaryButtonBg,
                  color: isDark ? PALETTE.lightText : PALETTE.darkText,
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "10px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedTask && (
        <div
          onClick={() => setExpandedTask(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: PALETTE.modalBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: cardBg,
              padding: "28px",
              borderRadius: "20px",
              width: "450px",
              boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
              color: isDark ? PALETTE.darkText : PALETTE.lightText,
              cursor: 'default',
            }}
          >
            <h2 style={{ fontSize: "1.8rem", color: primaryAccent }}>{expandedTask.title}</h2>
            <p style={{ marginTop: "12px", lineHeight: "1.6", whiteSpace: 'pre-wrap' }}>
              {expandedTask.description || "No description provided."}
            </p>
            <p style={{ marginTop: "15px", fontSize: '0.9rem', color: isDark ? PALETTE.darkText : PALETTE.lightText, opacity: 0.75 }}>
              Status: <span style={{ fontWeight: 'bold' }}>{expandedTask.taskStatus.replace('_', ' ')}</span>
            </p>
            <button
              onClick={() => setExpandedTask(null)}
              style={{
                marginTop: '20px',
                padding: "8px 15px",
                borderRadius: "8px",
                background: isDark ? '#444' : '#ccc',
                color: isDark ? '#eee' : '#333',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
