// Mirrors backend JournalEntry entity at backend/src/journal/entities/journal-entry.entity.ts
export interface JournalEntry {
  entryId: number;
  userId: number;
  content: string;
  sentimentScore: number | null;
  feedbackEnglish: string | null;
  feedbackUrdu: string | null;
  createdAt: string; // ISO timestamp
}

export interface CreateJournalEntryPayload {
  userId: number;
  content: string;
  analyze?: boolean;
}
