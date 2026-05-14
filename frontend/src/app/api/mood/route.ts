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
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM mood_logs
      WHERE user_id = ${userId}
        AND date >= NOW() - INTERVAL '${days} days'
      ORDER BY date DESC
    `;
    return NextResponse.json(rows.map((r) => rowToMood(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/mood error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const p = await req.json();
    if (!p.date || !p.score) {
      return NextResponse.json({ error: 'date and score are required' }, { status: 400 });
    }
    const emotionTags = Array.isArray(p.emotionTags)
      ? p.emotionTags.join(',')
      : (p.emotionTags ?? '');
    const note = p.note ?? null;
    const sql = getDb();
    const rows = await sql`
      INSERT INTO mood_logs (user_id, date, score, emotion_tags, note)
      VALUES (${userId}, ${p.date}, ${p.score}, ${emotionTags}, ${note})
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        score = EXCLUDED.score,
        emotion_tags = EXCLUDED.emotion_tags,
        note = EXCLUDED.note,
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json(rowToMood(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/mood error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
