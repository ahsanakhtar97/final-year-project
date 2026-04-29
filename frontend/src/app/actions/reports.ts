import api from "@/lib/axios";

export interface Report {
  reportId: number;
  userId: number;
  summary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function getUserReports(userId: number): Promise<Report[]> {
  const res = await api.get<Report[]>(`/reports/user/${userId}`);
  return res.data;
}
