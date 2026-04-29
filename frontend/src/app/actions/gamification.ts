import api from "@/lib/axios";

export interface Badge {
  badgeId: number;
  name: string;
  description: string;
  icon: string | null;
  xpReward: number;
}

export interface UserBadge {
  userBadgeId: number;
  userId: number;
  badgeId: number;
  earnedAt: string;
  badge: Badge;
}

export async function getUserBadges(userId: number): Promise<UserBadge[]> {
  const res = await api.get<UserBadge[]>(`/gamification/user/${userId}/badges`);
  return res.data;
}
