import api from "@/lib/axios";

export interface Reminder {
  reminderId: number;
  userId: number;
  title: string;
  message: string;
  type: "task" | "mood" | "habit" | "custom";
  scheduledFor: string | null;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
}

export interface SmartReminder {
  id: string;
  type: string;
  title: string;
  message: string;
  urgent: boolean;
}

export interface CreateReminderPayload {
  userId: number;
  title: string;
  message?: string;
  type?: "task" | "mood" | "habit" | "custom";
  scheduledFor?: string;
  referenceId?: number;
}

export async function getReminders(userId: number): Promise<Reminder[]> {
  const res = await api.get<Reminder[]>("/reminders", { params: { userId } });
  return res.data;
}

export async function getUnreadCount(userId: number): Promise<number> {
  const res = await api.get<{ count: number }>("/reminders/unread-count", { params: { userId } });
  return res.data.count;
}

export async function getSmartReminders(userId: number): Promise<SmartReminder[]> {
  const res = await api.get<SmartReminder[]>("/reminders/smart", { params: { userId } });
  return res.data;
}

export async function createReminder(payload: CreateReminderPayload): Promise<Reminder> {
  const res = await api.post<Reminder>("/reminders", payload);
  return res.data;
}

export async function markReminderRead(reminderId: number, userId: number): Promise<Reminder> {
  const res = await api.patch<Reminder>(`/reminders/${reminderId}/read`, null, { params: { userId } });
  return res.data;
}

export async function markAllRead(userId: number): Promise<{ updated: number }> {
  const res = await api.patch<{ updated: number }>("/reminders/read-all", null, { params: { userId } });
  return res.data;
}

export async function deleteReminder(reminderId: number, userId: number): Promise<void> {
  await api.delete(`/reminders/${reminderId}`, { params: { userId } });
}
