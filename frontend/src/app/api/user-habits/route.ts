import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function POST(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userId, habitId } = body;
    if (!userId || !habitId) {
      return NextResponse.json({ error: 'userId and habitId are required' }, { status: 400 });
    }
    if (Number(userId) !== tokenUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO user_habits (user_id, habit_id) VALUES (${userId}, ${habitId})
      ON CONFLICT DO NOTHING RETURNING *
    `;
    if (!rows.length) {
      // Already exists — return the existing row
      const existing = await sql`
        SELECT * FROM user_habits WHERE user_id = ${userId} AND habit_id = ${habitId}
      `;
      const r = existing[0] as Record<string, unknown>;
      return NextResponse.json({
        userHabitId: r.user_habit_id,
        userId: r.user_id,
        habitId: r.habit_id,
        createdAt: r.created_at,
      });
    }
    const r = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      userHabitId: r.user_habit_id,
      userId: r.user_id,
      habitId: r.habit_id,
      createdAt: r.created_at,
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/user-habits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
