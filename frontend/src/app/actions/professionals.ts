import api from "@/lib/axios";
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
  const res = await api.get<PublicProfessional[]>("/professionals", {
    params: role ? { role } : undefined,
  });
  return res.data;
}

export async function getProfessional(id: number): Promise<PublicProfessional> {
  const res = await api.get<PublicProfessional>(`/professionals/${id}`);
  return res.data;
}
