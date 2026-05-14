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
    const { role, verified } = body as { role?: string; verified?: boolean };

    const sql = getDb();
    const updated = await sql`
      UPDATE users
      SET
        role     = COALESCE(${role ?? null}, role),
        verified = COALESCE(${verified ?? null}, verified)
      WHERE user_id = ${targetId}
      RETURNING user_id, name, email, role, verified, xp, level, bio, credentials, years_experience, languages, fee_text, created_at
    `;

    if (!updated.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const r = updated[0] as Record<string, unknown>;
    return NextResponse.json({
      userId: r.user_id,
      name: r.name,
      email: r.email,
      role: r.role,
      verified: r.verified ?? false,
      xp: r.xp ?? 0,
      level: r.level ?? 1,
      bio: r.bio ?? null,
      credentials: r.credentials ?? null,
      yearsExperience: r.years_experience ?? null,
      languages: r.languages ?? null,
      feeText: r.fee_text ?? null,
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error('PATCH /api/admin/users/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const deleted = await sql`
      DELETE FROM users WHERE user_id = ${targetId} RETURNING user_id
    `;

    if (!deleted.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ message: 'User deleted', userId: deleted[0].user_id });
  } catch (err) {
    console.error('DELETE /api/admin/users/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
