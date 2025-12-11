"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/app/dashboard/layout";
import {
  getTasks,
  createTask,
  removeTask,
  updateTaskStatus,
} from "../../actions/tasks";
import { Task, TaskStatus, CreateTaskPayload } from "@/types/tasks";
import { getTasksByUserId } from "@/app/actions/getUsers";
import { getUserId } from "@/lib/utils";

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
  lightColumn: "#f0f8f0", // Slightly off-white for column area
  darkColumn: "#1f2f27",  // Darker green for column area
  lightCard: "#ffffff",
  darkCard: "#243b30",
  
  // Text & Accents
  lightText: "#123716",
  darkText: "#e5f5ec",
  lightAccent: "#163b25", // Dark green button/accent color
  darkAccent: "#60d394",  // Bright green text/accent color
  lightBorder: "#e5e5e5",
  darkBorder: "#355a4a",
  
  // Action Colors
  complete: "#2ecc71", // Green/Success
  remove: "#e74c3c",   // Red/Danger
  modalBg: "rgba(0,0,0,0.6)",
};

export default function ToDoBoard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
          const userTasks = tasksFromApi.filter(t => t.userId === uid);
          setColumns({
            todo: userTasks.filter(t => t.taskStatus === TaskStatus.TO_DO),
            inProgress: userTasks.filter(
              t => t.taskStatus === TaskStatus.IN_PROGRESS
            ),
            completed: userTasks.filter(
              t => t.taskStatus === TaskStatus.COMPLETED
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
    minHeight: "100vh",
    padding: "30px",
    background: isDark ? PALETTE.darkBg : PALETTE.lightBg,
    color: isDark ? PALETTE.darkText : PALETTE.lightText,
    transition: "all 0.3s ease",
    display: 'flex',
    flexDirection: 'column',
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

    // --- OPTIMISTIC UI: Step 1: Save current state and update UI instantly ---
    const oldColumns = columns;
    const taskToMove = { ...draggedItem, taskStatus: status };

    setColumns(prev => {
      const updated = { ...prev };
      // Remove from source column
      updated[sourceColumn as keyof Columns] = updated[sourceColumn as keyof Columns].filter(
        t => t.taskId !== draggedItem.taskId
      );
      // Add to target column
      updated[target] = [...updated[target], taskToMove];
      return updated;
    });

    setDraggedItem(null);
    // --- OPTIMISTIC UI: Step 2: Call API and handle errors/revert ---
    try {
      await updateTaskStatus(draggedItem.taskId, status);

    } catch (err) {
      console.error(err);
      setError("Failed to update task status. Reverting change.");
      // Revert state on failure
      setColumns(oldColumns);
    }
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const addTask = async () => {
    if (!newTitle.trim()) return;
    
    // Create a temporary ID for the optimistic update. Use a negative number.
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

    // --- OPTIMISTIC UI: Step 1: Update UI instantly ---
    setColumns(prev => ({
      ...prev,
      todo: [...prev.todo, optimisticTask],
    }));
    setShowModal(false);
    setNewTitle("");
    setNewDescription("");

    // --- OPTIMISTIC UI: Step 2: Call API and handle errors/revert/final update ---
    try {
      const newTaskId = await createTask(payload);
      const id = Number(newTaskId);

      if (isNaN(id)) {
        throw new Error("Invalid taskId returned from backend");
      }
      
      // If successful, update the temporary task with the real ID
      setColumns(prev => ({
        ...prev,
        todo: prev.todo.map(t => t.taskId === tempId ? { ...optimisticTask, taskId: id } : t)
      }));

    } catch (err) {
      console.error(err);
      setError("Failed to create task. Reverting change.");
      // Revert state on failure: remove the temporary task
      setColumns(prev => ({
        ...prev,
        todo: prev.todo.filter(t => t.taskId !== tempId)
      }));
    }
  };

  const deleteTask = async (taskId: number, columnKey: keyof Columns) => {
    // --- OPTIMISTIC UI: Step 1: Save current state and update UI instantly ---
    const oldColumns = columns;
    const taskToDelete = columns[columnKey].find(t => t.taskId === taskId);

    setColumns(prev => ({
      ...prev,
      [columnKey]: prev[columnKey].filter(t => t.taskId !== taskId),
    }));

    // --- OPTIMISTIC UI: Step 2: Call API and handle errors/revert ---
    try {
      await removeTask(taskId);
    } catch (err) {
      console.error(err);
      setError("Failed to delete task. Reverting change.");
      // Revert state on failure: restore the deleted task
      if (taskToDelete) {
        setColumns(prev => ({
          ...prev,
          [columnKey]: [...prev[columnKey], taskToDelete]
        }));
      } else {
        // If we can't find it locally, just revert to the old saved state
        setColumns(oldColumns); 
      }
    }
  };
  
  // --- Reusable JSX components for cleaner rendering ---

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
        opacity: task.taskId < 0 ? 0.7 : 1, // Visual hint for optimistic tasks
      }}
    >
      <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{task.title}</div>
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


  return (
    <main style={boardStyle}>
      {/* --- Main Header (Title and Add Button) --- */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '30px' 
        }}
      >
        <h1 style={{ fontSize: "2.5rem", color: primaryAccent, margin: 0 }}>To-Do List</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: primaryButtonBg,
            color: isDark ? PALETTE.lightText : PALETTE.darkText,
            padding: "12px 20px",
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

      {error && <p style={{ color: PALETTE.remove, textAlign: "center", marginBottom: '20px' }}>{error}</p>}

      {loading ? (
        <p style={{ textAlign: "center", marginTop: '50px' }}>Loading tasks...</p>
      ) : (
        // --- Kanban Board Columns ---
        <div
          style={{
            display: "grid",
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Responsive grid layout
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

      {/* Add Task Modal */}
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

      {/* Expanded Task Modal */}
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
            <p style={{ marginTop: "15px", fontSize: '0.9rem', color: mutedColor }}>
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