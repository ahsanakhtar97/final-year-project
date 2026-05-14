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

export async function GET(req: NextRequest, { params }: Params) {
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
  const rows = await sql`SELECT * FROM reminders WHERE reminder_id = ${reminderId}`;
  if (!rows.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const reminder = rows[0] as Record<string, unknown>;
  if (Number(reminder.user_id) !== tokenUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json(mapRow(reminder));
}

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
  const existing = await sql`SELECT * FROM reminders WHERE reminder_id = ${reminderId}`;
  if (!existing.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (Number((existing[0] as Record<string, unknown>).user_id) !== tokenUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, message, type, scheduledFor, isRead, referenceId } = body;

  const rows = await sql`
    UPDATE reminders SET
      title         = COALESCE(${title ?? null}, title),
      message       = COALESCE(${message ?? null}, message),
      type          = COALESCE(${type ?? null}, type),
      scheduled_for = COALESCE(${scheduledFor ?? null}, scheduled_for),
      is_read       = COALESCE(${isRead ?? null}, is_read),
      reference_id  = COALESCE(${referenceId ?? null}, reference_id)
    WHERE reminder_id = ${reminderId}
    RETURNING *
  `;
  return NextResponse.json(mapRow(rows[0] as Record<string, unknown>));
}

export async function DELETE(req: NextRequest, { params }: Params) {
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
  const existing = await sql`SELECT * FROM reminders WHERE reminder_id = ${reminderId}`;
  if (!existing.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (Number((existing[0] as Record<string, unknown>).user_id) !== tokenUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await sql`DELETE FROM reminders WHERE reminder_id = ${reminderId}`;
  return NextResponse.json({ deleted: true });
}
