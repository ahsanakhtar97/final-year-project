import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`SELECT role FROM users WHERE user_id = ${userId} LIMIT 1`;
  return rows[0]?.role === 'admin';
}

function rowToUser(r: Record<string, unknown>) {
  return {
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
  };
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const role = searchParams.get('role') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.max(1, Number(searchParams.get('limit') ?? '15'));
  const offset = (page - 1) * limit;

  try {
    const sql = getDb();

    let rows: Record<string, unknown>[];
    let countRows: Record<string, unknown>[];

    if (search && role) {
      const pattern = `%${search}%`;
      rows = await sql`
        SELECT user_id, name, email, role, verified, xp, level, bio, credentials, years_experience, languages, fee_text, created_at
        FROM users
        WHERE (name ILIKE ${pattern} OR email ILIKE ${pattern})
          AND role = ${role}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Record<string, unknown>[];
      countRows = await sql`
        SELECT COUNT(*)::int AS count FROM users
        WHERE (name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`}) AND role = ${role}
      ` as Record<string, unknown>[];
    } else if (search) {
      const pattern = `%${search}%`;
      rows = await sql`
        SELECT user_id, name, email, role, verified, xp, level, bio, credentials, years_experience, languages, fee_text, created_at
        FROM users
        WHERE name ILIKE ${pattern} OR email ILIKE ${pattern}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Record<string, unknown>[];
      countRows = await sql`
        SELECT COUNT(*)::int AS count FROM users
        WHERE name ILIKE ${`%${search}%`} OR email ILIKE ${`%${search}%`}
      ` as Record<string, unknown>[];
    } else if (role) {
      rows = await sql`
        SELECT user_id, name, email, role, verified, xp, level, bio, credentials, years_experience, languages, fee_text, created_at
        FROM users
        WHERE role = ${role}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Record<string, unknown>[];
      countRows = await sql`
        SELECT COUNT(*)::int AS count FROM users WHERE role = ${role}
      ` as Record<string, unknown>[];
    } else {
      rows = await sql`
        SELECT user_id, name, email, role, verified, xp, level, bio, credentials, years_experience, languages, fee_text, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Record<string, unknown>[];
      countRows = await sql`
        SELECT COUNT(*)::int AS count FROM users
      ` as Record<string, unknown>[];
    }

    const total = countRows[0].count as number;

    return NextResponse.json({
      users: rows.map(rowToUser),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
