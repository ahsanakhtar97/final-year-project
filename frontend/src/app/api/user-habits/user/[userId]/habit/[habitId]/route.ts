import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; habitId: string }> }
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, habitId } = await params;
    const uid = Number(userId);
    const hid = Number(habitId);
    if (isNaN(uid) || isNaN(hid)) return NextResponse.json({ error: 'Invalid params' }, { status: 400 });
    if (uid !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sql = getDb();

    // Find user_habit_id first so we can clean up habit_logs
    const uh = await sql`
      SELECT user_habit_id FROM user_habits WHERE user_id = ${uid} AND habit_id = ${hid}
    `;
    if (uh.length) {
      const userHabitId = (uh[0] as Record<string, unknown>).user_habit_id;
      await sql`DELETE FROM habit_logs WHERE user_habit_id = ${userHabitId}`;
    }

    await sql`DELETE FROM user_habits WHERE user_id = ${uid} AND habit_id = ${hid}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/user-habits/user/[userId]/habit/[habitId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
