import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToTask(r: Record<string, unknown>) {
  return {
    taskId: r.task_id,
    userId: r.user_id,
    title: r.title,
    description: r.description,
    taskStatus: r.task_status,
    priority: r.priority,
    dueDate: r.due_date ?? null,
    completedAt: r.completed_at ?? null,
    focusMinutes: r.focus_minutes ?? 0,
    createdAt: r.created_at,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  if (targetId !== tokenUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM tasks
      WHERE user_id = ${targetId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(rows.map(r => rowToTask(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/users/[id]/tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
