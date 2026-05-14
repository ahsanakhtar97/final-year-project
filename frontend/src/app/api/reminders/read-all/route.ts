import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('userId'));

  if (!userId || isNaN(userId)) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (tokenUserId === null || tokenUserId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE reminders
    SET is_read = true
    WHERE user_id = ${userId}
    RETURNING reminder_id
  `;
  return NextResponse.json({ updated: rows.length });
}
