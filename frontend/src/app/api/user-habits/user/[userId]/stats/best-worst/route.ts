import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await params;
    const uid = Number(userId);
    if (isNaN(uid)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    if (uid !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const days = Number(searchParams.get('days') ?? '30');
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const sql = getDb();
    const rows = await sql`
      SELECT h.habit_id, h.habit_name,
        COUNT(CASE WHEN hl.status = 'completed' THEN 1 END) AS completed_count
      FROM user_habits uh
      JOIN habits h ON h.habit_id = uh.habit_id
      LEFT JOIN habit_logs hl ON hl.user_habit_id = uh.user_habit_id AND hl.date >= ${sinceStr}
      WHERE uh.user_id = ${uid}
      GROUP BY h.habit_id, h.habit_name
      ORDER BY completed_count DESC
    `;

    if (!rows.length) {
      return NextResponse.json({ best: null, worst: null });
    }

    const mapped = rows.map((r) => {
      const row = r as Record<string, unknown>;
      return {
        habitId: row.habit_id,
        habitName: row.habit_name,
        count: Number(row.completed_count),
      };
    });

    return NextResponse.json({
      best: mapped[0],
      worst: mapped[mapped.length - 1],
    });
  } catch (err) {
    console.error('GET /api/user-habits/user/[userId]/stats/best-worst error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
