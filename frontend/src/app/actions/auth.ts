export type UserRole = "patient" | "psychiatrist" | "psychologist";

interface LoginPayload { email: string; password: string; }
interface AuthResponse { accessToken: string; userId: number; name: string; email: string; role: UserRole; }
interface RegisterPayload { name: string; email: string; password: string; role?: UserRole; bio?: string; credentials?: string; languages?: string; feeText?: string; yearsExperience?: number; }

export async function loginUser(data: LoginPayload): Promise<AuthResponse> {
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Login failed');
  return json;
}

export async function registerUser(data: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Registration failed');
  return json;
}
