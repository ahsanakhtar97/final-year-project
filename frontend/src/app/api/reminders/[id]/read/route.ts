import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function mapRow(row: Record<string, unknown>) {
  return {
    reminderId: row.reminder_id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    scheduledFor: row.scheduled_for,
    isRead: row.is_read,
    referenceId: row.reference_id,
    createdAt: row.created_at,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  if (tokenUserId === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const reminderId = Number(id);
  if (isNaN(reminderId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const sql = getDb();
  const rows = await sql`
    UPDATE reminders
    SET is_read = true
    WHERE reminder_id = ${reminderId} AND user_id = ${tokenUserId}
    RETURNING *
  `;
  if (!rows.length) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
  }
  return NextResponse.json(mapRow(rows[0] as Record<string, unknown>));
}
