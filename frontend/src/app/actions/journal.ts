import api from "@/lib/axios";
import {
  CreateJournalEntryPayload,
  JournalEntry,
} from "@/types/journal";

// Client-callable wrappers around the /journal endpoint family. The
// backend persists each entry along with the AI sentiment feedback, so
// the UI can render a real history list instead of forgetting after refresh.

export async function createJournalEntry(
  payload: CreateJournalEntryPayload,
): Promise<JournalEntry> {
  const res = await api.post<JournalEntry>("/journal", payload);
  return res.data;
}

export async function getJournalEntriesByUser(
  userId: number,
): Promise<JournalEntry[]> {
  const res = await api.get<JournalEntry[]>(`/journal/user/${userId}`);
  return res.data;
}

export async function deleteJournalEntry(
  entryId: number,
): Promise<{ message: string }> {
  const res = await api.delete<{ message: string }>(`/journal/${entryId}`);
  return res.data;
}

export async function getAverageMood(
  userId: number,
  limit = 7,
): Promise<{ average: number | null; count: number }> {
  const res = await api.get<{ average: number | null; count: number }>(
    `/journal/user/${userId}/mood?limit=${limit}`,
  );
  return res.data;
}
