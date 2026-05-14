import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToSleep(r: Record<string, unknown>) {
  return {
    sleepLogId: r.sleep_log_id,
    userId: r.user_id,
    date: String(r.date).slice(0, 10),
    hours: Number(r.hours),
    quality: r.quality,
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
      SELECT * FROM sleep_logs
      WHERE user_id = ${userId}
        AND date >= NOW() - INTERVAL '${days} days'
      ORDER BY date DESC
    `;
    return NextResponse.json(rows.map((r) => rowToSleep(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/sleep error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const p = await req.json();
    if (!p.date || p.hours === undefined || p.quality === undefined) {
      return NextResponse.json({ error: 'date, hours, and quality are required' }, { status: 400 });
    }
    const note = p.note ?? null;
    const sql = getDb();
    const rows = await sql`
      INSERT INTO sleep_logs (user_id, date, hours, quality, note)
      VALUES (${userId}, ${p.date}, ${p.hours}, ${p.quality}, ${note})
      ON CONFLICT (user_id, date)
      DO UPDATE SET
        hours = EXCLUDED.hours,
        quality = EXCLUDED.quality,
        note = EXCLUDED.note,
        updated_at = NOW()
      RETURNING *
    `;
    return NextResponse.json(rowToSleep(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/sleep error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
