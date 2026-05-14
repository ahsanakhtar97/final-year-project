import { CreateGoalPayload, Goal, UpdateGoalPayload } from "@/types/goals";

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') { const t = localStorage.getItem('accessToken'); if (t) h['Authorization'] = `Bearer ${t}`; }
  return h;
}

export async function getGoalsByUser(userId: number): Promise<Goal[]> {
  const res = await fetch(`/api/goals/user/${userId}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to load goals');
  return res.json();
}

export async function createGoal(payload: CreateGoalPayload): Promise<Goal> {
  const res = await fetch('/api/goals', { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create goal');
  return res.json();
}

export async function updateGoal(goalId: number, payload: UpdateGoalPayload): Promise<Goal> {
  const res = await fetch(`/api/goals/${goalId}`, { method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update goal');
  return res.json();
}

export async function incrementGoal(goalId: number): Promise<Goal> {
  const res = await fetch(`/api/goals/${goalId}/increment`, { method: 'PATCH', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to increment goal');
  return res.json();
}

export async function deleteGoal(goalId: number): Promise<{ message: string }> {
  const res = await fetch(`/api/goals/${goalId}`, { method: 'DELETE', headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Failed to delete goal');
  return res.json();
}
