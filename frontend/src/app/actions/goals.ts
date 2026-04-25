import api from "@/lib/axios";
import {
  CreateGoalPayload,
  Goal,
  UpdateGoalPayload,
} from "@/types/goals";

export async function getGoalsByUser(userId: number): Promise<Goal[]> {
  const res = await api.get<Goal[]>(`/goals/user/${userId}`);
  return res.data;
}

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  const res = await api.post<Goal>("/goals", payload);
  return res.data;
}

export async function updateGoal(
  goalId: number,
  payload: UpdateGoalPayload,
): Promise<Goal> {
  const res = await api.patch<Goal>(`/goals/${goalId}`, payload);
  return res.data;
}

export async function incrementGoal(goalId: number): Promise<Goal> {
  const res = await api.patch<Goal>(`/goals/${goalId}/increment`);
  return res.data;
}

export async function deleteGoal(goalId: number): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/goals/${goalId}`);
  return res.data;
}
