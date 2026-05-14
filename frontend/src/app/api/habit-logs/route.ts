import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const userId = Number(searchParams.get('userId'));
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'userId query param required' }, { status: 400 });
    }
    if (userId !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sql = getDb();
    const rows = await sql`
      SELECT hl.*, uh.user_id, uh.habit_id
      FROM habit_logs hl
      JOIN user_habits uh ON uh.user_habit_id = hl.user_habit_id
      WHERE uh.user_id = ${userId}
      ORDER BY hl.date DESC
    `;

    return NextResponse.json(
      rows.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          logId: row.log_id,
          userHabitId: row.user_habit_id,
          userId: row.user_id,
          habitId: row.habit_id,
          date: row.date,
          status: row.status,
          moodScore: row.mood_score,
          createdAt: row.created_at,
        };
      })
    );
  } catch (err) {
    console.error('GET /api/habit-logs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
