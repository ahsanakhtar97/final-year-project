import { Task, TaskStatus, CreateTaskPayload, UpdateTaskPayload } from "@/types/tasks";

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') { const t = localStorage.getItem('accessToken'); if (t) h['Authorization'] = `Bearer ${t}`; }
  return h;
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load tasks');
  return res.json();
}

export async function createTask(data: CreateTaskPayload): Promise<Task> {
  const res = await fetch('/api/tasks', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function removeTask(taskId: number): Promise<{ message: string }> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to delete task');
  return res.json();
}

export async function updateTaskStatus(taskId: number, newStatus: TaskStatus): Promise<Task> {
  const res = await fetch(`/api/tasks/${taskId}/status/${newStatus}`, { method: 'PATCH', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to update status');
  return res.json();
}

export async function updateTask(taskId: number, payload: UpdateTaskPayload): Promise<Task> {
  const res = await fetch(`/api/tasks/${taskId}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function addFocusMinutes(taskId: number, minutes: number): Promise<Task> {
  const res = await fetch(`/api/tasks/${taskId}/focus`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify({ minutes }) });
  if (!res.ok) throw new Error('Failed to update focus');
  return res.json();
}
