import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function mapRow(row: Record<string, unknown>) {
  return {
    reportId: row.report_id,
    userId: row.user_id,
    summary: row.summary,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

type Params = { params: Promise<{ userId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  const { userId: userIdStr } = await params;
  const userId = Number(userIdStr);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }
  if (tokenUserId === null || tokenUserId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM reports
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rows.map(mapRow));
  } catch {
    return NextResponse.json([]);
  }
}
