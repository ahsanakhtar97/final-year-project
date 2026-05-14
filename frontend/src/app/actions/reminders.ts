function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export interface Reminder {
  reminderId: number;
  userId: number;
  title: string;
  message: string;
  type: 'task' | 'mood' | 'habit' | 'custom';
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
  type?: 'task' | 'mood' | 'habit' | 'custom';
  scheduledFor?: string;
  referenceId?: number;
}

export async function getReminders(userId: number): Promise<Reminder[]> {
  const res = await fetch(`/api/reminders?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return res.json();
}

export async function getUnreadCount(userId: number): Promise<number> {
  const res = await fetch(`/api/reminders/unread-count?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch unread count');
  const data: { count: number } = await res.json();
  return data.count;
}

export async function getSmartReminders(userId: number): Promise<SmartReminder[]> {
  const res = await fetch(`/api/reminders/smart?userId=${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch smart reminders');
  return res.json();
}

export async function createReminder(payload: CreateReminderPayload): Promise<Reminder> {
  const res = await fetch('/api/reminders', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create reminder');
  return res.json();
}

export async function markReminderRead(reminderId: number, _userId: number): Promise<Reminder> {
  const res = await fetch(`/api/reminders/${reminderId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to mark reminder as read');
  return res.json();
}

export async function markAllRead(userId: number): Promise<{ updated: number }> {
  const res = await fetch(`/api/reminders/read-all?userId=${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to mark all reminders as read');
  return res.json();
}

export async function deleteReminder(reminderId: number, _userId: number): Promise<void> {
  const res = await fetch(`/api/reminders/${reminderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete reminder');
}
