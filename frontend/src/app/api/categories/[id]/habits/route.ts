import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
    const categoryId = Number(id);
    if (isNaN(categoryId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const rows = await sql`
      SELECT * FROM habits WHERE category_id = ${categoryId} ORDER BY habit_name
    `;
    return NextResponse.json(rows.map(mapHabit));
  } catch (err) {
    console.error('GET /api/categories/[id]/habits error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
