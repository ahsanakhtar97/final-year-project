import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function mapCategory(r: Record<string, unknown>) {
  return {
    categoryId: r.category_id,
    categoryName: r.category_name,
    createdAt: r.created_at,
  };
}

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM categories ORDER BY category_name`;
    return NextResponse.json(rows.map(mapCategory));
  } catch (err) {
    console.error('GET /api/categories error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { categoryName } = body;
    if (!categoryName) {
      return NextResponse.json({ error: 'categoryName is required' }, { status: 400 });
    }
    const sql = getDb();
    const rows = await sql`
      INSERT INTO categories (category_name) VALUES (${categoryName}) RETURNING *
    `;
    return NextResponse.json(mapCategory(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/categories error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
