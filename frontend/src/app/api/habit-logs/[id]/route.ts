import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function verifyOwnership(sql: ReturnType<typeof import('@/lib/db').getDb>, logId: number, tokenUserId: number): Promise<boolean> {
  const rows = await sql`
    SELECT uh.user_id FROM habit_logs hl
    JOIN user_habits uh ON uh.user_habit_id = hl.user_habit_id
    WHERE hl.log_id = ${logId}
  `;
  if (!rows.length) return false;
  return Number((rows[0] as Record<string, unknown>).user_id) === tokenUserId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const logId = Number(id);
    if (isNaN(logId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const owned = await verifyOwnership(sql, logId, tokenUserId);
    if (!owned) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });

    const body = await req.json();
    const { status } = body;
    if (!status) return NextResponse.json({ error: 'status is required' }, { status: 400 });

    const rows = await sql`
      UPDATE habit_logs SET status = ${status} WHERE log_id = ${logId} RETURNING *
    `;
    const r = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      logId: r.log_id,
      userHabitId: r.user_habit_id,
      date: r.date,
      status: r.status,
      moodScore: r.mood_score,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error('PATCH /api/habit-logs/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const logId = Number(id);
    if (isNaN(logId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const owned = await verifyOwnership(sql, logId, tokenUserId);
    if (!owned) return NextResponse.json({ error: 'Forbidden or not found' }, { status: 403 });

    await sql`DELETE FROM habit_logs WHERE log_id = ${logId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/habit-logs/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
