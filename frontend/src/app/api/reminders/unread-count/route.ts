import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(req: NextRequest) {
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
    SELECT COUNT(*) AS count
    FROM reminders
    WHERE user_id = ${userId} AND is_read = false
  `;
  const count = Number(rows[0]?.count ?? 0);
  return NextResponse.json({ count });
}
