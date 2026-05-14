import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

type Params = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  const { userId: userIdStr } = await params;
  const userId = Number(userIdStr);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }
  if (tokenUserId === null || tokenUserId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        ub.user_badge_id,
        ub.user_id,
        ub.badge_id,
        ub.earned_at,
        b.name,
        b.description,
        b.icon,
        b.xp_reward
      FROM user_badges ub
      JOIN badges b ON b.badge_id = ub.badge_id
      WHERE ub.user_id = ${userId}
      ORDER BY ub.earned_at DESC
    `;
    return NextResponse.json(
      rows.map((row) => {
        const r = row as Record<string, unknown>;
        return {
          userBadgeId: r.user_badge_id,
          userId: r.user_id,
          badgeId: r.badge_id,
          earnedAt: r.earned_at,
          badge: {
            badgeId: r.badge_id,
            name: r.name,
            description: r.description,
            icon: r.icon,
            xpReward: r.xp_reward,
          },
        };
      })
    );
  } catch {
    return NextResponse.json([]);
  }
}
