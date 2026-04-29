import api from "@/lib/axios";

export interface AnalyticsCorrelation {
  date: string;
  habitsCompleted: number;
  moodScore: number | null;
}

export async function getUserAnalytics(userId: number): Promise<{ correlations: AnalyticsCorrelation[] }> {
  const res = await api.get(`/analytics/user/${userId}`);
  return res.data;
}
