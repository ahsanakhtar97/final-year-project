import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToUser(r: Record<string, unknown>) {
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
    verified: r.verified ?? false,
    avatarUrl: r.avatar_url ?? null,
    createdAt: r.created_at,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT user_id, name, email, role, bio, credentials, languages, fee_text, years_experience, verified, avatar_url, created_at
      FROM users
      WHERE user_id = ${targetId}
      LIMIT 1
    `;

    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToUser(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('GET /api/users/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  // Only allow editing own profile (role check for admin would require decoding full token)
  if (targetId !== tokenUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, bio, credentials, languages, feeText, yearsExperience, avatarUrl } = body;

    const sql = getDb();
    const updated = await sql`
      UPDATE users
      SET
        name             = COALESCE(${name ?? null}, name),
        email            = COALESCE(${email ?? null}, email),
        bio              = COALESCE(${bio ?? null}, bio),
        credentials      = COALESCE(${credentials ?? null}, credentials),
        languages        = COALESCE(${languages ?? null}, languages),
        fee_text         = COALESCE(${feeText ?? null}, fee_text),
        years_experience = COALESCE(${yearsExperience ?? null}, years_experience),
        avatar_url       = COALESCE(${avatarUrl ?? null}, avatar_url)
      WHERE user_id = ${targetId}
      RETURNING user_id, name, email, role
    `;

    if (!updated.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const user = updated[0] as Record<string, unknown>;
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const accessToken = jwt.sign(
      { sub: user.user_id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({ accessToken, message: 'Profile updated' });
  } catch (err) {
    console.error('PATCH /api/users/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (targetId !== tokenUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDb();
    await sql`DELETE FROM users WHERE user_id = ${targetId}`;
    return NextResponse.json({ message: 'User deleted' });
  } catch (err) {
    console.error('DELETE /api/users/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
