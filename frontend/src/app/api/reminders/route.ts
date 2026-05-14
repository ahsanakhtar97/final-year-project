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
    SELECT * FROM reminders
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows.map(mapRow));
}

export async function POST(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  if (tokenUserId === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { userId, title, message, type, scheduledFor, referenceId } = body;

  if (!userId || !title) {
    return NextResponse.json({ error: 'userId and title are required' }, { status: 400 });
  }
  if (tokenUserId !== Number(userId)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();
  const rows = await sql`
    INSERT INTO reminders (user_id, title, message, type, scheduled_for, reference_id)
    VALUES (
      ${userId},
      ${title},
      ${message ?? null},
      ${type ?? 'custom'},
      ${scheduledFor ?? null},
      ${referenceId ?? null}
    )
    RETURNING *
  `;
  return NextResponse.json(mapRow(rows[0] as Record<string, unknown>), { status: 201 });
}
