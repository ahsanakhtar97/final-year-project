import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToMood(r: Record<string, unknown>) {
  return {
    moodLogId: r.mood_log_id,
    userId: r.user_id,
    date: String(r.date).slice(0, 10),
    score: r.score,
    emotionTags: r.emotion_tags ? String(r.emotion_tags).split(',').filter(Boolean) : [],
    note: r.note ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM mood_logs
      WHERE user_id = ${userId} AND date = CURRENT_DATE
    `;
    if (rows.length === 0) return NextResponse.json(null);
    return NextResponse.json(rowToMood(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('GET /api/mood/today error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
