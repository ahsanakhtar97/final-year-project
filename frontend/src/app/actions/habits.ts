import api from "@/lib/axios";
import { Habit } from "@/types/habits";

export interface CreateHabitPayload {
  habitName: string;
  categoryId: number;
}

export async function getHabit(habitId: number): Promise<Habit> {
  const res = await api.get<Habit>(`/habits/${habitId}`);
  return res.data;
}

export async function getHabits(): Promise<Habit[]> {
  const res = await api.get<Habit[]>("/habits");
  return res.data;
}

export async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
  const res = await api.post<Habit>("/habits", payload);
  return res.data;
}

export async function deleteHabit(habitId: number): Promise<void> {
  await api.delete(`/habits/${habitId}`);
}
