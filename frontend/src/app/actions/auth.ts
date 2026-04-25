import api from "@/lib/axios";

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  userId: number;
  name: string;
  email: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/login", data);
  return res.data;
}

export async function registerUser(data: RegisterPayload): Promise<AuthResponse> {
  const res = await api.post<AuthResponse>("/auth/register", data);
  return res.data;
}
