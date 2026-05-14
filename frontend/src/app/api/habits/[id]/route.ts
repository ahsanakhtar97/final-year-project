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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const habitId = Number(id);
    if (isNaN(habitId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const rows = await sql`SELECT * FROM habits WHERE habit_id = ${habitId}`;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapHabit(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('GET /api/habits/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const habitId = Number(id);
    if (isNaN(habitId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM habits WHERE habit_id = ${habitId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/habits/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
