import { Habit, HabitStreak } from "@/types/habits";
import { CreateUserHabitPayload, UserHabit } from "@/types/user-habits";

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function getHabitsByUserId(userId: number): Promise<Habit[]> {
  const res = await fetch(`/api/user-habits/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserHabit(userId: number, habitId: number): Promise<UserHabit> {
  // Get all user habits and find the matching one
  const habits = await getHabitsByUserId(userId);
  const found = (
    habits as (Habit & { userHabitId?: number; createdAt?: string })[]
  ).find((h) => h.habitId === habitId);
  if (!found) throw new Error(`UserHabit not found for habitId ${habitId}`);
  return {
    userHabitId: found.userHabitId!,
    userId,
    habitId,
    createdAt: found.createdAt ?? new Date().toISOString(),
  } as unknown as UserHabit;
}

export async function getBestWorstHabit(userId: number, days: number = 30) {
  const res = await fetch(`/api/user-habits/user/${userId}/stats/best-worst?days=${days}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getUserStreaks(userId: number): Promise<HabitStreak[]> {
  const res = await fetch(`/api/user-habits/user/${userId}/stats/streaks`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchDailyCompleted(
  userId: number,
  days: number
): Promise<{ date: string; completed: number }[]> {
  const res = await fetch(`/api/user-habits/user/${userId}/completed/${days}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function assignHabit(data: CreateUserHabitPayload) {
  const res = await fetch('/api/user-habits', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function revokeHabit(data: CreateUserHabitPayload) {
  const res = await fetch(`/api/user-habits/user/${data.userId}/habit/${data.habitId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
