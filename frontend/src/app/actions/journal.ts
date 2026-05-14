import {
  CreateJournalEntryPayload,
  JournalEntry,
} from '@/types/journal';

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function createJournalEntry(
  payload: CreateJournalEntryPayload,
): Promise<JournalEntry> {
  const res = await fetch('/api/journal', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createJournalEntry failed: ${res.status}`);
  return res.json();
}

export async function getJournalEntriesByUser(
  userId: number,
): Promise<JournalEntry[]> {
  const res = await fetch(`/api/journal/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`getJournalEntriesByUser failed: ${res.status}`);
  return res.json();
}

export async function deleteJournalEntry(
  entryId: number,
): Promise<{ message: string }> {
  const res = await fetch(`/api/journal/${entryId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`deleteJournalEntry failed: ${res.status}`);
  return res.json();
}

export async function getAverageMood(
  userId: number,
  limit = 7,
): Promise<{ average: number | null; count: number }> {
  const res = await fetch(`/api/journal/user/${userId}/mood?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error(`getAverageMood failed: ${res.status}`);
  return res.json();
}
