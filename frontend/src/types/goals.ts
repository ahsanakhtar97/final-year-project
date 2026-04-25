export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  goalId: number;
  userId: number;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  status: GoalStatus;
  deadline: string | null; // ISO date
  linkedHabitId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalPayload {
  userId: number;
  title: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  deadline?: string; // YYYY-MM-DD
  linkedHabitId?: number;
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string | null;
  targetValue?: number;
  currentValue?: number;
  unit?: string | null;
  deadline?: string | null;
  linkedHabitId?: number | null;
  status?: GoalStatus;
}
