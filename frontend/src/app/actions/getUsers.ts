import { Task, TaskStatus } from "@/types/tasks";
import { UpdateUserPayload, User } from "@/types/users";

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/users', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch users');
  }
  return res.json();
}

export async function getUser(userId: number): Promise<User> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch user');
  }
  return res.json();
}

export async function getTasksByUserId(id: number): Promise<Task[]> {
  const res = await fetch(`/api/users/${id}/tasks`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch tasks');
  }
  return res.json();
}

export async function getTasksByStatus(id: number, status: TaskStatus): Promise<Task[]> {
  const res = await fetch(`/api/users/${id}/tasks/status/${status}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch tasks by status');
  }
  return res.json();
}

export async function updateUser(
  userId: number,
  data: UpdateUserPayload,
): Promise<{ accessToken: string; message: string }> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update user');
  }
  const result = await res.json() as { accessToken: string; message: string };
  if (result.accessToken && typeof window !== 'undefined') {
    localStorage.setItem('accessToken', result.accessToken);
  }
  return result;
}

export async function deleteUser(userId: number): Promise<{ message: string }> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete user');
  }
  return res.json();
}
