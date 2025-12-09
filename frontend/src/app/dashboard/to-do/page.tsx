"use client";

import { useState } from "react";
import { useTheme } from "@/app/dashboard/layout";

interface Task {
  id: string;
  title: string;
  description: string;
}

export default function ToDoBoard() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [columns, setColumns] = useState({
    todo: [
      { id: "1", title: "Study React", description: "Learn hooks and routing" },
      { id: "2", title: "Build Kanban UI", description: "Create column layout and styles" },
    ],
    inProgress: [
      { id: "3", title: "Work on Dashboard", description: "Design dashboard cards" },
    ],
    completed: [
      { id: "4", title: "Project Setup Done", description: "Dependencies installed" },
    ],
  });

  const [draggedItem, setDraggedItem] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [expandedTask, setExpandedTask] = useState<Task | null>(null);

  const boardStyle: React.CSSProperties = {
    minHeight: "100vh",
    padding: "30px",
    background: isDark
      ? "linear-gradient(180deg, #0f1f17, #1b2f24)"
      : "linear-gradient(180deg, #dff8e3, #bfe7c5)",
    color: isDark ? "#e5f5ec" : "#123716",
    transition: "all 0.3s ease",
  };

  const columnBg = isDark ? "#1f2f27" : "#ffffff";
  const cardBg = isDark ? "#243b30" : "#ffffff";
  const borderColor = isDark ? "#355a4a" : "#e5e5e5";

  const handleDragStart = (task: Task, column: string) => {
    setDraggedItem(task);
    setSourceColumn(column);
  };

  const handleDrop = (target: keyof typeof columns) => {
    if (!draggedItem) return;

    setColumns((prev) => {
      const updated = { ...prev };

      updated[sourceColumn] = updated[sourceColumn].filter(
        (t) => t.id !== draggedItem.id
      );

      updated[target] = [...updated[target], draggedItem];

      return updated;
    });

    setDraggedItem(null);
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const addTask = () => {
    if (!newTitle.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
    };

    setColumns((prev) => ({
      ...prev,
      todo: [...prev.todo, task],
    }));

    setShowModal(false);
    setNewTitle("");
    setNewDescription("");
  };

  return (
    <main style={boardStyle}>
      <h1 style={{ fontSize: "34px" }}>To-Do List</h1>

      {/* Add Task Button */}
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
              {columnKey === "todo"
                ? "To Do"
                : columnKey === "inProgress"
                ? "In Progress"
                : "Completed"}
            </h2>

            {columns[columnKey].map((task) => (
              <div
                key={task.id}
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
                    setColumns((prev) => ({
                      ...prev,
                      [columnKey]: prev[columnKey].filter((t) => t.id !== task.id),
                    }));
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
              background: cardBg,
              padding: "24px",
              borderRadius: "20px",
              width: "340px",
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

            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button onClick={() => setShowModal(false)} style={{ marginRight: "10px" }}>
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: cardBg,
              padding: "28px",
              borderRadius: "20px",
              width: "400px",
            }}
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
