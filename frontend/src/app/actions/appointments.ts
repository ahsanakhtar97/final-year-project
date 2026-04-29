import api from "@/lib/axios";
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

export async function createAppointment(p: CreateAppointmentPayload): Promise<Appointment> {
  const res = await api.post<Appointment>("/appointments", p);
  return res.data;
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const res = await api.get<Appointment[]>("/appointments/mine");
  return res.data;
}

export async function updateAppointment(id: number, p: UpdateAppointmentPayload): Promise<Appointment> {
  const res = await api.patch<Appointment>(`/appointments/${id}`, p);
  return res.data;
}

export async function deleteAppointment(id: number): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
