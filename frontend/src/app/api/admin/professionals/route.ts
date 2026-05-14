import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`SELECT role FROM users WHERE user_id = ${userId} LIMIT 1`;
  return rows[0]?.role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT user_id, name, email, role, credentials, years_experience, bio, languages, fee_text, verified, created_at
      FROM users
      WHERE role IN ('psychiatrist', 'psychologist')
      ORDER BY created_at DESC
    `;

    return NextResponse.json(
      (rows as Record<string, unknown>[]).map((r) => ({
        userId: r.user_id,
        name: r.name,
        email: r.email,
        role: r.role,
        verified: r.verified ?? false,
        credentials: r.credentials ?? null,
        yearsExperience: r.years_experience ?? null,
        bio: r.bio ?? null,
        languages: r.languages ?? null,
        feeText: r.fee_text ?? null,
        createdAt: r.created_at,
      }))
    );
  } catch (err) {
    console.error('GET /api/admin/professionals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
