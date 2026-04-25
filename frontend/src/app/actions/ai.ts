import api from "@/lib/axios";

export interface CoachContext {
  openTasks?: number;
  tasksCompleted7d?: number;
  recentMoodAvg?: number;
  bestStreak?: number;
  focusMinutesToday?: number;
  habitsDoneToday?: number;
  habitsTotalToday?: number;
}

export interface CoachReply {
  reply: string;
  suggestions: string[];
  tone: "encourage" | "celebrate" | "reset";
}

export async function askCoach(payload: {
  context: CoachContext;
  message?: string;
}): Promise<CoachReply> {
  const res = await api.post<CoachReply>("/ai/coach", payload);
  return res.data;
}
