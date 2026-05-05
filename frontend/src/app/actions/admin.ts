/**
 * Admin API client — uses a separate axios instance that:
 *  - Reads the JWT from localStorage (same 'accessToken' key)
 *  - Redirects to /admin/login on 401
 */
import axios, { AxiosInstance } from "axios";

const API_HOST =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000");

const adminApi: AxiosInstance = axios.create({
  baseURL: `${API_HOST}/api/v1`,
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err.response?.status === 401) {
      localStorage.removeItem("accessToken");
      if (!window.location.pathname.startsWith("/admin/login")) {
        window.location.replace("/admin/login");
      }
    }
    return Promise.reject(err);
  }
);

// ─── Types ───────────────────────────────────────────────────────────────────

export type AdminRole = "patient" | "psychiatrist" | "psychologist" | "admin";
export type ApptStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined";

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
  const res = await adminApi.get<AdminStats>("/admin/stats");
  return res.data;
}

export async function getAdminUsers(params?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedUsers> {
  const res = await adminApi.get<PaginatedUsers>("/admin/users", { params });
  return res.data;
}

export async function updateAdminUser(
  id: number,
  payload: { role?: string; verified?: boolean }
): Promise<AdminUser> {
  const res = await adminApi.patch<AdminUser>(`/admin/users/${id}`, payload);
  return res.data;
}

export async function deleteAdminUser(id: number): Promise<void> {
  await adminApi.delete(`/admin/users/${id}`);
}

export async function getAdminProfessionals(): Promise<AdminUser[]> {
  const res = await adminApi.get<AdminUser[]>("/admin/professionals");
  return res.data;
}

export async function verifyProfessional(
  id: number,
  verified: boolean
): Promise<{ userId: number; name: string; verified: boolean; message: string }> {
  const res = await adminApi.patch(`/admin/professionals/${id}/verify`, { verified });
  return res.data;
}

export async function getAdminAppointments(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedAppointments> {
  const res = await adminApi.get<PaginatedAppointments>("/admin/appointments", { params });
  return res.data;
}

export async function deleteAdminAppointment(id: number): Promise<void> {
  await adminApi.delete(`/admin/appointments/${id}`);
}
