import { Habit } from "@/types/habits";

export interface CreateHabitPayload {
  habitName: string;
  categoryId: number;
}

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function getHabits(): Promise<Habit[]> {
  const res = await fetch('/api/habits');
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHabit(habitId: number): Promise<Habit> {
  const res = await fetch(`/api/habits/${habitId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
  const res = await fetch('/api/habits', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteHabit(habitId: number): Promise<void> {
  const res = await fetch(`/api/habits/${habitId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}
