import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToTask(r: Record<string, unknown>) {
  return {
    taskId: r.task_id,
    userId: r.user_id,
    title: r.title,
    description: r.description ?? null,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ?? null,
    focusMinutes: r.focus_minutes ?? 0,
    completedAt: r.completed_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const taskId = Number(id);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json();
    const { minutes } = body;
    if (typeof minutes !== 'number') {
      return NextResponse.json({ error: 'minutes must be a number' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      UPDATE tasks
      SET focus_minutes = focus_minutes + ${minutes}, updated_at = NOW()
      WHERE task_id = ${taskId} AND user_id = ${userId}
      RETURNING *
    `;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToTask(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('PATCH /api/tasks/[id]/focus error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
