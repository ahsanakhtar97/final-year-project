"use client";

import { getTasksByStatus } from "@/app/actions/getUsers";
import { createTask, removeTask, updateTaskStatus } from "@/app/actions/tasks";
import { CreateTaskPayload, Task, TaskStatus } from "@/types/tasks";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
export default function ToDoBoard() {
  const fetchTasks = async (id: number) => {
  const todoTasks = await getTasksByStatus(id, TaskStatus.TO_DO);
  const inProgressTasks = await getTasksByStatus(id, TaskStatus.IN_PROGRESS);
  const completedTasks = await getTasksByStatus(id, TaskStatus.COMPLETED);

  setColumns({
    to_do: todoTasks,
    in_progress: inProgressTasks,
    completed: completedTasks,
  });
};
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [columns, setColumns] = useState<{
    to_do: Task[];
    in_progress: Task[];
    completed: Task[];
  }>({
    to_do: [],
    in_progress: [],
    completed: [],
  });
  const [userId,setUserId]=useState<number>(-1);
  useEffect(() => {
  const token = localStorage.getItem("accessToken");

  if (!token) return;

  const payload = jwtDecode(token);
  const sub=Number(payload.sub);
  setUserId(sub);
  // Create and call async inside effect
  (async () => {
    const todoTasks = await getTasksByStatus(sub, TaskStatus.TO_DO);
    const inProgressTasks = await getTasksByStatus(sub, TaskStatus.IN_PROGRESS);
    const completedTasks = await getTasksByStatus(sub, TaskStatus.COMPLETED);
    setColumns({
      to_do: todoTasks,
      in_progress: inProgressTasks,
      completed: completedTasks,
    });
  })();
}, []);


  const [draggedItem, setDraggedItem] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [expandedTask, setExpandedTask] = useState<Task | null>(null);

  const isDark = theme === "dark";

  // ✅ Apply theme to full page
  useEffect(() => {
    document.body.style.background = isDark ? "#0f1f17" : "#dff8e3";
    document.body.style.color = isDark ? "#e5f5ec" : "#123716";
    document.body.style.transition = "background 0.3s ease, color 0.3s ease";
  }, [isDark]);

  const handleDragStart = (task: Task, column: string) => {
    setDraggedItem(task);
    setSourceColumn(column);
  };

  const handleDrop =async  (target: keyof typeof columns) => {
    if (!draggedItem) return;
    try{
      await updateTaskStatus(draggedItem.taskId,target as TaskStatus);
      console.log(`Task ${draggedItem.taskId} moved to ${target}`);
       await fetchTasks(userId);
  } catch (error) {
    console.error("Failed to update task status:", error);
  }
 
  // Clear dragged item
  setDraggedItem(null);
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const addTask = async () => {
    if (!newTitle.trim()) return;

    const task: CreateTaskPayload = {
      userId,
      title: newTitle,
      description: newDescription,
      taskStatus:TaskStatus.TO_DO
    };
    await createTask(task);
    setNewTitle("");
    setNewDescription("");
    setShowModal(false);
    await fetchTasks(userId);
  };

  const deleteTask = async (taskId: number) => {
    await removeTask(taskId);
    await fetchTasks(userId);
  };

  const boardStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "30px",
    fontFamily: "'Lora', serif",
    background: isDark
      ? "linear-gradient(180deg, #0f1f17, #1b2f24)"
      : "linear-gradient(180deg, #dff8e3, #bfe7c5)",
    color: isDark ? "#e5f5ec" : "#123716",
    transition: "all 0.3s ease",
  };

  const columnBg = isDark ? "#1f2f27" : "#ffffff";
  const cardBg = isDark ? "#243b30" : "#ffffff";
  const borderColor = isDark ? "#355a4a" : "#e5e5e5";

  return (
    <main style={boardStyle}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "34px" }}>To-Do List</h1>

        {/* Theme Switch */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          style={{
            background: isDark ? "#e5f5ec" : "#163b25",
            color: isDark ? "#123716" : "#fff",
            padding: "10px 16px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {isDark ? "☀ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* Add Task */}
      <div style={{ textAlign: "center", margin: "20px 0" }}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "#163b25",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            cursor: "pointer",
          }}
        >
          + Add Task
        </button>
      </div>

      {/* Columns */}
      <div style={{ display: "flex", gap: "24px", justifyContent: "center" }}>
        {(Object.keys(columns) as (keyof typeof columns)[]).map((columnKey) => (
          <div
            key={columnKey}
            onDrop={() => handleDrop(columnKey)}
            onDragOver={allowDrop}
            style={{
              background: columnBg,
              borderRadius: "20px",
              padding: "16px",
              width: "340px",
              minHeight: "420px",
              boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
            }}
          >
            <h2 style={{ textAlign: "center", textTransform: "capitalize" }}>
              {columnKey === "to_do"
                ? "To Do"
                : columnKey === "in_progress"
                ? "In Progress"
                : "Completed"}
            </h2>

            {columns[columnKey].map((task) => (
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
                  cursor: "pointer",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
                  border: `1px solid ${borderColor}`,
                  position: "relative",
                }}
              >
                {task.title}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.taskId);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: "transparent",
                    border: "none",
                    color: isDark ? "#ff8a8a" : "red",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
<<<<<<< HEAD
              background: "#fff",
              padding: "40px",
=======
              background: cardBg,
              padding: "24px",
>>>>>>> 8179b260693d87c68c3601087422a56e93fa9b3b
              borderRadius: "20px",
              width: "340px",
              paddingRight:'60px'
            }}
          >
            <h2>Add New Task</h2>

            <input
              placeholder="Title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "12px",
                borderRadius: "8px",
                border: `1px solid ${borderColor}`,
                background: "transparent",
                color: "inherit",
              }}
            />

            <textarea
              placeholder="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                height: "80px",
                borderRadius: "8px",
                border: `1px solid ${borderColor}`,
                background: "transparent",
                color: "inherit",
              }}
            />

<<<<<<< HEAD
            <div style={{ marginTop: "16px", textAlign: "right", }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ marginRight: "10px",background:'red',color:'white',border:'none',padding:'10px 16px',borderRadius:'10px' }}
              >
=======
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button onClick={() => setShowModal(false)} style={{ marginRight: "10px" }}>
>>>>>>> 8179b260693d87c68c3601087422a56e93fa9b3b
                Cancel
              </button>
              <button
                onClick={addTask}
                style={{
                  background: "#163b25",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "10px",
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
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              background: cardBg,
              padding: "28px",
              borderRadius: "20px",
              width: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{expandedTask.title}</h2>
            <p style={{ marginTop: "12px", lineHeight: "1.5" }}>
              {expandedTask.description}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
