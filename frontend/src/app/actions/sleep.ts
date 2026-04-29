import api from "@/lib/axios";

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

export async function upsertSleep(p: UpsertSleepPayload): Promise<SleepLog> {
  const res = await api.post<SleepLog>("/sleep", p);
  return res.data;
}

export async function getRecentSleep(days = 30): Promise<SleepLog[]> {
  const res = await api.get<SleepLog[]>("/sleep", { params: { days } });
  // Backend returns hours as string from numeric column in some envs.
  return res.data.map((r) => ({ ...r, hours: Number(r.hours) }));
}

export async function deleteSleep(id: number): Promise<void> {
  await api.delete(`/sleep/${id}`);
}
