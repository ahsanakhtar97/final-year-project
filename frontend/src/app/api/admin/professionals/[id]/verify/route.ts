import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`SELECT role FROM users WHERE user_id = ${userId} LIMIT 1`;
  return rows[0]?.role === 'admin';
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const body = await req.json();
    const { verified } = body as { verified: boolean };

    if (typeof verified !== 'boolean') {
      return NextResponse.json({ error: '`verified` must be a boolean' }, { status: 400 });
    }

    const sql = getDb();
    const updated = await sql`
      UPDATE users
      SET verified = ${verified}
      WHERE user_id = ${targetId}
        AND role IN ('psychiatrist', 'psychologist')
      RETURNING user_id, name, verified
    `;

    if (!updated.length) {
      return NextResponse.json({ error: 'Professional not found' }, { status: 404 });
    }

    const r = updated[0] as Record<string, unknown>;
    return NextResponse.json({
      userId: r.user_id,
      name: r.name,
      verified: r.verified,
      message: verified ? 'Professional verified successfully' : 'Professional verification revoked',
    });
  } catch (err) {
    console.error('PATCH /api/admin/professionals/[id]/verify error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
