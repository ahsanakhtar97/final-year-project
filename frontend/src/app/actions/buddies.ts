import { User } from "@/types/users";

export enum BuddyStatus {
  PENDING  = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export interface BuddyConnection {
  connectionId: number;
  requesterId: number;
  receiverId: number;
  status: BuddyStatus;
  createdAt: string;
  requester?: User;
  receiver?: User;
}

function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

export async function getUserBuddies(userId: number): Promise<BuddyConnection[]> {
  const res = await fetch(`/api/buddies/user/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch buddy connections');
  }
  return res.json();
}

export async function sendBuddyRequest(receiverId: number): Promise<BuddyConnection> {
  const res = await fetch('/api/buddies/request', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ receiverId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send buddy request');
  }
  return res.json();
}

export async function acceptBuddyRequest(connectionId: number): Promise<BuddyConnection> {
  const res = await fetch(`/api/buddies/${connectionId}/accept`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to accept buddy request');
  }
  return res.json();
}

export async function rejectBuddyRequest(connectionId: number): Promise<BuddyConnection> {
  const res = await fetch(`/api/buddies/${connectionId}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to reject buddy request');
  }
  return res.json();
}
