function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

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
  tone: 'encourage' | 'celebrate' | 'reset';
}

export async function askCoach(payload: {
  context: CoachContext;
  message?: string;
}): Promise<CoachReply> {
  const res = await fetch('/api/ai/coach', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to reach AI coach');
  return res.json();
}

export interface MoodAnalysis {
  score: number;
  tags: string[];
  reflection: string;
}

export async function analyzeMoodText(text: string): Promise<MoodAnalysis> {
  const res = await fetch('/api/ai/analyze-mood', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to analyze mood');
  return res.json();
}

export interface ParsedTask {
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
}

export async function parseTaskDescription(description: string): Promise<ParsedTask> {
  const res = await fetch('/api/ai/parse-task', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error('Failed to parse task');
  return res.json();
}

export async function generateJournalPrompt(
  recentMoodAvg?: number,
  recentTags?: string[]
): Promise<string> {
  const res = await fetch('/api/ai/journal-prompt', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ recentMoodAvg, recentTags }),
  });
  if (!res.ok) throw new Error('Failed to generate journal prompt');
  const data: { prompt: string } = await res.json();
  return data.prompt;
}

export interface CorrelationDayData {
  date: string;
  habitsCompleted: number;
  moodScore: number | null;
  sleepHours: number | null;
  tasksCompleted: number;
}

export interface CorrelationInsight {
  title: string;
  insight: string;
  type: 'positive' | 'neutral' | 'warning';
}

export async function getCorrelationInsights(payload: {
  days: CorrelationDayData[];
  totalHabitLogs: number;
  totalJournalEntries: number;
}): Promise<CorrelationInsight[]> {
  try {
    const res = await fetch('/api/ai/correlations', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
