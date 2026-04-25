import api from "@/lib/axios";
import { Task, TaskStatus } from "@/types/tasks";
import { UpdateUserPayload, User } from "@/types/users";

// Client-callable user helpers. Server actions can't read localStorage,
// so these intentionally run from the browser via our axios instance,
// which attaches the bearer token automatically.

export async function getUsers(): Promise<User[]> {
  const res = await api.get<User[]>("/users");
  return res.data;
}

export async function getUser(userId: number): Promise<User> {
  const res = await api.get<User>(`/users/${userId}`);
  return res.data;
}

export async function getTasksByUserId(id: number): Promise<Task[]> {
  const res = await api.get<Task[]>(`/users/${id}/tasks`);
  return res.data;
}

export async function getTasksByStatus(
  id: number,
  status: TaskStatus,
): Promise<Task[]> {
  const res = await api.get<Task[]>(`/users/${id}/tasks/status/${status}`);
  return res.data;
}

export async function updateUser(
  userId: number,
  data: UpdateUserPayload,
): Promise<{ accessToken: string; message: string }> {
  const res = await api.patch<{ accessToken: string; message: string }>(
    `/users/${userId}`,
    data,
  );
  return res.data;
}

export async function deleteUser(userId: number) {
  const res = await api.delete(`/users/${userId}`);
  return res.data;
}
