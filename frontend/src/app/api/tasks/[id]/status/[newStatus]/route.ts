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
  { params }: { params: Promise<{ id: string; newStatus: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, newStatus } = await params;
    const taskId = Number(id);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const existing = await sql`SELECT task_id FROM tasks WHERE task_id = ${taskId} AND user_id = ${userId}`;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let rows;
    if (newStatus === 'completed') {
      rows = await sql`
        UPDATE tasks
        SET status = ${newStatus}, completed_at = NOW(), updated_at = NOW()
        WHERE task_id = ${taskId} AND user_id = ${userId}
        RETURNING *
      `;
    } else {
      rows = await sql`
        UPDATE tasks
        SET status = ${newStatus}, completed_at = NULL, updated_at = NOW()
        WHERE task_id = ${taskId} AND user_id = ${userId}
        RETURNING *
      `;
    }

    return NextResponse.json(rowToTask(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('PATCH /api/tasks/[id]/status/[newStatus] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
