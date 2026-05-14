function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export interface AnalyticsCorrelation {
  date: string;
  habitsCompleted: number;
  moodScore: number | null;
}

export async function getUserAnalytics(userId: number): Promise<{ correlations: AnalyticsCorrelation[] }> {
  const res = await fetch(`/api/analytics/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return { correlations: [] };
  return res.json();
}
