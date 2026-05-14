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

    const sql = getDb();
    const rows = await sql`
      SELECT h.*, uh.user_habit_id FROM user_habits uh
      JOIN habits h ON h.habit_id = uh.habit_id
      WHERE uh.user_id = ${uid} ORDER BY h.habit_name
    `;
    return NextResponse.json(
      rows.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          habitId: row.habit_id,
          habitName: row.habit_name,
          categoryId: row.category_id,
          createdAt: row.created_at,
          userHabitId: row.user_habit_id,
        };
      })
    );
  } catch (err) {
    console.error('GET /api/user-habits/user/[userId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
