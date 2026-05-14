import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT user_id, name, email, role, avatar_url, verified, bio, credentials, languages, fee_text, years_experience
      FROM users
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (!rows.length) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const user = rows[0];
    return NextResponse.json({
      userId: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatar_url,
      verified: user.verified,
      bio: user.bio ?? null,
      credentials: user.credentials ?? null,
      languages: user.languages ?? null,
      feeText: user.fee_text ?? null,
      yearsExperience: user.years_experience ?? null,
    });
  } catch (err) {
    console.error('Me error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
