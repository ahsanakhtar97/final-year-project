import api from "@/lib/axios";
import { User } from "@/types/users";

export enum BuddyStatus {
  PENDING = 'pending',
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

export async function getUserBuddies(userId: number): Promise<BuddyConnection[]> {
  const res = await api.get<BuddyConnection[]>(`/buddies/user/${userId}`);
  return res.data;
}

export async function sendBuddyRequest(receiverId: number): Promise<BuddyConnection> {
  const res = await api.post<BuddyConnection>(`/buddies/request`, { receiverId });
  return res.data;
}

export async function acceptBuddyRequest(connectionId: number): Promise<BuddyConnection> {
  const res = await api.patch<BuddyConnection>(`/buddies/accept/${connectionId}`);
  return res.data;
}
