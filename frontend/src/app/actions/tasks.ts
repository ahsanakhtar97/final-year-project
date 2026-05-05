import api from "@/lib/axios";
import { CreateTaskPayload, Task, TaskStatus, UpdateTaskPayload } from "@/types/tasks";

export async function getTasks(): Promise<Task[]> {
  const res = await api.get<Task[]>("/tasks");
  return res.data;
}

export async function createTask(data: CreateTaskPayload): Promise<Task> {
  const res = await api.post<Task>("/tasks", data);
  const created = res.data as Task & { id?: number };
  return { ...created, taskId: created.taskId ?? created.id! };
}

export async function removeTask(taskId: number): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/tasks/${taskId}`);
  return res.data;
}

export async function updateTaskStatus(taskId: number, newStatus: TaskStatus): Promise<Task> {
  const res = await api.patch<Task>(`/tasks/${taskId}/status/${newStatus}`);
  return res.data;
}

export async function updateTask(taskId: number, payload: UpdateTaskPayload): Promise<Task> {
  const res = await api.patch<Task>(`/tasks/${taskId}`, payload);
  return res.data;
}

export async function addFocusMinutes(taskId: number, minutes: number): Promise<Task> {
  const res = await api.patch<Task>(`/tasks/${taskId}/focus`, { minutes });
  return res.data;
}
