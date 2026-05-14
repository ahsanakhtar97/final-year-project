export interface SleepLog {
  sleepLogId: number;
  userId: number;
  date: string; // YYYY-MM-DD
  hours: number;
  quality: number; // 1..5
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSleepPayload {
  date: string;
  hours: number;
  quality: number;
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

export async function upsertSleep(p: UpsertSleepPayload): Promise<SleepLog> {
  const res = await fetch('/api/sleep', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(p),
  });
  if (!res.ok) throw new Error(`upsertSleep failed: ${res.status}`);
  const data: SleepLog = await res.json();
  return { ...data, hours: Number(data.hours) };
}

export async function getRecentSleep(days = 30): Promise<SleepLog[]> {
  const res = await fetch(`/api/sleep?days=${days}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`getRecentSleep failed: ${res.status}`);
  const data: SleepLog[] = await res.json();
  return data.map((r) => ({ ...r, hours: Number(r.hours) }));
}

export async function deleteSleep(id: number): Promise<void> {
  const res = await fetch(`/api/sleep/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`deleteSleep failed: ${res.status}`);
}
