import api from "@/lib/axios";
import { CreateTaskPayload, Task, TaskStatus } from "@/types/tasks";

// All task actions are client-callable async functions: they hit the backend
// directly via our axios instance, which attaches the bearer token from
// localStorage on the browser. They are intentionally NOT marked
// "use server" — server actions can't see localStorage.

export async function getTasks(): Promise<Task[]> {
  const res = await api.get<Task[]>("/tasks");
  return res.data;
}

export async function createTask(data: CreateTaskPayload): Promise<Task> {
  const res = await api.post<Task>("/tasks", data);
  // Backend returns `taskId` in the entity; older code may read `id`.
  // Normalize so the rest of the UI doesn't have to care.
  const created = res.data as Task & { id?: number };
  return {
    ...created,
    taskId: created.taskId ?? created.id!,
  };
}

export async function removeTask(taskId: number): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/tasks/${taskId}`);
  return res.data;
}

export async function updateTaskStatus(
  taskId: number,
  newStatus: TaskStatus,
): Promise<Task> {
  const res = await api.patch<Task>(`/tasks/${taskId}/status/${newStatus}`);
  return res.data;
}
