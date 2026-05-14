import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function POST(req: NextRequest) {
  const requesterId = getUserIdFromRequest(req);
  if (!requesterId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }

    if (Number(receiverId) === requesterId) {
      return NextResponse.json({ error: 'Cannot send buddy request to yourself' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      INSERT INTO buddy_connections (requester_id, receiver_id, status)
      VALUES (${requesterId}, ${receiverId}, 'pending')
      RETURNING *
    `;

    const r = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      connectionId: r.connection_id,
      requesterId: r.requester_id,
      receiverId: r.receiver_id,
      status: r.status,
      createdAt: r.created_at,
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/buddies/request error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
