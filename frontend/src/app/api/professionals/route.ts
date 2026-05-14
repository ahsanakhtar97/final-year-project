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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');

    const sql = getDb();
    let rows;

    if (role === 'psychiatrist' || role === 'psychologist') {
      rows = await sql`
        SELECT user_id, name, email, role, bio, credentials, languages, fee_text, years_experience, verified
        FROM users
        WHERE role = ${role} AND verified = true
        ORDER BY name
      `;
    } else {
      rows = await sql`
        SELECT user_id, name, email, role, bio, credentials, languages, fee_text, years_experience, verified
        FROM users
        WHERE role IN ('psychiatrist', 'psychologist') AND verified = true
        ORDER BY name
      `;
    }

    return NextResponse.json(rows.map(r => rowToProf(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/professionals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
