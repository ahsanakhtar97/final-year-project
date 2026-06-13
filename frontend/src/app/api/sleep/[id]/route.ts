import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const rows = await sql`
      DELETE FROM sleep_logs
      WHERE sleep_log_id = ${id} AND user_id = ${userId}
      RETURNING sleep_log_id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/sleep/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
