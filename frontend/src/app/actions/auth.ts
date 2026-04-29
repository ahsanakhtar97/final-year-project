import api from "@/lib/axios";

export type UserRole = "patient" | "psychiatrist" | "psychologist";

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  bio?: string;
  credentials?: string;
  languages?: string;
  feeText?: string;
  yearsExperience?: number;
}

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function registerUser(data: RegisterPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
}
