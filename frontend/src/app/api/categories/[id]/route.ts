import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function mapCategory(r: Record<string, unknown>) {
  return {
    categoryId: r.category_id,
    categoryName: r.category_name,
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
    const rows = await sql`SELECT * FROM categories WHERE category_id = ${categoryId}`;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(mapCategory(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('GET /api/categories/[id] error:', err);
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
    const categoryId = Number(id);
    if (isNaN(categoryId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    await sql`DELETE FROM categories WHERE category_id = ${categoryId}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/categories/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
