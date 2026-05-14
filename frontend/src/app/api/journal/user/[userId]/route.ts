import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToEntry(r: Record<string, unknown>) {
  return {
    entryId: r.entry_id,
    userId: r.user_id,
    content: r.content,
    sentimentScore: r.sentiment_score ?? null,
    feedbackEnglish: r.feedback_english ?? null,
    feedbackUrdu: r.feedback_urdu ?? null,
    createdAt: r.created_at,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = parseInt(params.userId, 10);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  if (userId !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM journal_entries
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows.map((r) => rowToEntry(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/journal/user/[userId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
