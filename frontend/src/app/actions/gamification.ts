function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('accessToken');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

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
  const res = await fetch(`/api/gamification/user/${userId}/badges`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) return [];
  return res.json();
}
