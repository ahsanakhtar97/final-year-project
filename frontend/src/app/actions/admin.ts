/**
 * Admin API client — plain fetch wrapper that:
 *  - Reads the JWT from localStorage (same 'accessToken' key)
 *  - Redirects to /admin/login on 401
 */

// ─── Auth helper ─────────────────────────────────────────────────────────────

function getAuthHeaders() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

async function adminFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers ?? {}) },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.replace('/admin/login');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error(String(err.error ?? err.message ?? `Request failed: ${res.status}`));
  }

  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdminRole = 'patient' | 'psychiatrist' | 'psychologist' | 'admin';
export type ApptStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'declined';

export interface AdminUser {
  userId: number;
  name: string;
  email: string;
  role: AdminRole;
  verified: boolean;
  xp: number;
  level: number;
  createdAt: string;
  credentials?: string | null;
  yearsExperience?: number | null;
  bio?: string | null;
  languages?: string | null;
  feeText?: string | null;
}

export interface AdminAppointment {
  appointmentId: number;
  patientId: number;
  professionalId: number;
  proposedAt: string;
  durationMinutes: number;
  status: ApptStatus;
  patientNote: string | null;
  professionalNote: string | null;
  createdAt: string;
  patient?: { userId: number; name: string; email: string };
  professional?: { userId: number; name: string; email: string };
}

export interface AdminStats {
  users: {
    total: number;
    patients: number;
    psychiatrists: number;
    psychologists: number;
    admins: number;
  };
  doctors: {
    verified: number;
    pendingVerification: number;
  };
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    declined: number;
  };
  growth: {
    newSignups7Days: number;
  };
}

export interface PaginatedUsers {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedAppointments {
  appointments: AdminAppointment[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  return adminFetch<AdminStats>('/api/admin/stats');
}

export async function getAdminUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedUsers> {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  ).toString() : '';
  return adminFetch<PaginatedUsers>(`/api/admin/users${qs}`);
}

export async function updateAdminUser(
  id: number,
  payload: { role?: string; verified?: boolean }
): Promise<AdminUser> {
  return adminFetch<AdminUser>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminUser(id: number): Promise<void> {
  await adminFetch<unknown>(`/api/admin/users/${id}`, { method: 'DELETE' });
}

export async function getAdminProfessionals(): Promise<AdminUser[]> {
  return adminFetch<AdminUser[]>('/api/admin/professionals');
}

export async function verifyProfessional(
  id: number,
  verified: boolean
): Promise<{ userId: number; name: string; verified: boolean; message: string }> {
  return adminFetch<{ userId: number; name: string; verified: boolean; message: string }>(
    `/api/admin/professionals/${id}/verify`,
    { method: 'PATCH', body: JSON.stringify({ verified }) }
  );
}

export async function getAdminAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedAppointments> {
  const qs = params ? '?' + new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  ).toString() : '';
  return adminFetch<PaginatedAppointments>(`/api/admin/appointments${qs}`);
}

export async function deleteAdminAppointment(id: number): Promise<void> {
  await adminFetch<unknown>(`/api/admin/appointments/${id}`, { method: 'DELETE' });
}
