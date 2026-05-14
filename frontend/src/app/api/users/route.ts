import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT user_id, name, email, role
      FROM users
      WHERE user_id != ${userId}
      ORDER BY name
    `;

    return NextResponse.json(
      rows.map((r: Record<string, unknown>) => ({
        userId: r.user_id,
        name: r.name,
        email: r.email,
        role: r.role,
      }))
    );
  } catch (err) {
    console.error('GET /api/users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
