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

  const sql = getDb();
  const rows = await sql`
    SELECT
      ml.date::text,
      ml.score AS mood_score,
      (
        SELECT COUNT(DISTINCT uh.habit_id)
        FROM user_habits uh
        JOIN habit_logs hl ON hl.user_habit_id = uh.user_habit_id
        WHERE uh.user_id = ${userId} AND hl.date = ml.date
      ) AS habits_completed
    FROM mood_logs ml
    WHERE ml.user_id = ${userId}
    ORDER BY ml.date DESC
    LIMIT 30
  `;

  const correlations = rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      date: r.date,
      habitsCompleted: Number(r.habits_completed),
      moodScore: r.mood_score !== null ? Number(r.mood_score) : null,
    };
  });

  return NextResponse.json({ correlations });
}
