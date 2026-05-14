import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function rowToProf(r: Record<string, unknown>) {
  return {
    userId: r.user_id,
    name: r.name,
    email: r.email,
    role: r.role,
    bio: r.bio ?? null,
    credentials: r.credentials ?? null,
    languages: r.languages ?? null,
    feeText: r.fee_text ?? null,
    yearsExperience: r.years_experience ?? null,
    verified: r.verified,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT user_id, name, email, role, bio, credentials, languages, fee_text, years_experience, verified
      FROM users
      WHERE user_id = ${userId}
        AND role IN ('psychiatrist', 'psychologist')
      LIMIT 1
    `;

    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToProf(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('GET /api/professionals/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
