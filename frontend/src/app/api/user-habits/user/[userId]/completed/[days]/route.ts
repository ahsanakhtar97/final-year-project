import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; days: string }> }
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, days } = await params;
    const uid = Number(userId);
    const numDays = Number(days);
    if (isNaN(uid) || isNaN(numDays)) {
      return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    }
    if (uid !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const since = new Date();
    since.setDate(since.getDate() - numDays);
    const sinceStr = since.toISOString().split('T')[0];

    const sql = getDb();
    const rows = await sql`
      SELECT hl.date::text AS date, COUNT(DISTINCT uh.habit_id) AS completed
      FROM user_habits uh
      JOIN habit_logs hl ON hl.user_habit_id = uh.user_habit_id
      WHERE uh.user_id = ${uid} AND hl.status = 'completed' AND hl.date >= ${sinceStr}
      GROUP BY hl.date
    `;

    // Build map of date -> completed count
    const dbMap = new Map<string, number>();
    for (const r of rows) {
      const row = r as Record<string, unknown>;
      dbMap.set(row.date as string, Number(row.completed));
    }

    // Fill every day in range with 0 if missing
    const result: { date: string; completed: number }[] = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({ date: dateStr, completed: dbMap.get(dateStr) ?? 0 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/user-habits/user/[userId]/completed/[days] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
