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
    }

    try {
      await updateTaskStatus(draggedItem.taskId, status);

      setColumns(prev => {
        const updated = { ...prev };
        updated[sourceColumn as keyof Columns] = updated[
          sourceColumn as keyof Columns
        ].filter(t => t.taskId !== draggedItem.taskId);
        updated[target] = [...updated[target], { ...draggedItem, taskStatus: status }];
        return updated;
      });

      setDraggedItem(null);
    } catch (err) {
      console.error(err);
      setError("Failed to update task status");
    }
  };

  const allowDrop = (e: React.DragEvent) => e.preventDefault();

  const addTask = async () => {
    if (!newTitle.trim()) return;

    const payload: CreateTaskPayload = {
      userId,
      title: newTitle,
      description: newDescription,
      taskStatus: TaskStatus.TO_DO,
    };

    try {
      const newTaskId = await createTask(payload);
      const id = Number(newTaskId);

      if (isNaN(id)) {
        throw new Error("Invalid taskId returned from backend");
      }

      setColumns(prev => ({
        ...prev,
        todo: [...prev.todo, { ...payload, taskId: id, completedAt: null }],
      }));

      setShowModal(false);
      setNewTitle("");
      setNewDescription("");
    } catch (err) {
      console.error(err);
      setError("Failed to create task");
    }
  };

  const deleteTask = async (taskId: number, columnKey: keyof Columns) => {
    try {
      await removeTask(taskId);
      setColumns(prev => ({
        ...prev,
        [columnKey]: prev[columnKey].filter(t => t.taskId !== taskId),
      }));
    } catch (err) {
      console.error(err);
      setError("Failed to delete task");
    }
  };

  return (
    <main style={boardStyle}>
      <h1 style={{ fontSize: "34px", textAlign: "center" }}>To-Do List</h1>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

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

      {loading ? (
        <p style={{ textAlign: "center" }}>Loading tasks...</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            justifyContent: "center",
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

              {columns[columnKey].map(task => (
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
      )}

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
              onChange={e => setNewTitle(e.target.value)}
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
              onChange={e => setNewDescription(e.target.value)}
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
            onClick={e => e.stopPropagation()}
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
