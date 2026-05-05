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

export interface MoodAnalysis {
  score: number;
  tags: string[];
  reflection: string;
}

export async function analyzeMoodText(text: string): Promise<MoodAnalysis> {
  const res = await api.post<MoodAnalysis>("/ai/analyze-mood", { text });
  return res.data;
}

export interface ParsedTask {
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
}

export async function parseTaskDescription(description: string): Promise<ParsedTask> {
  const res = await api.post<ParsedTask>("/ai/parse-task", { description });
  return res.data;
}

export async function generateJournalPrompt(
  recentMoodAvg?: number,
  recentTags?: string[]
): Promise<string> {
  const res = await api.post<{ prompt: string }>("/ai/journal-prompt", {
    recentMoodAvg,
    recentTags,
  });
  return res.data.prompt;
}
