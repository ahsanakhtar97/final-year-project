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

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function upsertMoodLog(payload: UpsertMoodPayload): Promise<MoodLog> {
  const res = await fetch('/api/mood', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`upsertMoodLog failed: ${res.status}`);
  return res.json();
}

export async function getRecentMoodLogs(days = 30): Promise<MoodLog[]> {
  const res = await fetch(`/api/mood?days=${days}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`getRecentMoodLogs failed: ${res.status}`);
  return res.json();
}

export async function getTodayMoodLog(): Promise<MoodLog | null> {
  const res = await fetch('/api/mood/today', { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`getTodayMoodLog failed: ${res.status}`);
  return res.json();
}

export async function deleteMoodLog(id: number): Promise<void> {
  const res = await fetch(`/api/mood/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`deleteMoodLog failed: ${res.status}`);
}
