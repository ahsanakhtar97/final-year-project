function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export interface Report {
  reportId: number;
  userId: number;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function getUserReports(userId: number): Promise<Report[]> {
  const res = await fetch(`/api/reports/user/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}
