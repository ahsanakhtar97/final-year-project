import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = parseInt(params.userId, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  if (userId !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '7', 10);

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT AVG(s.sentiment_score) as average, COUNT(*) as count
      FROM (
        SELECT sentiment_score
        FROM journal_entries
        WHERE user_id = ${userId} AND sentiment_score IS NOT NULL
        ORDER BY created_at DESC
        LIMIT ${limit}
      ) s
    `;
    const row = rows[0] as Record<string, unknown>;
    return NextResponse.json({
      average: row.average !== null && row.average !== undefined ? Number(row.average) : null,
      count: Number(row.count),
    });
  } catch (err) {
    console.error('GET /api/journal/user/[userId]/mood error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
