import api from "@/lib/axios";
import { Habit, HabitStreak } from "@/types/habits";
import { CreateUserHabitPayload, UserHabit } from "@/types/user-habits";

// Client-callable helpers for the /user-habits endpoint family.

export async function getHabitsByUserId(userId: number): Promise<Habit[]> {
  const res = await api.get<Habit[]>(`/user-habits/user/${userId}`);
  return res.data;
}

export async function getUserHabit(
  userId: number,
  habitId: number,
): Promise<UserHabit> {
  const res = await api.get<UserHabit>(
    `/user-habits/user/${userId}/habit/${habitId}`,
  );
  return res.data;
}

export async function getBestWorstHabit(userId: number, days: number = 30) {
  const res = await api.get(
    `/user-habits/user/${userId}/stats/best-worst?days=${days}`,
  );
  return res.data; // { best, worst }
}

export async function getUserStreaks(userId: number): Promise<HabitStreak[]> {
  const res = await api.get<HabitStreak[]>(
    `/user-habits/user/${userId}/stats/streaks`,
  );
  return res.data;
}

export async function fetchDailyCompleted(
  userId: number,
  days: number,
): Promise<{ date: string; completed: number }[]> {
  const res = await api.get<{ date: string; completed: number }[]>(
    `/user-habits/user/${userId}/completed/${days}`,
  );
  return res.data;
}

export async function assignHabit(data: CreateUserHabitPayload) {
  const res = await api.post("/user-habits", data);
  return res.data;
}

// NOTE: the singular `user-habit` path was a bug. The collection lives at /user-habits.
export async function revokeHabit(data: CreateUserHabitPayload) {
  const res = await api.delete(
    `/user-habits/user/${data.userId}/habit/${data.habitId}`,
  );
  return res.data;
}
