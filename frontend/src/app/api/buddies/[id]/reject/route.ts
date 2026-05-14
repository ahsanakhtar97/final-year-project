import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const connectionId = Number(id);
  if (isNaN(connectionId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const rows = await sql`
      UPDATE buddy_connections
      SET status = 'rejected'
      WHERE connection_id = ${connectionId} AND receiver_id = ${userId}
      RETURNING *
    `;

    if (!rows.length) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
    }

    const r = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      connectionId: r.connection_id,
      requesterId: r.requester_id,
      receiverId: r.receiver_id,
      status: r.status,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error('PATCH /api/buddies/[id]/reject error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
