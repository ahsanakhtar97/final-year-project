import type { UserRole } from "./auth";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "completed"
  | "cancelled";

export interface AppointmentUserSummary {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface Appointment {
  appointmentId: number;
  patientId: number;
  professionalId: number;
  proposedAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  patientNote: string | null;
  professionalNote: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: AppointmentUserSummary;
  professional?: AppointmentUserSummary;
}

export interface CreateAppointmentPayload {
  professionalId: number;
  proposedAt: string;
  durationMinutes?: number;
  patientNote?: string;
}

export interface UpdateAppointmentPayload {
  status?: AppointmentStatus;
  proposedAt?: string;
  professionalNote?: string;
}

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function createAppointment(p: CreateAppointmentPayload): Promise<Appointment> {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(p),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create appointment');
  }
  return res.json();
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const res = await fetch('/api/appointments/mine', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch appointments');
  }
  return res.json();
}

export async function getAppointment(id: number): Promise<Appointment> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch appointment');
  }
  return res.json();
}

export async function updateAppointment(id: number, p: UpdateAppointmentPayload): Promise<Appointment> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(p),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update appointment');
  }
  return res.json();
}

export async function deleteAppointment(id: number): Promise<void> {
  const res = await fetch(`/api/appointments/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete appointment');
  }
}
