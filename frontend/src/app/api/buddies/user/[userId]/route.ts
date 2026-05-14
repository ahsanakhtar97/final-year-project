import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToConnection(r: Record<string, unknown>) {
  return {
    connectionId: r.connection_id,
    requesterId: r.requester_id,
    receiverId: r.receiver_id,
    status: r.status,
    createdAt: r.created_at,
    requester: {
      userId: r.req_id,
      name: r.req_name,
      email: r.req_email,
      role: r.req_role,
    },
    receiver: {
      userId: r.rec_id,
      name: r.rec_name,
      email: r.rec_email,
      role: r.rec_role,
    },
  };
}

type Params = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await params;
  const targetId = Number(userId);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT bc.*,
        r.user_id  AS req_id, r.name  AS req_name,  r.email  AS req_email,  r.role  AS req_role,
        rc.user_id AS rec_id, rc.name AS rec_name, rc.email AS rec_email, rc.role AS rec_role
      FROM buddy_connections bc
      JOIN users r  ON r.user_id  = bc.requester_id
      JOIN users rc ON rc.user_id = bc.receiver_id
      WHERE bc.requester_id = ${targetId} OR bc.receiver_id = ${targetId}
      ORDER BY bc.created_at DESC
    `;

    return NextResponse.json(rows.map(r => rowToConnection(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/buddies/user/[userId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
