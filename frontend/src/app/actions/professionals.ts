import type { UserRole } from "./auth";

export interface PublicProfessional {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  bio: string | null;
  credentials: string | null;
  languages: string | null;
  feeText: string | null;
  yearsExperience: number | null;
  verified: boolean;
}

export async function listProfessionals(role?: "psychiatrist" | "psychologist"): Promise<PublicProfessional[]> {
  const url = role ? `/api/professionals?role=${encodeURIComponent(role)}` : '/api/professionals';
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch professionals');
  }
  return res.json();
}

export async function getProfessional(id: number): Promise<PublicProfessional> {
  const res = await fetch(`/api/professionals/${id}`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch professional');
  }
  return res.json();
}
