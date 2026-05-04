import api from "@/lib/axios";

export interface MoodLog {
  moodLogId: number;
  userId: number;
  date: string; // YYYY-MM-DD
  score: number; // 1–5
  emotionTags: string[] | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertMoodPayload {
  date: string;
  score: number;
  emotionTags?: string[];
  note?: string;
}

export async function upsertMoodLog(payload: UpsertMoodPayload): Promise<MoodLog> {
  const res = await api.post<MoodLog>("/mood", payload);
  return res.data;
}

export async function getRecentMoodLogs(days = 30): Promise<MoodLog[]> {
  const res = await api.get<MoodLog[]>("/mood", { params: { days } });
  return res.data;
}

export async function getTodayMoodLog(): Promise<MoodLog | null> {
  const res = await api.get<MoodLog | null>("/mood/today");
  return res.data;
}

export async function deleteMoodLog(id: number): Promise<void> {
  await api.delete(`/mood/${id}`);
}
