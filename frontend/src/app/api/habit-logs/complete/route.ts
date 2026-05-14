import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function POST(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { userHabitId, date, status = 'completed', moodScore } = body;
    if (!userHabitId || !date) {
      return NextResponse.json({ error: 'userHabitId and date are required' }, { status: 400 });
    }

    const sql = getDb();

    // Verify the user_habit belongs to the requesting user
    const ownership = await sql`
      SELECT user_id FROM user_habits WHERE user_habit_id = ${userHabitId}
    `;
    if (!ownership.length) {
      return NextResponse.json({ error: 'user_habit not found' }, { status: 404 });
    }
    const ownerRow = ownership[0] as Record<string, unknown>;
    if (Number(ownerRow.user_id) !== tokenUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO habit_logs (user_habit_id, date, status, mood_score)
      VALUES (${userHabitId}, ${date}, ${status}, ${moodScore ?? 5})
      ON CONFLICT DO NOTHING RETURNING *
    `;

    if (!rows.length) {
      // Already logged — return existing
      const existing = await sql`
        SELECT * FROM habit_logs WHERE user_habit_id = ${userHabitId} AND date = ${date}
      `;
      const r = existing[0] as Record<string, unknown>;
      return NextResponse.json({
        logId: r.log_id,
        userHabitId: r.user_habit_id,
        date: r.date,
        status: r.status,
        moodScore: r.mood_score,
        createdAt: r.created_at,
      });
    }

    const r = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      logId: r.log_id,
      userHabitId: r.user_habit_id,
      date: r.date,
      status: r.status,
      moodScore: r.mood_score,
      createdAt: r.created_at,
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/habit-logs/complete error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
