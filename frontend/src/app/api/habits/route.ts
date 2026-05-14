import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function mapHabit(r: Record<string, unknown>) {
  return {
    habitId: r.habit_id,
    habitName: r.habit_name,
    categoryId: r.category_id,
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM habits ORDER BY habit_name`;
    return NextResponse.json(rows.map(mapHabit));
  } catch (err) {
    console.error('GET /api/habits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { habitName, categoryId } = body;
    if (!habitName || !categoryId) {
      return NextResponse.json({ error: 'habitName and categoryId are required' }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO habits (habit_name, category_id) VALUES (${habitName}, ${categoryId}) RETURNING *
    `;
    return NextResponse.json(mapHabit(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/habits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
