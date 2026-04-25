import api from "@/lib/axios";

export interface DashboardSummary {
  mood: number;
  habitsCount: number;
  recommendation: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<DashboardSummary>("/dashboard/summary");
  return res.data;
}

// Legacy stateless analyze endpoint — useful when we want sentiment
// without persisting (e.g. live preview before the user saves).
export interface AnalyzeJournalResult {
  feedbackEnglish: string;
  feedbackUrdu: string;
  score: number;
}

export async function analyzeJournalText(
  userId: number,
  text: string,
): Promise<AnalyzeJournalResult> {
  const res = await api.post<AnalyzeJournalResult>(
    "/dashboard/analyze-journal",
    { userId, text },
  );
  return res.data;
}
